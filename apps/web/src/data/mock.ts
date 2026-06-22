// Phase 0/1 mock data — the multi-client model populated with the two real
// client datasets (QST data centres + Fincantieri fleet). Swapped for live API
// data in later phases; shape mirrors the Prisma model.

import type { AssetType, JobStatus, PpmFrequency, SiteType } from '@fsm/shared';

export interface Engineer {
  id: string;
  name: string;
  role: string;
  skills: string[];
  phone: string;
  email: string;
}

export interface Contact {
  id: string;
  clientId: string;
  siteId?: string;
  name: string;
  title: string;
  function: string;
  phone: string;
  email: string;
}

export interface Asset {
  id: string;
  siteId: string;
  type: AssetType;
  tag: string;
  manufacturer?: string;
  model?: string;
}

export interface Site {
  id: string;
  clientId: string;
  type: SiteType;
  name: string;
  code: string;
  region: string;
  hull?: string;
  assetCount: number;
}

export interface Contract {
  id: string;
  clientId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface Client {
  id: string;
  name: string;
  sector: string;
  region: string;
  status: string;
  zohoCrmAccountId?: string;
}

export interface Job {
  id: string;
  clientId: string;
  siteId: string;
  type: 'ppm' | 'corrective' | 'install' | 'survey';
  ppmScope?: PpmFrequency;
  title: string;
  status: JobStatus;
  engineerId?: string;
  start: string; // ISO date
  durationDays: number;
  assetTag?: string;
}

export const ENGINEERS: Engineer[] = [
  { id: 'e1', name: 'Lee Moore', role: 'Lead Engineer', skills: ['chiller', 'controls', 'RAMS'], phone: '+971 50 XXX XXXX', email: 'l.moore@qey.ae' },
  { id: 'e2', name: 'Muhammad Shakeel', role: 'Site Technician', skills: ['crac', 'fan_wall', 'ppm'], phone: '+971 55 XXX XXXX', email: 'm.shakeel@qey.ae' },
  { id: 'e3', name: 'Evgenii', role: 'Technical Director', skills: ['chiller', 'rca', 'commissioning'], phone: '+971 50 XXX XXXX', email: 'e.k@qey.ae' },
  { id: 'e4', name: 'Andrei', role: 'Senior Engineer', skills: ['electrical', 'commissioning'], phone: '+971 50 XXX XXXX', email: 'a.p@qey.ae' },
  { id: 'e5', name: 'Jon', role: 'Site Engineer', skills: ['reactive', 'compressor'], phone: '+971 55 XXX XXXX', email: 'j.d@qey.ae' },
];

export const CLIENTS: Client[] = [
  { id: 'c-qst', name: 'QST HVAC', sector: 'Data Centres', region: 'Riyadh, KSA', status: 'active', zohoCrmAccountId: 'crm_4830012000000123' },
  { id: 'c-fin', name: 'Fincantieri Qatar', sector: 'Naval / Marine', region: 'Doha, Qatar', status: 'active', zohoCrmAccountId: 'crm_4830012000000456' },
];

export const CONTRACTS: Contract[] = [
  { id: 'ct-qst-om', clientId: 'c-qst', name: 'O&M — DMMA / DMMB Chiller Plant', status: 'active', startDate: '2024-01-01', endDate: '2026-12-31' },
  { id: 'ct-fin-ppm', clientId: 'c-fin', name: 'Fleet PPM — 6 Vessels (OPV/CRV)', status: 'active', startDate: '2024-06-01', endDate: '2027-05-31' },
];

export const SITES: Site[] = [
  { id: 's-dc1', clientId: 'c-qst', type: 'data_centre', name: 'DC1 — DMMA', code: 'DMMA', region: 'Riyadh, KSA', assetCount: 9 },
  { id: 's-dc2', clientId: 'c-qst', type: 'data_centre', name: 'DC2 — DMMB', code: 'DMMB', region: 'Riyadh, KSA', assetCount: 7 },
  { id: 's-f101', clientId: 'c-fin', type: 'vessel', name: 'Al Zubarah', code: 'F101', region: 'Doha', hull: 'H/N 6291', assetCount: 2 },
  { id: 's-f102', clientId: 'c-fin', type: 'vessel', name: 'Damsah', code: 'F102', region: 'Doha', hull: 'H/N 6292', assetCount: 2 },
  { id: 's-f103', clientId: 'c-fin', type: 'vessel', name: 'Al Khor', code: 'F103', region: 'Doha', hull: 'H/N 6293', assetCount: 2 },
  { id: 's-f104', clientId: 'c-fin', type: 'vessel', name: 'Semaisma', code: 'F104', region: 'Doha', hull: 'H/N 6294', assetCount: 2 },
  { id: 's-q61', clientId: 'c-fin', type: 'vessel', name: 'Musherib', code: 'Q61', region: 'Doha', hull: 'H/N 6276', assetCount: 4 },
  { id: 's-q62', clientId: 'c-fin', type: 'vessel', name: 'Sheraouh', code: 'Q62', region: 'Doha', hull: 'H/N 6297', assetCount: 4 },
];

export const ASSETS: Asset[] = [
  { id: 'a1', siteId: 's-dc1', type: 'chiller', tag: 'MEP1-CH1', manufacturer: 'Climaveneta', model: 'FR2-G05-Z' },
  { id: 'a2', siteId: 's-dc1', type: 'chiller', tag: 'MEP3-CH2', manufacturer: 'Climaveneta' },
  { id: 'a3', siteId: 's-dc1', type: 'fan_wall', tag: 'DH1-09' },
  { id: 'a4', siteId: 's-dc1', type: 'crac', tag: 'IF1-02' },
  { id: 'a5', siteId: 's-dc2', type: 'chiller', tag: 'DMMB-CH1', manufacturer: 'Climaveneta' },
  { id: 'a6', siteId: 's-dc2', type: 'fan_wall', tag: 'DMMB-FW3' },
  { id: 'a7', siteId: 's-f101', type: 'chiller', tag: 'F101-CH1' },
  { id: 'a8', siteId: 's-f101', type: 'chiller', tag: 'F101-CH2' },
  { id: 'a9', siteId: 's-q61', type: 'chiller', tag: 'Q61-CH1' },
];

export const CONTACTS: Contact[] = [
  { id: 'k1', clientId: 'c-qst', name: 'Naga', title: 'Facilities Manager', function: 'Client rep, works approval, permit to work', phone: '+966 5X XXX XXXX', email: 'naga@qst.com' },
  { id: 'k2', clientId: 'c-qst', name: 'Abubakr', title: 'Technical Lead', function: 'Technical oversight, RCA review, sign-off', phone: '+966 5X XXX XXXX', email: 'abubakr@qst.com' },
  { id: 'k3', clientId: 'c-fin', siteId: 's-f101', name: 'Francesco Bordone', title: 'ISS Manager', function: 'POC & supervisor for on board activities', phone: '+974 6629 7037', email: 'Francesco.Bordone@doha.fincantieri.com' },
  { id: 'k4', clientId: 'c-fin', name: 'Massimiliano Deidda', title: 'Lead Project Engineer', function: 'POC for QENF & supplier, activity planning', phone: '+974 3991 4967', email: 'Massimiliano.Deidda@doha.fincantieri.com' },
  { id: 'k5', clientId: 'c-fin', siteId: 's-q61', name: 'Marianna Penna', title: 'ISS Manager', function: 'POC & supervisor for on board activities', phone: '+974 6684 0747', email: 'Marianna.Penna@doha.fincantieri.com' },
];

// Schedule — current week-ish jobs across both clients
function d(offsetDays: number): string {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

export const JOBS: Job[] = [
  { id: 'j1', clientId: 'c-qst', siteId: 's-dc1', type: 'ppm', ppmScope: 'six_month', title: 'Chiller 6M PPM — MEP1-CH1', status: 'scheduled', engineerId: 'e1', start: d(0), durationDays: 1, assetTag: 'MEP1-CH1' },
  { id: 'j2', clientId: 'c-qst', siteId: 's-dc1', type: 'ppm', ppmScope: 'six_month', title: 'CRAC PPM — IF1-02', status: 'dispatched', engineerId: 'e2', start: d(0), durationDays: 1, assetTag: 'IF1-02' },
  { id: 'j3', clientId: 'c-qst', siteId: 's-dc2', type: 'corrective', title: 'Expansion PCB replacement', status: 'in_progress', engineerId: 'e3', start: d(1), durationDays: 1, assetTag: 'DMMB-CH1' },
  { id: 'j4', clientId: 'c-fin', siteId: 's-f101', type: 'ppm', ppmScope: 'one_year', title: 'Chiller Annual PPM — F101-CH1', status: 'scheduled', engineerId: 'e1', start: d(2), durationDays: 2, assetTag: 'F101-CH1' },
  { id: 'j5', clientId: 'c-fin', siteId: 's-q61', type: 'ppm', ppmScope: 'six_month', title: 'Chiller 6M PPM — Q61-CH1', status: 'scheduled', engineerId: 'e4', start: d(3), durationDays: 1, assetTag: 'Q61-CH1' },
  { id: 'j6', clientId: 'c-qst', siteId: 's-dc1', type: 'ppm', ppmScope: 'six_month', title: 'Fan Wall PPM — DH1-09', status: 'completed', engineerId: 'e2', start: d(-2), durationDays: 1, assetTag: 'DH1-09' },
  { id: 'j7', clientId: 'c-qst', siteId: 's-dc1', type: 'ppm', ppmScope: 'three_year', title: 'Chiller 3Y Major — MEP3-CH2', status: 'signed_off', engineerId: 'e3', start: d(-5), durationDays: 3, assetTag: 'MEP3-CH2' },
  { id: 'j8', clientId: 'c-fin', siteId: 's-q62', type: 'survey', title: 'Condition survey — Sheraouh chillers', status: 'scheduled', engineerId: 'e5', start: d(4), durationDays: 1 },
];

// Document folders per site (breadcrumb browser)
export const SITE_FOLDERS = [
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

export function clientName(id: string) {
  return CLIENTS.find((c) => c.id === id)?.name ?? '—';
}
export function siteName(id: string) {
  return SITES.find((s) => s.id === id)?.name ?? '—';
}
export function engineerName(id?: string) {
  return ENGINEERS.find((e) => e.id === id)?.name ?? 'Unassigned';
}
