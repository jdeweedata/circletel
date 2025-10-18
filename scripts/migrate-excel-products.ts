import { ExcelProductRow, ProductCreateInput } from '@/lib/types/products';
import { productService } from '@/lib/services/product-service';

// Excel data as extracted from the workbook
const residentialData: ExcelProductRow[] = [
  {
    name: 'SkyFibre Home Lite 50',
    category: 'Residentail',
    subcategory: 'Uncapped Wireless',
    deal_id: 'RES-SKY-50-2025',
    sku: 'SKY-50-HOME-LITE',
    speed_download: '50',
    speed_upload: '20',
    speed_info: '50/20 Mbps',
    provider: 'SkyFibre',
    contract_term_months: null,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Standard 5G Router',
    regular_price_ex_vat: 781.73913,
    regular_price_inc_vat: 899,
    promo_price_inc_vat: 799,
    installation_fee: 900,
    description: 'Entry-level uncapped wireless for small homes and apartments',
    special_features: JSON.stringify({
      hero_deal: false,
      installation_time: '3-5 business days',
      contract_incentives: {
        '12-month': '50% off installation',
        '18-month': '75% off installation', 
        '24-month': 'FREE installation'
      }
    })
  },
  {
    name: 'SkyFibre Home Plus 100',
    category: 'Residentail',
    subcategory: 'Uncapped Wireless',
    deal_id: 'RES-SKY-100-2025',
    sku: 'SKY-100-HOME-PLUS',
    speed_download: '100',
    speed_upload: '40',
    speed_info: '100/40 Mbps',
    provider: 'SkyFibre',
    contract_term_months: null,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Standard 5G Router',
    regular_price_ex_vat: 955.652174,
    regular_price_inc_vat: 1099,
    promo_price_inc_vat: 899,
    installation_fee: 900,
    description: 'High-speed wireless for medium to large homes',
    special_features: JSON.stringify({
      hero_deal: false,
      installation_time: '3-5 business days',
      contract_incentives: {
        '12-month': '50% off installation',
        '18-month': '75% off installation',
        '24-month': 'FREE installation'
      }
    })
  },
  {
    name: 'SkyFibre Home Max 200',
    category: 'Residentail',
    subcategory: 'Uncapped Wireless',
    deal_id: 'RES-SKY-200-2025',
    sku: 'SKY-200-HOME-MAX',
    speed_download: '200',
    speed_upload: '80',
    speed_info: '200/80 Mbps',
    provider: 'SkyFibre',
    contract_term_months: null,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Standard 5G Router',
    regular_price_ex_vat: 1129.565217,
    regular_price_inc_vat: 1299,
    promo_price_inc_vat: 1099,
    installation_fee: 900,
    description: 'Ultimate wireless performance for large homes and power users',
    special_features: JSON.stringify({
      hero_deal: true,
      installation_time: '3-5 business days',
      contract_incentives: {
        '12-month': '50% off installation',
        '18-month': '75% off installation',
        '24-month': 'FREE installation'
      }
    })
  }
];

