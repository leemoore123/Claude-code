import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

/** Serves locally-stored objects (dev driver). Supabase issues its own URLs. */
@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get('*')
  async get(@Param('0') objectPath: string, @Res() res: Response) {
    try {
      const bytes = await this.storage.read(objectPath);
      const isPdf = objectPath.endsWith('.pdf');
      res.setHeader('content-type', isPdf ? 'application/pdf' : 'application/octet-stream');
      res.send(bytes);
    } catch {
      throw new NotFoundException(`Object ${objectPath} not found`);
    }
  }
}
