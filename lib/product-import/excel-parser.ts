/**
 * Product Import Excel Parser
 * Extracts structured product data from Excel workbooks
 */

export interface ParsedProduct {
  name: string;
  speed: string;
  regularPrice: number;
  promoPrice?: number;
  router: {
    model: string;
    included: boolean;
    rentalFee?: number;
    upfrontContribution?: number;
  };
  installationFee: number;
  totalFirstMonth: number;
  costBreakdown?: {
    dfaWholesale?: number;
    staticIP?: number;
    infrastructure?: number;
    markup?: number;
    [key: string]: number | undefined;
  };
  features?: string[];
  notes?: string;
}

export interface ImportMetadata {
  title: string;
  version: string;
  category: string;
  sourceFile: string;
  importDate: string;
  totalProducts: number;
}

export interface ParsedImport {
  metadata: ImportMetadata;
  products: ParsedProduct[];
  rawData: any; // Original Excel data for reference
}

/**
 * Parse price string (e.g., "R 1 699.00" or "R -") to number
 */
function parsePrice(priceStr: string | number): number {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr || priceStr === 'R -' || priceStr === '-') return 0;

  const cleaned = priceStr.replace(/[R\s,]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Parse speed (e.g., "10/10 Mbps" or "25/25 Mbps")
 */
function parseSpeed(speedStr: string): string {
  return speedStr.trim();
}

/**
 * Parse router information
 */
function parseRouter(routerStr: string): ParsedProduct['router'] {
  const included = routerStr.includes('(included)');
  const model = routerStr.replace(/\(included\)/i, '').replace(/\*/g, '').trim();

  // Check for upfront contribution or rental in notes
  const upfrontContribution = routerStr.includes('*') ? 500 : undefined;
  const rentalFee = routerStr.includes('**') ?
    (model.includes('RG-EG305GH') ? 99 : 149) : undefined;

  return {
    model,
    included,
    rentalFee,
    upfrontContribution
  };
}

/**
 * Parse BizFibre Connect Excel sheet
 */
export function parseBizFibreConnectSheet(sheetData: any[]): ParsedProduct[] {
  const products: ParsedProduct[] = [];

  // Find the product pricing header row (row 7 in 1-indexed)
  const headerRowIndex = sheetData.findIndex(row =>
    row[0] === 'Package' && row[1] === 'Speed'
  );

  if (headerRowIndex === -1) {
    throw new Error('Could not find product pricing header in Excel sheet');
  }

  // Parse product rows (rows 8-12 in 1-indexed, which is headerRowIndex+1 to headerRowIndex+5)
  for (let i = headerRowIndex + 1; i < sheetData.length; i++) {
    const row = sheetData[i];

    // Stop at empty row or detail breakdown section
    if (!row || row.length === 0 || row[0] === '' || row[0]?.includes('Detailed Cost Breakdown')) {
      break;
    }

    // Skip note rows
    if (row[0]?.includes('*Requires') || row[0]?.includes('**Available')) {
      continue;
    }

    const [packageName, speed, regularPrice, promoPrice, router, installationFee, totalFirstMonth] = row;

    if (!packageName || !speed) continue;

    products.push({
      name: packageName.trim(),
      speed: parseSpeed(speed),
      regularPrice: parsePrice(regularPrice),
      promoPrice: parsePrice(promoPrice) || undefined,
      router: parseRouter(router),
      installationFee: parsePrice(installationFee),
      totalFirstMonth: parsePrice(totalFirstMonth.split('(')[0]), // Extract first value before promo
      features: [],
      notes: ''
    });
  }

  return products;
}

/**
 * Parse detailed cost breakdown for each product
 */
export function parseCostBreakdown(sheetData: any[], productName: string): ParsedProduct['costBreakdown'] {
  const breakdown: ParsedProduct['costBreakdown'] = {};

  // Find the section for this product
  const sectionStart = sheetData.findIndex(row =>
    row[0]?.includes(productName) || row[0]?.includes(productName.split(' ').pop() || '')
  );

  if (sectionStart === -1) return breakdown;

  // Parse cost components
  for (let i = sectionStart + 1; i < Math.min(sectionStart + 20, sheetData.length); i++) {
    const row = sheetData[i];
    if (!row || row.length === 0 || row[0] === '') break;

    const component = row[0]?.toLowerCase();
    const cost = parsePrice(row[1]);

    if (component?.includes('dfa wholesale')) breakdown.dfaWholesale = cost;
    else if (component?.includes('static ip')) breakdown.staticIP = cost;
    else if (component?.includes('infrastructure')) breakdown.infrastructure = cost;
    else if (component?.includes('markup')) breakdown.markup = cost;
  }

  return breakdown;
}

/**
 * Main parser function
 */
export function parseProductExcel(
  workbookData: any,
  sourceFile: string
): ParsedImport {
  const sheetName = Object.keys(workbookData)[0];
  const sheetData = workbookData[sheetName].data;

  // Extract metadata
  const title = sheetData[0]?.[0] || 'Unknown Product';
  const version = sheetData[2]?.[0]?.match(/Version\s+([\d.]+)/i)?.[1] || '1.0';

  // Parse products
  const products = parseBizFibreConnectSheet(sheetData);

  // Add cost breakdown to each product
  products.forEach(product => {
    product.costBreakdown = parseCostBreakdown(sheetData, product.name);
  });

  const metadata: ImportMetadata = {
    title,
    version,
    category: 'BizFibre Connect',
    sourceFile,
    importDate: new Date().toISOString(),
    totalProducts: products.length
  };

  return {
    metadata,
    products,
    rawData: workbookData
  };
}