const businessWirelessData: ExcelProductRow[] = [
  {
    name: 'SMB Essential',
    category: 'Business',
    subcategory: 'Uncapped Wireless',
    deal_id: 'BIZ-ESSENTIAL-2025',
    sku: 'BIZ-ESS-ESSENTIAL',
    speed_download: '50',
    speed_upload: '20',
    speed_info: '50/20 Mbps',
    provider: 'SkyFibre',
    contract_term_months: null,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Business 5G Router',
    regular_price_ex_vat: 1651.304348,
    regular_price_inc_vat: 1899,
    promo_price_inc_vat: null,
    installation_fee: 2500,
    description: 'Essential business connectivity with reliable performance',
    special_features: JSON.stringify({
      hero_deal: true,
      installation_time: '5-7 business days',
      sla_guarantee: '99.5%',
      support: '24/7 Business Support',
      promo_launch: {
        '3_months': 'R1299/month',
        'installation_discount': '50% off'
      }
    })
  },
  {
    name: 'SMB Professional',
    category: 'Business',
    subcategory: 'Uncapped Wireless',
    deal_id: 'BIZ-PROFESSIONAL-2025',
    sku: 'BIZ-PRO-PROFESSIONAL',
    speed_download: '100',
    speed_upload: '40',
    speed_info: '100/40 Mbps',
    provider: 'SkyFibre',
    contract_term_months: null,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Professional 5G Router',
    regular_price_ex_vat: 2520.869565,
    regular_price_inc_vat: 2899,
    promo_price_inc_vat: null,
    installation_fee: 3500,
    description: 'Professional-grade connectivity for growing businesses',
    special_features: JSON.stringify({
      hero_deal: true,
      installation_time: '5-7 business days',
      sla_guarantee: '99.7%',
      support: '24/7 Business Support',
      promotional_launch: {
        '3_months': 'R1899/month',
        'installation_discount': '50% off'
      }
    })
  },
  {
    name: 'SMB Premium',
    category: 'Business',
    subcategory: 'Uncapped Wireless',
    deal_id: 'BIZ-PREMIUM-2025',
    sku: 'BIZ-PREMIUM-PREMIUM',
    speed_download: '200',
    speed_upload: '80',
    speed_info: '200/80 Mbps',
    provider: 'SkyFibre',
    contract_term_months: null,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Premium 5G Router',
    regular_price_ex_vat: 3912.173913,
    regular_price_inc_vat: 4499,
    promo_price_inc_vat: null,
    installation_fee: 5500,
    description: 'Premium business connectivity with maximum performance',
    special_features: JSON.stringify({
      hero_deal: true,
      installation_time: '5-7 business days',
      sla_guarantee: '99.9%',
      support: '24/7 Priority Support',
      promo_launch: {
        '3_months': 'R2899/month',
        'installation_discount': '50% off'
      }
    })
  }
];

const businessFibreData: ExcelProductRow[] = [
  {
    name: 'BizFibre Connect Lite',
    category: 'Business',
    subcategory: 'Fibre to the Business',
    deal_id: 'BIZ-FIBRE-LITE-2025',
    sku: 'BIZ-FIBRE-LITE',
    speed_download: '10',
    speed_upload: '10',
    speed_info: '10/10 Mbps',
    provider: 'SkyFibre',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Reyee RG-EW1300G',
    regular_price_ex_vat: null,
    regular_price_inc_vat: 2499,
    promo_price_inc_vat: null,
    installation_fee: 2500,
    description: 'Entry-level business fibre with symmetrical speeds',
    special_features: JSON.stringify({
      hero_deal: false,
      installation_time: '7-10 business days',
      sla_guarantee: '99.5%',
      fiber_type: 'FTTH',
      technology: 'Fibre to the Home'
    })
  },
  {
    name: 'BizFibre Connect Starter',
    category: 'Business',
    subcategory: 'Fibre to the Business',
    deal_id: 'BIZ-FIBRE-STARTER-2025',
    sku: 'BIZ-FIBRE-STARTER',
    speed_download: '25',
    speed_upload: '25',
    speed_info: '25/25 Mbps',
    provider: 'SkyFibre',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Reyee RG-EG105G*',
    regular_price_ex_vat: null,
    regular_price_inc_vat: 2699,
    promo_price_inc_vat: null,
    installation_fee: 3000,
    description: 'Starter business fibre with enhanced bandwidth',
    special_features: JSON.stringify({
      hero_deal: false,
      installation_time: '7-10 business days',
      sla_guarantee: '99.5%',
      fiber_type: 'FTTH',
      technology: 'Fibre to the Home'
    })
  },
  {
    name: 'BizFibre Connect Plus',
    category: 'Business',
    subcategory: 'Fibre to the Business',
    deal_id: 'BIZ-FIBRE-PLUS-2025',
    sku: 'BIZ-FIBRE-PLUS',
    speed_download: '50',
    speed_upload: '50',
    speed_info: '50/50 Mbps',
    provider: 'SkyFibre',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Reyee RG-EG105G-P*',
    regular_price_ex_vat: null,
    regular_price_inc_vat: 2999,
    promo_price_inc_vat: null,
    installation_fee: 3500,
    description: 'Professional business fibre with balanced performance',
    special_features: JSON.stringify({
      hero_deal: true,
      installation_time: '7-10 business days',
      sla_guarantee: '99.7%',
      fiber_type: 'FTTH',
      technology: 'Fibre to the Home'
    })
  },
  {
    name: 'BizFibre Connect Pro',
    category: 'Business',
    subcategory: 'Fibre to the Business',
    deal_id: 'BIZ-FIBRE-PRO-2025',
    sku: 'BIZ-FIBRE-PRO',
    speed_download: '100',
    speed_upload: '100',
    speed_info: '100/100 Mbps',
    provider: 'SkyFibre',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Reyee RG-EG305GH-P-E**',
    regular_price_ex_vat: null,
    regular_price_inc_vat: 4299,
    promo_price_inc_vat: null,
    installation_fee: 3500,
    description: 'Professional business fibre with high-speed symmetrical connections',
    special_features: JSON.stringify({
      hero_deal: true,
      installation_time: '7-10 business days',
      sla_guarantee: '99.7%',
      fiber_type: 'FTTH',
      technology: 'Fibre to the Home'
    })
  },
  {
    name: 'BizFibre Connect Ultra',
    category: 'Business',
    subcategory: 'Fibre to the Business',
    deal_id: 'BIZ-FIBRE-ULTRA-2025',
    sku: 'BIZ-FIBRE-ULTRA',
    speed_download: '200',
    speed_upload: '200',
    speed_info: '200/200 Mbps',
    provider: 'SkyFibre',
    contract_term_months: 36,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'Reyee RG-EG310GH-P-E**',
    regular_price_ex_vat: null,
    regular_price_inc_vat: 5699,
    promo_price_inc_vat: null,
    installation_fee: 5500,
    description: 'Ultra-fast business fibre for enterprise-grade requirements',
    special_features: JSON.stringify({
      hero_deal: false,
      installation_time: '7-10 business days',
      sla_guarantee: '99.9%',
      fiber_type: 'FTTH',
      technology: 'Fibre to the Home'
    })
  }
];

