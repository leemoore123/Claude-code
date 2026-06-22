import { useState } from 'react';
import { Shell, type ViewId } from '../components/Shell';
import { Dashboard } from '../features/Dashboard';
import { Clients } from '../features/Clients';
import { Sites } from '../features/Sites';
import { Schedule } from '../features/Schedule';
import { Forms } from '../features/forms/Forms';
import { Contacts } from '../features/Contacts';
import { Integrations } from '../features/Integrations';

export function App() {
  const [view, setView] = useState<ViewId>('dashboard');

  return (
    <Shell view={view} setView={setView}>
      {view === 'dashboard' && <Dashboard />}
      {view === 'clients' && <Clients />}
      {view === 'sites' && <Sites />}
      {view === 'schedule' && <Schedule />}
      {view === 'forms' && <Forms />}
      {view === 'contacts' && <Contacts />}
      {view === 'integrations' && <Integrations />}
    </Shell>
  );
}
