import { isCustomPeriod } from '../PeriodPicker';
import {
  filterUsageReportSites,
  type UsageReportSite,
} from '../SiteMultiSelect';

describe('usage report controls', () => {
  it('identifies when custom date inputs are required', () => {
    expect(isCustomPeriod('custom')).toBe(true);
    expect(isCustomPeriod('monthly')).toBe(false);
  });

  it('filters sites by name, account number, and corporate account', () => {
    const sites: UsageReportSite[] = [
      {
        id: 'site-1',
        name: 'Alexandra Clinic',
        account_number: 'CT-UNJ-001',
        status: 'active',
        service_id: 'service-1',
        service_status: 'active',
        corporate_code: 'UNJ',
        account_name: 'Unjani Clinics',
      },
      {
        id: 'site-2',
        name: 'Rosebank Office',
        account_number: 'CT-BIZ-002',
        status: 'active',
        service_id: null,
        service_status: null,
        corporate_code: 'BIZ',
        account_name: 'Business Co',
      },
    ];
    expect(filterUsageReportSites(sites, 'Alexandra')).toEqual([sites[0]]);
    expect(filterUsageReportSites(sites, 'CT-BIZ')).toEqual([sites[1]]);
    expect(filterUsageReportSites(sites, 'unjani clinics')).toEqual([sites[0]]);
  });
});
