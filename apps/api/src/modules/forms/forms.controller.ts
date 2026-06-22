import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { FormsService } from './forms.service';

@Controller()
export class FormsController {
  constructor(private readonly forms: FormsService) {}

  @Get('form-templates')
  templates() {
    return this.forms.listTemplates();
  }

  @Get('submissions')
  submissions(@Query('jobId') jobId?: string) {
    return this.forms.listSubmissions(jobId);
  }

  @Get('submissions/:id')
  submission(@Param('id') id: string) {
    return this.forms.getSubmission(id);
  }

  @Post('submissions')
  create(
    @Body() body: { jobId: string; formTemplateId: string; assetId?: string; engineerId?: string },
  ) {
    return this.forms.createSubmission(body);
  }

  @Patch('submissions/:id/answers')
  save(@Param('id') id: string, @Body('answers') answers: Record<string, unknown>) {
    return this.forms.saveAnswers(id, answers ?? {});
  }

  @Post('submissions/:id/complete')
  complete(@Param('id') id: string) {
    return this.forms.complete(id);
  }

  @Post('submissions/:id/sign')
  sign(
    @Param('id') id: string,
    @Body() body: { signerRole: 'engineer' | 'client_rep'; signerName: string; signerEmail?: string; imageDataUrl?: string },
  ) {
    return this.forms.sign(id, body);
  }

  @Post('submissions/:id/pdf')
  pdf(@Param('id') id: string) {
    return this.forms.generatePdf(id);
  }
}
