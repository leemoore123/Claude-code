import { IconPlus, IconBuildingFactory2, IconShip, IconCircleCheck } from '@tabler/icons-react';
import { PageHeader } from '../components/Shell';
import { CLIENTS, CONTRACTS, SITES } from '../data/mock';

export function Clients() {
  return (
    <>
      <PageHeader
        title="Clients & Contracts"
        sub="Multi-client portfolio — synced with Zoho CRM"
        action={
          <button className="btn btn-primary">
            <IconPlus size={14} /> New client
          </button>
        }
      />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3.5">
        {CLIENTS.map((c) => {
          const contracts = CONTRACTS.filter((ct) => ct.clientId === c.id);
          const sites = SITES.filter((s) => s.clientId === c.id);
          return (
            <div key={c.id} className="overflow-hidden rounded-card border border-line bg-white transition hover:border-brand hover:shadow-md">
              <div className="flex items-center justify-between bg-navy-800 px-4 py-3.5 text-white">
                <div>
                  <div className="font-mono text-[14px] font-medium tracking-wide">{c.name}</div>
                  <div className="mt-0.5 text-[10px] text-white/45">{c.sector} · {c.region}</div>
                </div>
                {c.sector.includes('Naval') ? <IconShip size={20} className="text-white/60" /> : <IconBuildingFactory2 size={20} className="text-white/60" />}
              </div>
              <div className="space-y-2 px-4 py-3.5">
                {contracts.map((ct) => (
                  <div key={ct.id} className="flex items-start gap-2 text-[12px]">
                    <IconCircleCheck size={15} className="mt-0.5 flex-shrink-0 text-ok" />
                    <div>
                      <div className="font-medium">{ct.name}</div>
                      <div className="text-[11px] text-muted">{ct.startDate} → {ct.endDate}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-line bg-slate-50 px-4 py-2.5 text-[11px] text-muted">
                <span>{sites.length} site{sites.length !== 1 ? 's' : ''}</span>
                <span className="font-mono text-[10px]">CRM: {c.zohoCrmAccountId?.slice(-6)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
