/**
 * DFA (Dark Fibre Africa) Coverage Client
 *
 * Integrates with DFA's ArcGIS REST API to check fiber coverage
 * API Documentation: https://gisportal.dfafrica.co.za/arcgis/rest/services
 */

import axios, { AxiosError } from 'axios';
import {
  DFACoverageRequest,
  DFACoverageResponse,
  DFACoverageType,
  DFAConnectedBuilding,
  DFANearNetBuilding,
  ArcGISQueryResponse,
  DFACoverageError
} from './types';
import {
  latLngToWebMercator,
  createBoundingBox,
  calculateDistance,
  haversineDistance,
  isWithinSouthAfricaBounds,
  formatGeometryPoint,
  formatGeometryEnvelope
} from './coordinate-utils';

export class DFACoverageClient {
  private readonly baseUrl =
    'https://gisportal.dfafrica.co.za/server/rest/services/API';
  private readonly timeout = 5000; // 5 seconds
  private readonly maxNearNetDistance = 200; // meters

  /**
   * Check DFA fiber coverage at a specific address/location
   *
   * Workflow:
   * 1. Validate coordinates are in South Africa
   * 2. Check Connected Buildings layer (active fiber)
   * 3. If not connected, check Near-Net Buildings layer (within 200m)
   * 4. Return coverage status and details
   *
   * @param request - Coverage check request with lat/lng
   * @returns Coverage response with building details
   */
  async checkCoverage(
    request: DFACoverageRequest
  ): Promise<DFACoverageResponse> {
    const { latitude, longitude, checkNearNet = true, maxNearNetDistance } =
      request;

    // Validate South African coordinates
    if (!isWithinSouthAfricaBounds(latitude, longitude)) {
      throw new DFACoverageError(
        'Coordinates outside South Africa service area',
        'INVALID_COORDINATES',
        { latitude, longitude }
      );
    }

    try {
      // Step 1: Check Connected Buildings (active fiber)
      const connectedBuilding = await this.queryConnectedBuildings(
        latitude,
        longitude
      );

      if (connectedBuilding) {
        return {
          hasCoverage: true,
          coverageType: 'connected',
          buildingDetails: {
            objectId: connectedBuilding.OBJECTID,
            buildingId: connectedBuilding.DFA_Building_ID,
            status: 'Connected',
            ftth: connectedBuilding.FTTH,
            broadband: connectedBuilding.Broadband,
            precinct: connectedBuilding.Precinct,
            promotion: connectedBuilding.Promotion,
            coordinates: {
              latitude: connectedBuilding.Latitude,
              longitude: connectedBuilding.Longitude
            }
          },
          message: 'Active DFA fiber connection available'
        };
      }

      // Step 2: Check Near-Net Buildings (if enabled)
      if (checkNearNet) {
        const nearNetBuilding = await this.queryNearNetBuildings(
          latitude,
          longitude,
          maxNearNetDistance || this.maxNearNetDistance
        );

        if (nearNetBuilding) {
          return {
            hasCoverage: true,
            coverageType: 'near-net',
            nearNetDetails: {
              buildingName: nearNetBuilding.buildingName,
              address: nearNetBuilding.address,
              distance: nearNetBuilding.distance
            },
            message: `Fiber extension available within ${Math.round(nearNetBuilding.distance)}m`
          };
        }
      }

      // No coverage found
      return {
        hasCoverage: false,
        coverageType: 'none',
        message: 'No DFA fiber coverage at this location'
      };
    } catch (error) {
      if (error instanceof DFACoverageError) {
        throw error;
      }

      // Handle API errors
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        throw new DFACoverageError(
          `DFA API error: ${axiosError.message}`,
          'API_ERROR',
          {
            status: axiosError.response?.status,
            data: axiosError.response?.data
          }
        );
      }

      throw new DFACoverageError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN_ERROR'
      );
    }
  }

  /**
   * Query Connected Buildings layer (purple polygons on map)
   * Returns building details if address is within an active DFA fiber zone
   *
   * @private
   */
  private async queryConnectedBuildings(
    latitude: number,
    longitude: number
  ): Promise<DFAConnectedBuilding | null> {
    const webMercator = latLngToWebMercator(latitude, longitude);

    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'false',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: formatGeometryPoint(webMercator),
      geometryType: 'esriGeometryPoint',
      inSR: '102100',
      outFields:
        'OBJECTID,DFA_Building_ID,Longitude,Latitude,DFA_Connected_Y_N,FTTH,Broadband,Precinct,Promotion',
      outSR: '102100'
    });

    const response = await axios.get<
      ArcGISQueryResponse<DFAConnectedBuilding>
    >(`${this.baseUrl}/DFA_Connected_Buildings/MapServer/0/query`, {
      params,
      timeout: this.timeout
    });

    // Check if any features returned AND connection status is "Y"
    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      if (feature.attributes.DFA_Connected_Y_N === 'Y') {
        return feature.attributes;
      }
    }

    return null;
  }

  /**
   * Query Near-Net Buildings layer (yellow markers on map)
   * Returns nearest building within specified radius
   *
   * @private
   */
  private async queryNearNetBuildings(
    latitude: number,
    longitude: number,
    maxDistance: number
  ): Promise<{
    buildingName: string;
    address: string;
    distance: number;
  } | null> {
    const bbox = createBoundingBox(latitude, longitude, maxDistance);

    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: formatGeometryEnvelope(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '102100',
      outFields: 'OBJECTID,DFA_Building_ID,Building_Name,Street_Address',
      outSR: '102100'
    });

    const response = await axios.get<ArcGISQueryResponse<DFANearNetBuilding>>(
      `${this.baseUrl}/Promotions/MapServer/1/query`,
      {
        params,
        timeout: this.timeout
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      // Find nearest building
      let nearestBuilding: {
        buildingName: string;
        address: string;
        distance: number;
      } | null = null;
      let minDistance = maxDistance;

      for (const feature of response.data.features) {
        // Get building centroid (use geometry if available)
        if (feature.geometry?.rings) {
          // Calculate centroid of polygon
          const ring = feature.geometry.rings[0];
          let sumX = 0;
          let sumY = 0;
          for (const point of ring) {
            sumX += point[0];
            sumY += point[1];
          }
          const centroidX = sumX / ring.length;
          const centroidY = sumY / ring.length;

          // Calculate distance
          const webMercator = latLngToWebMercator(latitude, longitude);
          const distance = calculateDistance(webMercator, {
            x: centroidX,
            y: centroidY
          });

          if (distance < minDistance) {
            minDistance = distance;
            nearestBuilding = {
              buildingName:
                feature.attributes.Building_Name || 'Unnamed Building',
              address:
                feature.attributes.Street_Address || 'Address not available',
              distance
            };
          }
        }
      }

      return nearestBuilding;
    }

    return null;
  }

  /**
   * Query Ductbank layer (fiber routes - green/blue lines on map)
   * Returns nearest completed fiber infrastructure
   *
   * This can be used for additional proximity checks or to show
   * distance to nearest fiber route on the map
   *
   * @param latitude - Latitude
   * @param longitude - Longitude
   * @param maxDistance - Maximum search radius in meters (default: 500m)
   * @returns Distance to nearest fiber route or null
   */
  async queryNearestFiberRoute(
    latitude: number,
    longitude: number,
    maxDistance: number = 500
  ): Promise<{ distance: number; routeName?: string } | null> {
    const bbox = createBoundingBox(latitude, longitude, maxDistance);

    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: formatGeometryEnvelope(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '102100',
      outFields: 'OBJECTID,stage,ea1,totlength', // ea1 = Route Name
      outSR: '102100',
      where: "stage = 'Completed'" // Only query completed fiber
    });

    try {
      const response = await axios.get(
        `${this.baseUrl}/API_BasedOSPLayers/MapServer/1/query`,
        {
          params,
          timeout: this.timeout
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        // Calculate distance to nearest polyline
        // This is a simplified calculation - for production, use proper
        // point-to-line distance calculation
        const webMercator = latLngToWebMercator(latitude, longitude);

        let nearestDistance = maxDistance;
        let routeName: string | undefined;

        for (const feature of response.data.features) {
          if (feature.geometry?.paths) {
            // Get first path (fiber route)
            const path = feature.geometry.paths[0];
            for (const point of path) {
              const distance = calculateDistance(webMercator, {
                x: point[0],
                y: point[1]
              });
              if (distance < nearestDistance) {
                nearestDistance = distance;
                routeName = feature.attributes.ea1; // Route Name
              }
            }
          }
        }

        if (nearestDistance < maxDistance) {
          return {
            distance: nearestDistance,
            routeName
          };
        }
      }
    } catch (error) {
      // Non-critical - just log and return null
      console.warn('Ductbank query failed:', error);
    }

    return null;
  }

  /**
   * Get provider health status
   * Simple ping to check if API is accessible
   */
  async checkHealth(): Promise<{ healthy: boolean; responseTime: number }> {
    const startTime = Date.now();

    try {
      const response = await axios.get(
        `${this.baseUrl}/DFA_Connected_Buildings/MapServer/0?f=json`,
        { timeout: this.timeout }
      );

      const responseTime = Date.now() - startTime;

      return {
        healthy: response.status === 200,
        responseTime
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime
      };
    }
  }
}

// Export singleton instance
export const dfaCoverageClient = new DFACoverageClient();
