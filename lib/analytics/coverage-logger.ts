import { createClient } from '@supabase/supabase-js';

interface CoverageLogData {
  requestId?: string;
  endpoint: string;
  method?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  province?: string;
  city?: string;
  coverageType?: string;
  providerCode?: string;
  providerName?: string;
  statusCode: number;
  success: boolean;
  responseTimeMs: number;
  hasCoverage?: boolean;
  coverageStatus?: string;
  packagesFound?: number;
  errorCode?: string;
  errorMessage?: string;
  errorType?: string;
  leadId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
}

export class CoverageLogger {
  private static supabase = (() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  })();

  static async log(data: CoverageLogData): Promise<void> {
    if (!this.supabase) {
      console.warn('Coverage logger: Supabase not configured');
      return;
    }

    try {
      const { error } = await this.supabase
        .from('coverage_check_logs')
        .insert([{
          request_id: data.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          endpoint: data.endpoint,
          method: data.method || 'POST',
          address: data.address,
          latitude: data.latitude,
          longitude: data.longitude,
          province: data.province,
          city: data.city,
          coverage_type: data.coverageType,
          provider_code: data.providerCode,
          provider_name: data.providerName,
          status_code: data.statusCode,
          success: data.success,
          response_time_ms: data.responseTimeMs,
          has_coverage: data.hasCoverage,
          coverage_status: data.coverageStatus,
          packages_found: data.packagesFound,
          error_code: data.errorCode,
          error_message: data.errorMessage,
          error_type: data.errorType,
          lead_id: data.leadId,
          session_id: data.sessionId,
          user_agent: data.userAgent,
          ip_address: data.ipAddress
        }]);

      if (error) {
        console.error('Coverage logger error:', error);
      }
    } catch (error) {
      console.error('Coverage logger exception:', error);
    }
  }

  static extractProvinceFromAddress(address?: string): string | undefined {
    if (!address) return undefined;

    const provinces = [
      'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
      'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'
    ];

    const addressLower = address.toLowerCase();
    for (const province of provinces) {
      if (addressLower.includes(province.toLowerCase())) {
        return province;
      }
    }

    return undefined;
  }

  static extractCityFromAddress(address?: string): string | undefined {
    if (!address) return undefined;

    const cities = [
      'Johannesburg', 'Cape Town', 'Durban', 'Pretoria', 'Port Elizabeth',
      'Bloemfontein', 'East London', 'Nelspruit', 'Polokwane', 'Kimberley',
      'Sandton', 'Centurion', 'Midrand', 'Roodepoort', 'Soweto'
    ];

    const addressLower = address.toLowerCase();
    for (const city of cities) {
      if (addressLower.includes(city.toLowerCase())) {
        return city;
      }
    }

    return undefined;
  }
}

export function createCoverageLogMiddleware() {
  return async (data: CoverageLogData) => {
    await CoverageLogger.log(data);
  };
}
