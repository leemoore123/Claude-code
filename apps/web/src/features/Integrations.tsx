import { IconPlugConnected, IconRefresh, IconAlertTriangle } from '@tabler/icons-react';
import { PageHeader } from '../components/Shell';

const SERVICES = [
  { name: 'Zoho CRM', scope: 'Clients · Contacts · Contracts (Deals)', status: 'connected', detail: 'Bidirectional sync · last run 4 min ago' },
  { name: 'Zoho Books', scope: 'Invoices from signed-off jobs', status: 'connected', detail: 'Outbound · 12 invoices this month' },
  { name: 'Zoho Sign', scope: 'Client counter-signature on forms', status: 'connected', detail: 'Webhook active' },
  { name: 'Zoho Inventory', scope: 'Parts catalogue & usage', status: 'not_connected', detail: 'Connect to pull item catalogue' },
];

export function Integrations() {
  return (
    <>
      <PageHeader
        title="Zoho Integration"
        sub="Region-aware OAuth (accounts.zoho.sa) · tokens encrypted at rest"
        action={
          <button className="btn btn-outline">
            <IconRefresh size={14} /> Run reconciliation
          </button>
        }
      />
      <div className="mb-5 grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {SERVICES.map((s) => (
          <div key={s.name} className="rounded-card border border-line bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <IconPlugConnected size={18} className={s.status === 'connected' ? 'text-ok' : 'text-muted'} />
                <span className="text-[14px] font-semibold">{s.name}</span>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  s.status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {s.status === 'connected' ? 'Connected' : 'Not connected'}
              </span>
            </div>
            <div className="mb-1 text-[12px] text-ink">{s.scope}</div>
            <div className="text-[11px] text-muted">{s.detail}</div>
            <button className={`btn mt-3 w-full justify-center ${s.status === 'connected' ? 'btn-outline' : 'btn-primary'}`}>
              {s.status === 'connected' ? 'Manage' : 'Connect'}
            </button>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-white">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3 text-[13px] font-semibold">
          <IconAlertTriangle size={16} className="text-warn" /> Sync issues — manual resolution
        </div>
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-muted">
              <th className="px-4 py-2.5">Entity</th>
              <th className="px-4 py-2.5">Field</th>
              <th className="px-4 py-2.5">FSM value</th>
              <th className="px-4 py-2.5">Zoho value</th>
              <th className="px-4 py-2.5">Resolve</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-50">
              <td className="px-4 py-2.5 font-medium">QST HVAC (client)</td>
              <td className="px-4 py-2.5">billing_address</td>
              <td className="px-4 py-2.5 text-muted">Riyadh DC Park, Bldg 4</td>
              <td className="px-4 py-2.5 text-muted">Riyadh DC Park, Bldg 4A</td>
              <td className="px-4 py-2.5">
                <div className="flex gap-1.5">
                  <button className="rounded border border-line px-2 py-0.5 text-[10px] hover:border-brand hover:text-brand">Keep FSM</button>
                  <button className="rounded border border-line px-2 py-0.5 text-[10px] hover:border-brand hover:text-brand">Keep Zoho</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div className="px-4 py-2.5 text-[11px] text-muted">
          Policy: field-level last-writer-wins by modified time · billing fields default to Books · operational fields to FSM.
        </div>
      </div>
    </>
  );
}
