import React from 'react';

import {
  ChartPanel,
  DataTable,
  FilterToolbar,
  InspectorPanel,
  MetricPanel,
} from '@/components/backend';

describe('console backend components', () => {
  it('uses dense table spacing and empty state copy', () => {
    const table = DataTable({
      columns: [
        { id: 'name', header: 'Name', accessor: (row: { name: string }) => row.name },
        { id: 'status', header: 'Status', accessor: (row: { status: string }) => row.status },
      ],
      rows: [],
      emptyTitle: 'No customers found',
      emptyDescription: 'Adjust your filters and try again.',
    });

    expect(React.isValidElement(table)).toBe(true);
    expect(table.props.className).toContain('rounded-lg');
    expect(JSON.stringify(table)).toContain('No customers found');
    expect(JSON.stringify(table)).toContain('text-xs');
  });

  it('keeps inspector panels sticky on desktop and sheet-backed on mobile', () => {
    const inspector = InspectorPanel({
      title: 'Details',
      open: true,
      onOpenChange: jest.fn(),
      children: <div>Notes</div>,
    });

    expect(React.isValidElement(inspector)).toBe(true);
    expect(JSON.stringify(inspector)).toContain('hidden xl:block');
    expect(JSON.stringify(inspector)).toContain('xl:hidden');
    expect(JSON.stringify(inspector)).toContain('Details');
  });

  it('provides flat panel primitives for filters and metrics', () => {
    const filterToolbar = FilterToolbar({ children: <button>Filter</button> });
    const metricPanel = MetricPanel({ label: 'Requests', value: '665' });
    const chartPanel = ChartPanel({ title: 'Edge Requests', children: <div>chart</div> });

    expect(filterToolbar.props.className).toContain('rounded-lg');
    expect(metricPanel.props.className).toContain('border-gray-200');
    expect(chartPanel.props.className).toContain('min-h');
  });
});
