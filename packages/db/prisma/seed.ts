// Seeds an operator org with the two real client datasets (QST + Fincantieri),
// engineers, the asset hierarchy, document folders, the full form-template set,
// and PPM frequency rules. Run with: pnpm --filter @fsm/db seed
import { PrismaClient, Prisma } from '@prisma/client';
import { ALL_FORM_TEMPLATES, computeNextDue } from '@fsm/shared';

const prisma = new PrismaClient();

const SITE_FOLDERS = [
  'PPM Reports',
  'Service Reports',
  'Wiring Diagrams',
  'Manuals & Instructions',
  'Thermography',
  'RAMS / Method Statements',
  'Calibration Reports',
  'Commissioning Docs',
  'Correspondence',
];

async function main() {
  const org = await prisma.organization.create({ data: { name: 'QEY Technical' } });

  // ── Users / engineers ──
  const engineers = await Promise.all(
    [
      { fullName: 'Lee Moore', email: 'l.moore@qey.ae', role: 'ops_manager' as const, skills: ['chiller', 'controls'] },
      { fullName: 'Muhammad Shakeel', email: 'm.shakeel@qey.ae', role: 'engineer' as const, skills: ['crac', 'fan_wall'] },
      { fullName: 'Evgenii', email: 'e.k@qey.ae', role: 'engineer' as const, skills: ['chiller', 'rca'] },
      { fullName: 'Andrei', email: 'a.p@qey.ae', role: 'engineer' as const, skills: ['electrical'] },
      { fullName: 'Jon', email: 'j.d@qey.ae', role: 'engineer' as const, skills: ['reactive'] },
    ].map((u) =>
      prisma.user.create({
        data: {
          orgId: org.id,
          email: u.email,
          fullName: u.fullName,
          role: u.role,
          engineer: { create: { skills: u.skills } },
        },
      }),
    ),
  );

  // ── Form templates ──
  const templates = await Promise.all(
    ALL_FORM_TEMPLATES.map((t) =>
      prisma.formTemplate.create({
        data: {
          name: t.title,
          jobType: (t.jobType ?? 'ppm') as any,
          assetType: (t.assetType ?? null) as any,
          ppmScope: (t.ppmScope ?? null) as any,
          schema: t as unknown as Prisma.InputJsonValue,
          requiresSignoff: t.requiresSignoff ?? true,
        },
      }),
    ),
  );
  const tplByKey = Object.fromEntries(ALL_FORM_TEMPLATES.map((t, i) => [t.key, templates[i]]));

  // ── Clients → contracts → sites → assets ──
  const clientsData = [
    {
      name: 'QST HVAC',
      crm: 'crm_4830012000000123',
      contract: { name: 'O&M — DMMA / DMMB Chiller Plant', start: '2024-01-01', end: '2026-12-31' },
      sites: [
        { type: 'data_centre' as const, name: 'DC1 — DMMA', code: 'DMMA', region: 'Riyadh, KSA', assets: [
          { type: 'chiller' as const, tag: 'MEP1-CH1', mfr: 'Climaveneta' },
          { type: 'fan_wall' as const, tag: 'DH1-09' },
          { type: 'crac' as const, tag: 'IF1-02' },
        ] },
        { type: 'data_centre' as const, name: 'DC2 — DMMB', code: 'DMMB', region: 'Riyadh, KSA', assets: [
          { type: 'chiller' as const, tag: 'DMMB-CH1', mfr: 'Climaveneta' },
        ] },
      ],
    },
    {
      name: 'Fincantieri Qatar',
      crm: 'crm_4830012000000456',
      contract: { name: 'Fleet PPM — 6 Vessels', start: '2024-06-01', end: '2027-05-31' },
      sites: [
        { type: 'vessel' as const, name: 'Al Zubarah', code: 'F101', region: 'Doha', assets: [
          { type: 'chiller' as const, tag: 'F101-CH1' },
          { type: 'chiller' as const, tag: 'F101-CH2' },
        ] },
        { type: 'vessel' as const, name: 'Musherib', code: 'Q61', region: 'Doha', assets: [
          { type: 'chiller' as const, tag: 'Q61-CH1' },
        ] },
      ],
    },
  ];

  for (const cd of clientsData) {
    const client = await prisma.client.create({
      data: { orgId: org.id, name: cd.name, zohoCrmAccountId: cd.crm },
    });
    const contract = await prisma.contract.create({
      data: {
        clientId: client.id,
        name: cd.contract.name,
        startDate: new Date(cd.contract.start),
        endDate: new Date(cd.contract.end),
      },
    });
    for (const sd of cd.sites) {
      const site = await prisma.site.create({
        data: {
          clientId: client.id,
          contractId: contract.id,
          siteType: sd.type,
          name: sd.name,
          code: sd.code,
          region: sd.region,
        },
      });
      for (const f of SITE_FOLDERS) {
        await prisma.folder.create({ data: { siteId: site.id, name: f } });
      }
      for (const ad of sd.assets) {
        const asset = await prisma.asset.create({
          data: { siteId: site.id, assetType: ad.type, tag: ad.tag, manufacturer: (ad as any).mfr },
        });
        // 6-month PPM rule per asset, mapped to the right template
        const tplKey =
          ad.type === 'chiller' ? 'chiller_ppm_6m' : ad.type === 'crac' ? 'crac_ppm' : 'fan_wall_ppm';
        const anchor = new Date('2026-01-15');
        await prisma.ppmFrequencyRule.create({
          data: {
            assetId: asset.id,
            frequency: 'six_month',
            scopeLabel: '6 Monthly',
            anchorDate: anchor,
            nextDueDate: computeNextDue('six_month', anchor, null),
            formTemplateId: tplByKey[tplKey]?.id,
          },
        });
      }
    }
  }

  console.log(`Seeded org ${org.name}: ${engineers.length} engineers, ${templates.length} form templates, 2 clients.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
