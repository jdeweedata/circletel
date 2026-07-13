import {
  dashboardKpis,
  dashboardNavigation,
  getDashboardTrendData,
} from '../page';

describe('CircleTel operations dashboard prototype data', () => {
  it('keeps the approved operational and executive KPIs', () => {
    expect(dashboardKpis.map((item) => item.label)).toEqual([
      'Active customers',
      'Monthly revenue',
      'Open tickets',
      'Network incidents',
    ]);
  });

  it('groups the approved staff navigation areas', () => {
    expect(dashboardNavigation.map((section) => section.label)).toEqual([
      'Customers',
      'Operations',
      'Finance',
      'System',
    ]);
  });

  it('returns the selected reporting series', () => {
    expect(getDashboardTrendData('6m')).toHaveLength(6);
    expect(getDashboardTrendData('12m')).toHaveLength(12);
    expect(getDashboardTrendData('30d')[0]).toEqual(
      expect.objectContaining({ label: 'Week 1' })
    );
  });
});
