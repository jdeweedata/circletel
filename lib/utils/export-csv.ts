import { Product } from '@/lib/types/products';

/**
 * Convert products to CSV format
 */
export function convertProductsToCSV(products: Product[]): string {
  if (products.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Name',
    'SKU',
    'Category',
    'Status',
    'Active',
    'Featured',
    'Popular',
    'Service Type',
    'Description',
    'Base Price (ZAR)',
    'Cost Price (ZAR)',
    'Download Speed',
    'Upload Speed',
    'Data Cap',
    'Contract Months',
    'Provider',
    'Technology',
    'Created At',
    'Updated At',
  ];

  // Create CSV rows
  const rows = products.map(product => {
    const row = [
      product.id,
      escapeCSVField(product.name),
      escapeCSVField(product.sku),
      escapeCSVField(product.category),
      escapeCSVField(product.status || ''),
      product.is_active ? 'Yes' : 'No',
      product.is_featured ? 'Yes' : 'No',
      product.is_popular ? 'Yes' : 'No',
      escapeCSVField(product.service_type || ''),
      escapeCSVField(product.description || ''),
      product.base_price_zar,
      product.cost_price_zar,
      product.pricing?.download_speed || '',
      product.pricing?.upload_speed || '',
      product.pricing?.data_cap || '',
      product.metadata?.contract_months || '',
      escapeCSVField(product.metadata?.provider_name || product.metadata?.provider || ''),
      escapeCSVField(product.metadata?.technology || ''),
      new Date(product.created_at).toISOString(),
      new Date(product.updated_at).toISOString(),
    ];

    return row.join(',');
  });

  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Escape CSV field to handle commas, quotes, and newlines
 */
function escapeCSVField(field: string): string {
  if (!field) return '';

  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }

  return field;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    // Create a link to the file
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
 * Generate filename for CSV export
 */
export function generateCSVFilename(prefix: string = 'export'): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${prefix}-${year}-${month}-${day}.csv`;
}