const fiveGLTEData: ExcelProductRow[] = [
  // CircleConnect Mobile Business
  {
    name: 'CircleConnect Mobile Business 15GB',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202501EBU9002',
    sku: 'CC-MOB-BUS-15GB',
    speed_download: null,
    speed_upload: null,
    speed_info: 'Mobile data 15GB',
    provider: 'CircleConnect',
    contract_term_months: 24,
    data_cap: '15GB',
    router_included: false,
    regular_price_ex_vat: 129.565217,
    regular_price_inc_vat: 149,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'Mobile business connectivity with 15GB data allocation',
    special_features: JSON.stringify({
      hero_deal: false,
      technology: 'LTE/4G',
      network: 'Mobile Network',
      portability: 'Available'
    })
  },
  // CircleConnect Uncapped 5G products
  {
    name: 'CircleConnect Uncapped 5G 35Mbps',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202501EBU2013',
    sku: 'CC-5G-UNC-35',
    speed_download: '35',
    speed_upload: null,
    speed_info: '35 Mbps Uncapped 5G',
    provider: 'CircleConnect',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: false,
    regular_price_ex_vat: 390.434783,
    regular_price_inc_vat: 449,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'Uncapped 5G connectivity at 35Mbps for businesses',
    special_features: JSON.stringify({
      hero_deal: true,
      technology: '5G',
      network: '5G Network',
      portability: 'Available',
      setup_fee: 'Included'
    })
  },
  {
    name: 'CircleConnect 5G FWA 500GB',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202504EBU1603',
    sku: 'CC-5G-FWA-500GB',
    speed_download: null,
    speed_upload: null,
    speed_info: '5G FWA 500GB',
    provider: 'CircleConnect',
    contract_term_months: 24,
    data_cap: '500GB',
    router_included: false,
    regular_price_ex_vat: 520.869565,
    regular_price_inc_vat: 599,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'Fixed Wireless Access with 500GB data allocation',
    special_features: JSON.stringify({
      hero_deal: false,
      technology: '5G',
      network: 'Fixed Wireless Access',
      portability: 'Available'
    })
  },
  {
    name: 'CircleConnect Uncapped 5G 60Mbps',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202501EBU2012',
    sku: 'CC-5G-UNC-60',
    speed_download: '60',
    speed_upload: null,
    speed_info: '60 Mbps Uncapped 5G',
    provider: 'CircleConnect',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: false,
    regular_price_ex_vat: 564.347826,
    regular_price_inc_vat: 649,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'High-speed uncapped 5G connectivity at 60Mbps',
    special_features: JSON.stringify({
      hero_deal: true,
      technology: '5G',
      network: '5G Network',
      portability: 'Available'
    })
  },
  {
    name: 'CircleConnect Uncapped 5G Best Effort',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202501EBU2014',
    sku: 'CC-5G-UNC-BEST',
    speed_download: null,
    speed_upload: null,
    speed_info: 'Best Effort Uncapped 5G',
    provider: 'CircleConnect',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: false,
    regular_price_ex_vat: 825.217391,
    regular_price_inc_vat: 949,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'Best effort uncapped 5G with maximum available speeds',
    special_features: JSON.stringify({
      hero_deal: false,
      technology: '5G',
      network: '5G Network',
      portability: 'Available'
    })
  }
];

