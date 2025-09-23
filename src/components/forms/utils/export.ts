// Data export utilities

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  filename?: string;
  includeTimestamp?: boolean;
}

export class FormExporter {
  static exportToCSV(data: Record<string, unknown>, filename?: string): void {
    const headers = Object.keys(data);
    const values = Object.values(data);

    let csvContent = headers.map(header => `"${header}"`).join(',') + '\n';
    csvContent += values.map(value => `"${String(value || '')}"`).join(',') + '\n';

    this.downloadFile(csvContent, 'text/csv', filename || 'form_data.csv');
  }

  static exportToJSON(data: Record<string, unknown>, filename?: string): void {
    const jsonContent = JSON.stringify(data, null, 2);
    this.downloadFile(jsonContent, 'application/json', filename || 'form_data.json');
  }

  static exportFormData(
    data: Record<string, unknown>,
    clientName: string,
    formType: string,
    options: ExportOptions = { format: 'csv' }
  ): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const baseFilename = `${clientName}_${formType}${options.includeTimestamp ? `_${timestamp}` : ''}`;

    // Add metadata
    const exportData = {
      exportTimestamp: new Date().toISOString(),
      clientName,
      formType,
      ...data
    };

    switch (options.format) {
      case 'csv':
        this.exportToCSV(exportData, options.filename || `${baseFilename}.csv`);
        break;
      case 'json':
        this.exportToJSON(exportData, options.filename || `${baseFilename}.json`);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static downloadFile(content: string, mimeType: string, filename: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  }

  // Convert form data to a format suitable for Supabase Edge Functions
  static prepareForSubmission(data: Record<string, unknown>): Record<string, unknown> {
    return {
      ...data,
      submittedAt: new Date().toISOString(),
      // Remove any file objects or non-serializable data
      ...Object.fromEntries(
        Object.entries(data).filter(([_, value]) =>
          value !== null &&
          value !== undefined &&
          typeof value !== 'function' &&
          !(value instanceof File)
        )
      )
    };
  }
}