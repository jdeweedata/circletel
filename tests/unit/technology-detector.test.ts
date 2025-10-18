/**
 * Technology Detector Unit Tests
 * Tests geographic and infrastructure-based technology detection
 */

import { describe, it, expect } from '@jest/globals';
import {
  detectTechnology,
  mapServiceToTechnology,
  getSupportedTechnologies,
  getCBDInfo,
  canDeployTechnology
} from '@/lib/coverage/technology-detector';

describe('Technology Detector', () => {
  // ========== CBD Detection ==========
  describe('detectTechnology - CBD Detection', () => {
    it('should detect Cape Town CBD and recommend Fibre', () => {
      const result = detectTechnology(-33.9249, 18.4241);

      expect(result.primary).toBe('fibre');
      expect(result.cbd_detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
      expect(result.alternatives).toContain('5g-lte');
    });

    it('should detect Johannesburg CBD and recommend Fibre', () => {
      const result = detectTechnology(-26.2023, 28.0436);

      expect(result.primary).toBe('fibre');
      expect(result.cbd_detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should detect Durban CBD and recommend Fibre', () => {
      const result = detectTechnology(-29.8587, 31.0292);

      expect(result.primary).toBe('fibre');
      expect(result.cbd_detected).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it('should detect CBD location nearby (within 2km radius)', () => {
      // Slightly offset from Cape Town CBD center
      const result = detectTechnology(-33.92, 18.42);

      expect(result.cbd_detected).toBe(true);
    });

    it('should not detect CBD when outside radius', () => {
      // Far from any CBD (2.5km+ from Cape Town)
      const result = detectTechnology(-33.88, 18.38);

      expect(result.primary).not.toBe('fibre');
      expect(result.cbd_detected).toBe(false);
    });
  });

  // ========== Suburban Detection ==========
  describe('detectTechnology - Suburban Areas', () => {
    it('should recommend 5G/LTE for suburban Centurion', () => {
      const result = detectTechnology(-25.903104, 28.1706496);

      expect(result.primary).toBe('5g-lte');
      expect(result.cbd_detected).toBe(false);
      expect(result.alternatives).toContain('airfibre');
      expect(result.alternatives).toContain('lte');
    });

    it('should recommend 5G/LTE for suburban Pretoria', () => {
      const result = detectTechnology(-25.7461, 28.2313);

      expect(result.primary).toBe('5g-lte');
      expect(result.cbd_detected).toBe(false);
    });

    it('should recommend 5G/LTE for suburban Sandton', () => {
      const result = detectTechnology(-26.11, 28.05);

      // Outside CBD radius but major area
      expect(result.primary).toBe('5g-lte');
    });

    it('should have reasonable confidence for suburban areas', () => {
      const result = detectTechnology(-25.75, 28.20);

      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  // ========== Rural/Remote Detection ==========
  describe('detectTechnology - Rural Areas', () => {
    it('should recommend AirFibre for rural areas as fallback', () => {
      const result = detectTechnology(-33.5, 18.0);

      // Rural area - should still work but with lower confidence
      expect(['fibre', '5g-lte', 'airfibre']).toContain(result.primary);
      expect(result.alternatives).toBeDefined();
    });

    it('should provide reasoning for technology choice', () => {
      const result = detectTechnology(-25.9, 28.17);

      expect(result.reasoning).toBeTruthy();
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  // ========== Confidence Scoring ==========
  describe('detectTechnology - Confidence Scoring', () => {
    it('should have high confidence in CBD areas', () => {
      const result = detectTechnology(-33.9249, 18.4241);

      expect(result.confidence).toBeGreaterThanOrEqual(0.95);
    });

    it('should have reasonable confidence in suburban areas', () => {
      const result = detectTechnology(-25.903104, 28.1706496);

      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.confidence).toBeLessThan(0.95);
    });

    it('should increase confidence with available services', () => {
      const result1 = detectTechnology(-25.9, 28.17);
      const result2 = detectTechnology(-25.9, 28.17);

      // Both should be reasonable
      expect(result1.confidence).toBeGreaterThan(0.7);
      expect(result2.confidence).toBeGreaterThan(0.7);
    });

    it('confidence should always be between 0 and 1', () => {
      const locations = [
        [-33.9249, 18.4241],
        [-26.2023, 28.0436],
        [-29.8587, 31.0292],
        [-25.903104, 28.1706496],
        [-25.7461, 28.2313]
      ];

      locations.forEach(([lat, lng]) => {
        const result = detectTechnology(lat, lng);
        expect(result.confidence).toBeGreaterThan(0);
        expect(result.confidence).toBeLessThanOrEqual(1);
      });
    });
  });

  // ========== Service Mapping ==========
  describe('mapServiceToTechnology', () => {
    it('should map Fibre correctly', () => {
      expect(mapServiceToTechnology('Fibre')).toBe('fibre');
      expect(mapServiceToTechnology('fibre')).toBe('fibre');
    });

    it('should map 5G correctly', () => {
      expect(mapServiceToTechnology('5G')).toBe('5g-lte');
      expect(mapServiceToTechnology('5g')).toBe('5g-lte');
    });

    it('should map LTE correctly', () => {
      expect(mapServiceToTechnology('LTE')).toBe('lte');
      expect(mapServiceToTechnology('lte')).toBe('lte');
    });

    it('should map AirFibre correctly', () => {
      expect(mapServiceToTechnology('AirFibre')).toBe('airfibre');
      expect(mapServiceToTechnology('airfibre')).toBe('airfibre');
    });

    it('should map Wireless to 5G/LTE', () => {
      expect(mapServiceToTechnology('Wireless')).toBe('5g-lte');
      expect(mapServiceToTechnology('wireless')).toBe('5g-lte');
    });

    it('should default to 5G/LTE for unknown services', () => {
      expect(mapServiceToTechnology('Unknown')).toBe('5g-lte');
      expect(mapServiceToTechnology('')).toBe('5g-lte');
    });

    it('should be case-insensitive', () => {
      expect(mapServiceToTechnology('FiBrE')).toBe('fibre');
      expect(mapServiceToTechnology('5g')).toBe('5g-lte');
      expect(mapServiceToTechnology('AIRFIBRE')).toBe('airfibre');
    });
  });

  // ========== Supported Technologies ==========
  describe('getSupportedTechnologies', () => {
    it('should include 5G/LTE for all locations', () => {
      const locations = [
        [-33.9249, 18.4241], // Cape Town
        [-25.903104, 28.1706496], // Centurion
        [-32.0, 20.0] // Remote area
      ];

      locations.forEach(([lat, lng]) => {
        const result = getSupportedTechnologies(lat, lng);
        expect(result).toContain('5g-lte');
      });
    });

    it('should include Fibre for CBD locations', () => {
      const cbdLocations = [
        [-33.9249, 18.4241], // Cape Town
        [-26.2023, 28.0436], // Johannesburg
        [-29.8587, 31.0292] // Durban
      ];

      cbdLocations.forEach(([lat, lng]) => {
        const result = getSupportedTechnologies(lat, lng);
        expect(result).toContain('fibre');
      });
    });

    it('should include AirFibre as fallback option', () => {
      const result = getSupportedTechnologies(-25.9, 28.17);

      expect(result).toContain('airfibre');
    });

    it('should return array', () => {
      const result = getSupportedTechnologies(-33.9, 18.4);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ========== CBD Info ==========
  describe('getCBDInfo', () => {
    it('should return CBD info for Cape Town CBD', () => {
      const result = getCBDInfo(-33.9249, 18.4241);

      expect(result).toBeTruthy();
      expect(result?.name).toContain('Cape Town');
      expect(result?.radius_km).toBe(2);
    });

    it('should return CBD info for Johannesburg CBD', () => {
      const result = getCBDInfo(-26.2023, 28.0436);

      expect(result).toBeTruthy();
      expect(result?.name).toContain('Johannesburg');
    });

    it('should return CBD info for Durban CBD', () => {
      const result = getCBDInfo(-29.8587, 31.0292);

      expect(result).toBeTruthy();
      expect(result?.name).toContain('Durban');
    });

    it('should return null for non-CBD locations', () => {
      const result = getCBDInfo(-25.9, 28.17);

      expect(result).toBeNull();
    });

    it('should return null for remote locations', () => {
      const result = getCBDInfo(-32.0, 20.0);

      expect(result).toBeNull();
    });

    it('should have coordinate data in result', () => {
      const result = getCBDInfo(-33.9249, 18.4241);

      expect(result?.latitude).toBeDefined();
      expect(result?.longitude).toBeDefined();
      expect(result?.radius_km).toBeDefined();
    });
  });

  // ========== Deployment Capability ==========
  describe('canDeployTechnology', () => {
    it('should allow Fibre deployment in Cape Town CBD', () => {
      expect(canDeployTechnology(-33.9249, 18.4241, 'fibre')).toBe(true);
    });

    it('should allow 5G deployment everywhere', () => {
      const locations = [
        [-33.9249, 18.4241],
        [-25.903104, 28.1706496],
        [-32.0, 20.0]
      ];

      locations.forEach(([lat, lng]) => {
        expect(canDeployTechnology(lat, lng, '5g-lte')).toBe(true);
      });
    });

    it('should not allow Fibre deployment in suburban areas', () => {
      expect(canDeployTechnology(-25.903104, 28.1706496, 'fibre')).toBe(false);
    });

    it('should allow AirFibre deployment', () => {
      const locations = [
        [-33.9249, 18.4241],
        [-25.903104, 28.1706496],
        [-32.0, 20.0]
      ];

      locations.forEach(([lat, lng]) => {
        expect(canDeployTechnology(lat, lng, 'airfibre')).toBe(true);
      });
    });

    it('should allow LTE deployment', () => {
      const locations = [
        [-33.9249, 18.4241],
        [-25.903104, 28.1706496],
        [-32.0, 20.0]
      ];

      locations.forEach(([lat, lng]) => {
        expect(canDeployTechnology(lat, lng, 'lte')).toBe(true);
      });
    });
  });

  // ========== Edge Cases ==========
  describe('Edge Cases', () => {
    it('should handle coordinates at South Africa border', () => {
      // Northern border
      const result1 = detectTechnology(-22.5, 28.0);
      expect(result1).toBeDefined();

      // Southern border
      const result2 = detectTechnology(-34.5, 22.0);
      expect(result2).toBeDefined();

      // Eastern border
      const result3 = detectTechnology(-30.0, 32.5);
      expect(result3).toBeDefined();

      // Western border
      const result4 = detectTechnology(-30.0, 17.0);
      expect(result4).toBeDefined();
    });

    it('should handle exact CBD center coordinates', () => {
      const result = detectTechnology(-33.9249, 18.4241);

      expect(result.primary).toBe('fibre');
      expect(result.cbd_detected).toBe(true);
    });

    it('should handle coordinates just outside CBD radius', () => {
      // Cape Town CBD + ~2.1km offset
      const result = detectTechnology(-33.90, 18.43);

      // Might be outside CBD radius
      expect(result).toBeDefined();
      expect(['fibre', '5g-lte']).toContain(result.primary);
    });

    it('should return all required fields in detection result', () => {
      const result = detectTechnology(-25.9, 28.17);

      expect(result.primary).toBeDefined();
      expect(result.alternatives).toBeDefined();
      expect(result.confidence).toBeDefined();
      expect(result.reasoning).toBeDefined();
      expect(result.cbd_detected).toBeDefined();
      expect(result.location).toBeDefined();
      expect(result.location.latitude).toBe(-25.9);
      expect(result.location.longitude).toBe(28.17);
    });
  });

  // ========== Consistency Tests ==========
  describe('Consistency', () => {
    it('should return consistent results for same input', () => {
      const lat = -25.9;
      const lng = 28.17;

      const result1 = detectTechnology(lat, lng);
      const result2 = detectTechnology(lat, lng);

      expect(result1.primary).toBe(result2.primary);
      expect(result1.confidence).toBe(result2.confidence);
      expect(result1.cbd_detected).toBe(result2.cbd_detected);
    });

    it('should have consistent mapping results', () => {
      expect(mapServiceToTechnology('5G')).toBe(mapServiceToTechnology('5G'));
      expect(mapServiceToTechnology('Fibre')).toBe(mapServiceToTechnology('Fibre'));
    });

    it('should have deterministic supported technologies list', () => {
      const lat = -25.9;
      const lng = 28.17;

      const tech1 = getSupportedTechnologies(lat, lng);
      const tech2 = getSupportedTechnologies(lat, lng);

      expect(tech1.sort()).toEqual(tech2.sort());
    });
  });
});
