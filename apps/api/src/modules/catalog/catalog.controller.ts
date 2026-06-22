import { Controller, Get, Param, Query } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller()
export class CatalogController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('clients')
  clients() {
    return this.prisma.client.findMany({
      orderBy: { name: 'asc' },
      include: {
        contracts: true,
        _count: { select: { sites: true } },
      },
    });
  }

  @Get('sites')
  sites(@Query('clientId') clientId?: string) {
    return this.prisma.site.findMany({
      where: { clientId },
      orderBy: { name: 'asc' },
      include: {
        client: { select: { name: true } },
        assets: true,
        _count: { select: { folders: true, assets: true } },
      },
    });
  }

  @Get('sites/:id')
  site(@Param('id') id: string) {
    return this.prisma.site.findUnique({
      where: { id },
      include: { client: true, assets: true, folders: { include: { documents: true } } },
    });
  }

  @Get('engineers')
  engineers() {
    return this.prisma.user.findMany({
      where: { role: 'engineer', active: true },
      orderBy: { fullName: 'asc' },
      include: { engineer: true },
    });
  }

  @Get('contacts')
  contacts(@Query('clientId') clientId?: string) {
    return this.prisma.contact.findMany({
      where: { clientId },
      orderBy: { name: 'asc' },
      include: { client: { select: { name: true } }, site: { select: { name: true } } },
    });
  }
}
