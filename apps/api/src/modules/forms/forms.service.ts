import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { FormSchema } from '@fsm/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import { PdfService } from '../pdf/pdf.service';
import { buildReportHtml } from '../pdf/report-template';
import { validateSubmission } from './form-validation';

interface CreateSubmissionDto {
  jobId: string;
  formTemplateId: string;
  assetId?: string;
  engineerId?: string;
}

interface SignDto {
  signerRole: 'engineer' | 'client_rep';
  signerName: string;
  signerEmail?: string;
  /** PNG data URL from the drawn-signature pad. */
  imageDataUrl?: string;
}

@Injectable()
export class FormsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly pdf: PdfService,
  ) {}

  listTemplates() {
    return this.prisma.formTemplate.findMany({ where: { active: true }, orderBy: { name: 'asc' } });
  }

  listSubmissions(jobId?: string) {
    return this.prisma.formSubmission.findMany({
      where: { jobId },
      orderBy: { updatedAt: 'desc' },
      include: { formTemplate: { select: { name: true } }, signatures: true },
    });
  }

  async getSubmission(id: string) {
    const sub = await this.prisma.formSubmission.findUnique({
      where: { id },
      include: { signatures: true, formTemplate: true, asset: true },
    });
    if (!sub) throw new NotFoundException(`Submission ${id} not found`);
    return sub;
  }

  async createSubmission(dto: CreateSubmissionDto) {
    const tpl = await this.prisma.formTemplate.findUnique({ where: { id: dto.formTemplateId } });
    if (!tpl) throw new NotFoundException(`Template ${dto.formTemplateId} not found`);
    return this.prisma.formSubmission.create({
      data: {
        jobId: dto.jobId,
        assetId: dto.assetId,
        formTemplateId: tpl.id,
        templateVersion: tpl.version,
        schemaSnapshot: tpl.schema as object, // freeze the schema at submission time
        engineerId: dto.engineerId,
        status: 'draft',
      },
    });
  }

  /** Autosave — only while still a draft. */
  async saveAnswers(id: string, answers: Record<string, unknown>) {
    const sub = await this.getSubmission(id);
    if (sub.status !== 'draft') throw new BadRequestException('Submission is no longer a draft');
    return this.prisma.formSubmission.update({
      where: { id },
      data: { answers: answers as Prisma.InputJsonValue },
    });
  }

  async complete(id: string) {
    const sub = await this.getSubmission(id);
    const schema = sub.schemaSnapshot as unknown as FormSchema;
    const report = validateSubmission(schema, (sub.answers as Record<string, unknown>) ?? {});
    if (report.missingRequired.length) {
      throw new BadRequestException({
        message: 'Required fields are missing',
        missingRequired: report.missingRequired,
      });
    }
    const updated = await this.prisma.formSubmission.update({
      where: { id },
      data: { status: 'completed', completedAt: new Date() },
    });
    return { submission: updated, warnings: report.outOfRange };
  }

  async sign(id: string, dto: SignDto) {
    const sub = await this.getSubmission(id);
    let imagePath: string | undefined;
    if (dto.imageDataUrl?.startsWith('data:image')) {
      const b64 = dto.imageDataUrl.split(',')[1] ?? '';
      const bytes = Buffer.from(b64, 'base64');
      imagePath = await this.storage.put('signatures', `${sub.id}/${dto.signerRole}.png`, bytes, 'image/png');
    }
    const sig = await this.prisma.signature.create({
      data: {
        submissionId: sub.id,
        signerRole: dto.signerRole,
        signerName: dto.signerName,
        signerEmail: dto.signerEmail,
        method: 'drawn',
        imagePath,
        signedAt: new Date(),
      },
    });
    return sig;
  }

  /** Render the PDF, store it, and auto-file it into the site's report folder. */
  async generatePdf(id: string) {
    const sub = await this.prisma.formSubmission.findUnique({
      where: { id },
      include: {
        signatures: true,
        formTemplate: true,
        job: { include: { site: { include: { client: true } } } },
      },
    });
    if (!sub) throw new NotFoundException(`Submission ${id} not found`);

    const schema = sub.schemaSnapshot as unknown as FormSchema;
    const site = sub.job.site;

    // Inline signature images as data URLs so they embed in the PDF.
    const signatures = await Promise.all(
      sub.signatures.map(async (s) => ({
        signerRole: s.signerRole,
        signerName: s.signerName,
        signedAt: s.signedAt?.toISOString() ?? null,
        imagePath: s.imagePath ? `data:image/png;base64,${(await this.storage.read(s.imagePath)).toString('base64')}` : null,
      })),
    );

    const html = buildReportHtml(schema, (sub.answers as Record<string, unknown>) ?? {}, {
      reportTitle: sub.formTemplate.name,
      clientName: site.client.name,
      siteName: site.name,
      jobSummary: sub.job.summary ?? '',
      generatedAt: new Date().toLocaleString('en-GB'),
      signatures,
    });

    const pdf = await this.pdf.htmlToPdf(html);
    const objectPath = await this.storage.put('reports', `${site.id}/${sub.id}.pdf`, pdf, 'application/pdf');

    // Auto-file into the site's report folder.
    const folderName = sub.job.jobType === 'corrective' ? 'Service Reports' : 'PPM Reports';
    const folder =
      (await this.prisma.folder.findFirst({ where: { siteId: site.id, name: folderName } })) ??
      (await this.prisma.folder.create({ data: { siteId: site.id, name: folderName } }));

    const docName = `${sub.formTemplate.name} — ${site.name} — ${new Date().toISOString().slice(0, 10)}.pdf`;
    await this.prisma.document.upsert({
      where: { linkedSubmissionId: sub.id },
      create: {
        folderId: folder.id,
        name: docName,
        storagePath: objectPath,
        mime: 'application/pdf',
        linkedSubmissionId: sub.id,
      },
      update: { storagePath: objectPath, name: docName },
    });

    const pdfUrl = await this.storage.url(objectPath);
    await this.prisma.formSubmission.update({ where: { id: sub.id }, data: { pdfUrl } });
    return { pdfUrl, storagePath: objectPath, filedInto: folderName };
  }
}
