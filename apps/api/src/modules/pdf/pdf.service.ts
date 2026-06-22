import { Injectable, Logger } from '@nestjs/common';
import { chromium, type Browser } from 'playwright';

/**
 * Renders HTML → PDF with headless Chromium. Kept behind a service so it can be
 * moved to a BullMQ worker (off the request thread) once Redis is provisioned.
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (this.browser?.isConnected()) return this.browser;
    this.browser = await chromium.launch({
      // Honour an explicit path (CI / pinned install); else Playwright's default.
      executablePath: process.env.CHROMIUM_PATH || undefined,
      args: ['--no-sandbox'],
    });
    return this.browser;
  }

  async htmlToPdf(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: 'networkidle' });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', bottom: '12mm', left: '0', right: '0' },
      });
      this.logger.debug(`rendered PDF (${pdf.length} bytes)`);
      return pdf;
    } finally {
      await page.close();
    }
  }

  async onModuleDestroy() {
    await this.browser?.close();
  }
}
