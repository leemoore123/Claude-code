import { useQuery } from '@tanstack/react-query';
import { api, type ApiJob } from './api';
import { JOBS, ENGINEERS, siteName as mockSiteName, type Job as MockJob } from '../data/mock';

export interface BoardJob {
  id: string;
  title: string;
  status: string;
  engineerId?: string;
  start: string; // yyyy-mm-dd
  siteName: string;
  assetTag?: string;
}

export interface BoardEngineer {
  id: string;
  name: string;
  role: string;
}

function fromApi(j: ApiJob): BoardJob {
  return {
    id: j.id,
    title: j.summary ?? 'Job',
    status: j.status,
    engineerId: j.assignments?.[0]?.engineer.id,
    start: (j.scheduledStart ?? '').slice(0, 10),
    siteName: j.site?.name ?? '—',
    assetTag: j.jobAssets?.[0]?.asset.tag,
  };
}

function fromMock(j: MockJob): BoardJob {
  return {
    id: j.id,
    title: j.title,
    status: j.status,
    engineerId: j.engineerId,
    start: j.start,
    siteName: mockSiteName(j.siteId),
    assetTag: j.assetTag,
  };
}

const MOCK_JOBS: BoardJob[] = JOBS.map(fromMock);
const MOCK_ENGINEERS: BoardEngineer[] = ENGINEERS.map((e) => ({ id: e.id, name: e.name, role: e.role }));

/** Live API data with a transparent fallback to seed data when offline. */
export function useBoard() {
  const jobsQ = useQuery({ queryKey: ['jobs'], queryFn: api.jobs });
  const engQ = useQuery({ queryKey: ['engineers'], queryFn: api.engineers });

  const isLive = jobsQ.isSuccess && engQ.isSuccess;

  const jobs: BoardJob[] = isLive ? jobsQ.data!.map(fromApi) : MOCK_JOBS;
  const engineers: BoardEngineer[] = isLive
    ? engQ.data!.map((e) => ({ id: e.id, name: e.fullName, role: e.role }))
    : MOCK_ENGINEERS;

  return {
    jobs,
    engineers,
    isLive,
    isLoading: jobsQ.isLoading || engQ.isLoading,
  };
}
