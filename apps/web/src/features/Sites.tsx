import { useState } from 'react';
import {
  IconServer2,
  IconShip,
  IconArrowLeft,
  IconChevronRight,
  IconFolder,
  IconUpload,
} from '@tabler/icons-react';
import { PageHeader } from '../components/Shell';
import { AssetBadge } from '../lib/ui';
import { SITES, ASSETS, CLIENTS, SITE_FOLDERS, clientName, type Site } from '../data/mock';

export function Sites() {
  const [open, setOpen] = useState<Site | null>(null);
  if (open) return <SiteDetail site={open} onBack={() => setOpen(null)} />;

  return (
    <>
      <PageHeader title="Sites & Assets" sub="Data centres & vessels across all clients" />
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3.5">
        {SITES.map((s) => {
          const assets = ASSETS.filter((a) => a.siteId === s.id);
          return (
            <div
              key={s.id}
              onClick={() => setOpen(s)}
              className="cursor-pointer overflow-hidden rounded-card border border-line bg-white transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
            >
              <div className="flex items-center justify-between bg-navy-800 px-4 py-3.5 text-white">
                <div>
                  <div className="font-mono text-[14px] font-medium tracking-wide">{s.name}</div>
                  <div className="mt-0.5 text-[10px] text-white/45">
                    {clientName(s.clientId)} {s.hull ? `· ${s.hull}` : ''}
                  </div>
                </div>
                {s.type === 'vessel' ? <IconShip size={18} className="text-white/60" /> : <IconServer2 size={18} className="text-white/60" />}
              </div>
              <div className="px-4 py-3.5">
                <div className="mb-2 text-[11px] uppercase tracking-wide text-muted">
                  {s.region} · {s.code}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {assets.length ? assets.map((a) => <AssetBadge key={a.id} type={a.type} />) : <span className="text-[11px] text-muted">{s.assetCount} assets</span>}
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-line bg-slate-50 px-4 py-2.5 text-[11px] text-muted">
                <span>{s.assetCount} assets</span>
                <span className="font-medium text-brand">Open folder ›</span>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SiteDetail({ site, onBack }: { site: Site; onBack: () => void }) {
  const assets = ASSETS.filter((a) => a.siteId === site.id);
  const client = CLIENTS.find((c) => c.id === site.clientId);
  return (
    <>
      <PageHeader
        title={`${site.name} — Documents`}
        sub={`${client?.name} · ${site.region} · ${site.code}`}
        action={
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={onBack}>
              <IconArrowLeft size={14} /> All sites
            </button>
            <button className="btn btn-primary">
              <IconUpload size={14} /> Upload
            </button>
          </div>
        }
      />
      <div className="mb-4 flex items-center gap-1.5 text-[12px] text-muted">
        <span className="cursor-pointer text-brand" onClick={onBack}>All sites</span>
        <span className="text-line">/</span>
        <span>{site.name}</span>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-4">
        <div className="flex flex-col gap-0.5">
          {SITE_FOLDERS.map((f) => (
            <div key={f} className="flex cursor-pointer items-center gap-3 rounded-md border border-line bg-white px-3.5 py-2.5 transition hover:border-brand hover:bg-brand-light">
              <IconFolder size={20} className="text-brand" />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{f}</div>
                <div className="text-[11px] text-muted">Folder · synced to storage</div>
              </div>
              <IconChevronRight size={14} className="text-muted" />
            </div>
          ))}
        </div>

        <div className="h-fit overflow-hidden rounded-card border border-line bg-white">
          <div className="border-b border-line px-4 py-3 text-[13px] font-semibold">Assets on site</div>
          <div className="divide-y divide-slate-50">
            {assets.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <div className="font-mono text-[12px] font-medium">{a.tag}</div>
                  <div className="text-[11px] text-muted">{a.manufacturer ?? '—'} {a.model ?? ''}</div>
                </div>
                <AssetBadge type={a.type} />
              </div>
            ))}
            {!assets.length && <div className="px-4 py-6 text-center text-[12px] text-muted">No assets seeded</div>}
          </div>
        </div>
      </div>
    </>
  );
}