// Additional LTE packages
const businessLTEData: ExcelProductRow[] = [
  {
    name: 'CircleConnect Business Broadband LTE 15GB',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202501EBU9011',
    sku: 'CC-LTE-BUS-15GB',
    speed_download: null,
    speed_upload: null,
    speed_info: 'LTE 15GB Business',
    provider: 'CircleConnect',
    contract_term_months: 1,
    data_cap: '15GB',
    router_included: false,
    regular_price_ex_vat: 155.652174,
    regular_price_inc_vat: 179,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'Monthly LTE business plan with 15GB data',
    special_features: JSON.stringify({
      hero_deal: false,
      technology: 'LTE/4G',
      contract_flexibility: 'Month-to-month'
    })
  },
  {
    name: 'CircleConnect Business Uncapped 5G 35Mbps',
    category: '5G-LTE',
    subcategory: 'Router + SIMs',
    deal_id: '202501EBU2001',
    sku: 'CC-5G-UNC-35-ROUTER',
    speed_download: '35',
    speed_upload: null,
    speed_info: '35Mbps Uncapped 5G + Router',
    provider: 'CircleConnect',
    contract_term_months: 1,
    data_cap: 'uncapped',
    router_included: true,
    router_model: '5G Business Router',
    regular_price_ex_vat: 433.913043,
    regular_price_inc_vat: 499,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'Uncapped 5G with router included, month-to-month flexibility',
    special_features: JSON.stringify({
      hero_deal: true,
      technology: '5G',
      contract_flexibility: 'Month-to-month',
      equipment: 'Router included'
    })
  }
];

const mtnLTEData: ExcelProductRow[] = [
  {
    name: 'MTN Business Broadband LTE 15GB',
    category: '5G-LTE',
    subcategory: 'SIM Only',
    deal_id: '202501EBU9013',
    sku: 'MTN-LTE-BUS-15GB',
    speed_download: null,
    speed_upload: null,
    speed_info: 'MTN LTE 15GB Business',
    provider: 'MTN',
    contract_term_months: 24,
    data_cap: '15GB',
    router_included: false,
    regular_price_ex_vat: 138.26087,
    regular_price_inc_vat: 159,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'MTN LTE business connectivity with 15GB data',
    special_features: JSON.stringify({
      hero_deal: false,
      technology: 'LTE/4G',
      network: 'MTN Network'
    })
  },
  {
    name: 'MTN Business Uncapped 5G 60Mbps',
    category: '5G-LTE',
    subcategory: 'Router + SIMs',
    deal_id: '202501EBU2008',
    sku: 'MTN-5G-UNC-60-ROUTER',
    speed_download: '60',
    speed_upload: null,
    speed_info: '60Mbps Uncapped 5G + Router',
    provider: 'MTN',
    contract_term_months: 24,
    data_cap: 'uncapped',
    router_included: true,
    router_model: 'MTN 5G Router',
    regular_price_ex_vat: 564.347826,
    regular_price_inc_vat: 649,
    promo_price_inc_vat: null,
    installation_fee: 0,
    description: 'MTN uncapped 5G with router included',
    special_features: JSON.stringify({
      hero_deal: true,
      technology: '5G',
      network: 'MTN Network'
    })
  }
];

async function migrateProducts() {
  console.log('Starting product migration...');
  
  const allData = [
    ...residentialData,
    ...businessWirelessData,
    ...businessFibreData,
    ...fiveGLTEData,
    ...businessLTEData,
    ...mtnLTEData
  ];

  console.log(`Total products to migrate: ${allData.length}`);

  try {
    const result = await productService.importFromExcel(allData, 'script@circletel.co.za');
    
    console.log('Migration completed:');
    console.log(`✅ Successfully migrated: ${result.success} products`);
    
    if (result.errors.length > 0) {
      console.log(`❌ Errors encountered: ${result.errors.length}`);
      result.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }

    return result;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  migrateProducts()
    .then((result) => {
      console.log('\n🎉 Migration completed successfully!');
      process.exit(result.errors.length > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateProducts };
