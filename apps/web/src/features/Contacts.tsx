import { useState } from 'react';
import { IconSearch, IconPhone, IconMail } from '@tabler/icons-react';
import { PageHeader } from '../components/Shell';
import { CONTACTS, ENGINEERS, clientName } from '../data/mock';

export function Contacts() {
  const [q, setQ] = useState('');
  const [tab, setTab] = useState<'client' | 'engineers'>('client');

  const clientRows = CONTACTS.filter((c) =>
    [c.name, c.title, c.function, c.email].join(' ').toLowerCase().includes(q.toLowerCase()),
  );
  const engRows = ENGINEERS.filter((e) =>
    [e.name, e.role, e.skills.join(' '), e.email].join(' ').toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader title="Contacts" sub="Client representatives & field engineers" />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-line bg-white px-3 py-2">
          <IconSearch size={15} className="text-muted" />
          <input
            className="w-full bg-transparent text-[13px] outline-none"
            placeholder="Search name, role, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        {(['client', 'engineers'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md border px-3 py-2 text-[12px] font-medium ${
              tab === t ? 'border-brand bg-brand-light text-brand' : 'border-line bg-white text-muted'
            }`}
          >
            {t === 'client' ? 'Client contacts' : 'Engineers'}
          </button>
        ))}
      </div>

      <table className="w-full overflow-hidden rounded-card border border-line bg-white">
        <thead>
          <tr className="bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-muted">
            <th className="px-4 py-2.5">Name</th>
            <th className="px-4 py-2.5">{tab === 'client' ? 'Client' : 'Skills'}</th>
            <th className="px-4 py-2.5">Role / Function</th>
            <th className="px-4 py-2.5">Mobile</th>
            <th className="px-4 py-2.5">Email</th>
          </tr>
        </thead>
        <tbody className="text-[13px]">
          {tab === 'client'
            ? clientRows.map((c) => (
                <tr key={c.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold">{c.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-brand-light px-2 py-0.5 text-[10px] font-semibold uppercase text-brand">
                      {clientName(c.clientId)}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[11px] text-muted">
                    <span className="font-medium text-ink">{c.title}</span> — {c.function}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{c.phone}</td>
                  <td className="px-4 py-2.5">
                    <a href={`mailto:${c.email}`} className="font-mono text-[11px] text-brand hover:underline">
                      {c.email}
                    </a>
                  </td>
                </tr>
              ))
            : engRows.map((e) => (
                <tr key={e.id} className="border-t border-slate-50 hover:bg-slate-50/60">
                  <td className="px-4 py-2.5 font-semibold">{e.name}</td>
                  <td className="px-4 py-2.5 text-[11px] text-muted">{e.skills.join(', ')}</td>
                  <td className="px-4 py-2.5 text-[12px]">{e.role}</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]">{e.phone}</td>
                  <td className="px-4 py-2.5">
                    <a href={`mailto:${e.email}`} className="font-mono text-[11px] text-brand hover:underline">
                      {e.email}
                    </a>
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
      <div className="mt-3 flex gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1"><IconPhone size={12} /> tap mobile to copy (live build)</span>
        <span className="flex items-center gap-1"><IconMail size={12} /> mailto links active</span>
      </div>
    </>
  );
}
