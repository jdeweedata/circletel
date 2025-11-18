/**
 * Export Utilities
 * Functions for exporting data to CSV and Excel formats
 */

/**
 * Convert array of objects to CSV string
 */
export function convertToCSV(data: any[], headers?: string[]): string {
  if (data.length === 0) return '';

  // Get headers from first object if not provided
  const csvHeaders = headers || Object.keys(data[0]);

  // Create header row
  const headerRow = csvHeaders.join(',');

  // Create data rows
  const dataRows = data.map((item) => {
    return csvHeaders
      .map((header) => {
        const value = item[header];

        // Handle null/undefined
        if (value === null || value === undefined) return '';

        // Escape values containing commas, quotes, or newlines
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }

        return stringValue;
      })
      .join(',');
  });

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Export data to CSV file
 */
export function exportToCSV(data: any[], filename: string, headers?: string[]): void {
  const csv = convertToCSV(data, headers);
  downloadCSV(csv, filename);
}

/**
 * Export installations to CSV
 */
export interface InstallationExportData {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  installation_address: string;
  package_name: string;
  package_speed: string;
  scheduled_date: string | null;
  scheduled_time_slot: string | null;
  status: string;
  technician_name: string | null;
  technician_phone: string | null;
  created_at: string;
}

export function exportInstallationsToCSV(installations: InstallationExportData[]): void {
  const headers = [
    'order_number',
    'customer_name',
    'customer_phone',
    'customer_email',
    'installation_address',
    'package_name',
    'package_speed',
    'scheduled_date',
    'scheduled_time_slot',
    'status',
    'technician_name',
    'technician_phone',
    'created_at',
  ];

  const headerLabels = [
    'Order Number',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Installation Address',
    'Package Name',
    'Package Speed',
    'Scheduled Date',
    'Time Slot',
    'Status',
    'Technician Name',
    'Technician Phone',
    'Created Date',
  ];

  // Transform data for export
  const exportData = installations.map((inst) => ({
    'Order Number': inst.order_number,
    'Customer Name': inst.customer_name,
    'Customer Phone': inst.customer_phone,
    'Customer Email': inst.customer_email,
    'Installation Address': inst.installation_address,
    'Package Name': inst.package_name,
    'Package Speed': inst.package_speed,
    'Scheduled Date': inst.scheduled_date || 'Not scheduled',
    'Time Slot': inst.scheduled_time_slot || 'Not scheduled',
    'Status': inst.status.replace('installation_', '').replace('_', ' '),
    'Technician Name': inst.technician_name || 'Not assigned',
    'Technician Phone': inst.technician_phone || 'N/A',
    'Created Date': inst.created_at,
  }));

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `installations_${timestamp}.csv`;

  exportToCSV(exportData, filename);
}

/**
 * Export data to Excel (XLSX) format
 * Note: This creates a simple CSV that Excel can open
 * For true .xlsx format, consider using a library like xlsx or exceljs
 */
export function exportToExcel(data: any[], filename: string, headers?: string[]): void {
  // For now, use CSV format with .xlsx extension
  // Excel will open it correctly
  const csv = convertToCSV(data, headers);
  const blob = new Blob([csv], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename.replace('.csv', '.xlsx'));
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
