/**
 * FICA/RICA Document Types and Validation
 * South African compliance requirements
 */

// =====================================================
// FICA (Financial Intelligence Centre Act)
// =====================================================

export type FICADocumentType =
  | 'id_document'           // SA ID, Smart Card
  | 'passport'              // Foreign passport
  | 'drivers_license'       // SA Driver's License
  | 'proof_of_address'      // Utility bill, bank statement
  | 'proof_of_banking';     // Bank statement, bank letter

export interface FICADocument {
  id: string;
  type: FICADocumentType;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;

  // Document metadata
  documentNumber?: string;  // ID number, passport number
  expiryDate?: Date;        // For passports, licenses
  issueDate?: Date;
}

// =====================================================
// RICA (Regulation of Interception of Communications)
// =====================================================

export type RICADocumentType =
  | 'id_document'           // SA ID (required)
  | 'proof_of_residence'    // Proof of residential address
  | 'passport'              // For non-SA residents
  | 'asylum_document';      // For asylum seekers

export interface RICADocument {
  id: string;
  type: RICADocumentType;
  fileName: string;
  fileSize: number;
  fileUrl?: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;

  // RICA-specific metadata
  idNumber?: string;
  passportNumber?: string;
  residentialAddress?: string;
}

// =====================================================
// Combined Compliance Document
// =====================================================

export interface ComplianceDocument {
  id: string;
  orderId: string;
  customerId: string;

  // Document classification
  category: 'fica' | 'rica';
  type: FICADocumentType | RICADocumentType;

  // File information
  fileName: string;
  fileSize: number;
  filePath: string;
  fileUrl?: string;
  mimeType: string;

  // Status
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;

  // Metadata
  metadata?: {
    documentNumber?: string;
    expiryDate?: string;
    issueDate?: string;
    idNumber?: string;
    passportNumber?: string;
  };

  // Audit
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// FICA Requirements
// =====================================================

export const FICA_REQUIREMENTS = {
  identity: {
    title: 'Proof of Identity (FICA)',
    description: 'One of the following documents',
    required: true,
    options: [
      {
        type: 'id_document' as FICADocumentType,
        label: 'South African ID / Smart Card',
        description: 'Clear copy of both sides',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024, // 5MB
      },
      {
        type: 'passport' as FICADocumentType,
        label: 'Passport',
        description: 'Valid passport (photo page)',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
      {
        type: 'drivers_license' as FICADocumentType,
        label: 'Driver\'s License',
        description: 'Valid SA driver\'s license',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
    ],
  },
  address: {
    title: 'Proof of Address (FICA)',
    description: 'Not older than 3 months',
    required: true,
    options: [
      {
        type: 'proof_of_address' as FICADocumentType,
        label: 'Utility Bill (Electricity, Water, Rates)',
        description: 'Not older than 3 months',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
      {
        type: 'proof_of_address' as FICADocumentType,
        label: 'Bank Statement',
        description: 'Not older than 3 months',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
      {
        type: 'proof_of_address' as FICADocumentType,
        label: 'Lease Agreement',
        description: 'Current signed lease',
        acceptedFormats: ['PDF'],
        maxSize: 10 * 1024 * 1024,
      },
    ],
  },
};

// =====================================================
// RICA Requirements
// =====================================================

export const RICA_REQUIREMENTS = {
  identity: {
    title: 'Proof of Identity (RICA)',
    description: 'Required for service activation',
    required: true,
    options: [
      {
        type: 'id_document' as RICADocumentType,
        label: 'South African ID / Smart Card',
        description: 'Clear copy of both sides',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
      {
        type: 'passport' as RICADocumentType,
        label: 'Passport (Non-SA Residents)',
        description: 'Valid passport with visa',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
      {
        type: 'asylum_document' as RICADocumentType,
        label: 'Asylum Seeker Document',
        description: 'Valid asylum document',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
    ],
  },
  residence: {
    title: 'Proof of Residence (RICA)',
    description: 'Current residential address',
    required: true,
    options: [
      {
        type: 'proof_of_residence' as RICADocumentType,
        label: 'Proof of Residential Address',
        description: 'Utility bill, rates notice, or lease (≤3 months)',
        acceptedFormats: ['PDF', 'JPG', 'PNG'],
        maxSize: 5 * 1024 * 1024,
      },
    ],
  },
};

// =====================================================
// Validation Functions
// =====================================================

export const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export const ACCEPTED_FILE_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_FILE_SIZE_LARGE = 10 * 1024 * 1024; // 10MB (for lease agreements)

/**
 * Validate file type
 */
export function isValidFileType(file: File): boolean {
  return ACCEPTED_FILE_TYPES.includes(file.type as any);
}

/**
 * Validate file size
 */
export function isValidFileSize(file: File, maxSize: number = MAX_FILE_SIZE): boolean {
  return file.size <= maxSize;
}

/**
 * Validate file extension
 */
export function isValidFileExtension(fileName: string): boolean {
  const extension = fileName.toLowerCase().slice(fileName.lastIndexOf('.'));
  return ACCEPTED_FILE_EXTENSIONS.includes(extension as any);
}

/**
 * Get file extension
 */
export function getFileExtension(fileName: string): string {
  return fileName.slice(fileName.lastIndexOf('.')).toLowerCase();
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate complete FICA/RICA submission
 */
export function validateComplianceSubmission(documents: ComplianceDocument[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check FICA requirements
  const ficaIdentity = documents.find(
    d => d.category === 'fica' && ['id_document', 'passport', 'drivers_license'].includes(d.type)
  );
  if (!ficaIdentity) {
    errors.push('FICA: Proof of identity document required');
  }

  const ficaAddress = documents.find(
    d => d.category === 'fica' && d.type === 'proof_of_address'
  );
  if (!ficaAddress) {
    errors.push('FICA: Proof of address document required');
  }

  // Check RICA requirements
  const ricaIdentity = documents.find(
    d => d.category === 'rica' && ['id_document', 'passport', 'asylum_document'].includes(d.type)
  );
  if (!ricaIdentity) {
    errors.push('RICA: Proof of identity document required');
  }

  const ricaResidence = documents.find(
    d => d.category === 'rica' && d.type === 'proof_of_residence'
  );
  if (!ricaResidence) {
    errors.push('RICA: Proof of residence document required');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get document type label
 */
export function getDocumentTypeLabel(type: FICADocumentType | RICADocumentType): string {
  const labels: Record<string, string> = {
    id_document: 'South African ID',
    passport: 'Passport',
    drivers_license: 'Driver\'s License',
    proof_of_address: 'Proof of Address',
    proof_of_banking: 'Proof of Banking',
    proof_of_residence: 'Proof of Residence',
    asylum_document: 'Asylum Document',
  };
  return labels[type] || type;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: 'pending' | 'approved' | 'rejected'): string {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };
  return colors[status];
}
