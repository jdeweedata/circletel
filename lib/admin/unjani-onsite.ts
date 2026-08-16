import { canIssueRfsCertificate } from '@/lib/billing/unjani-connect-rules';

export const ONSITE_CHECKLIST = [
  { id: 'arrive', label: 'Arrive / access / power (2–4 hours on site)' },
  { id: 'survey_speedtest', label: 'Before Ookla screenshot (survey)' },
  { id: 'install', label: 'Install router + one Wi-Fi AP; record serials' },
  { id: 'commission_speedtest', label: 'After Ookla screenshot (commissioning)' },
  { id: 'job_card', label: 'Site photos and job card pack' },
  { id: 'approve', label: 'Operations approves the job card' },
] as const;

export function canGoLiveFromFulfilment(input: {
  stockStatus?: string | null;
  kitIssuedAt?: string | null;
  jobCardPath?: string | null;
  jobCardApprovedAt?: string | null;
  surveySpeedtestPath?: string | null;
  commissionSpeedtestPath?: string | null;
}): boolean {
  if (input.stockStatus !== 'reserved' || !input.kitIssuedAt) return false;
  return canIssueRfsCertificate({
    jobCardPath: input.jobCardPath,
    jobCardApprovedAt: input.jobCardApprovedAt,
    surveySpeedtestPath: input.surveySpeedtestPath,
    commissionSpeedtestPath: input.commissionSpeedtestPath,
  });
}
