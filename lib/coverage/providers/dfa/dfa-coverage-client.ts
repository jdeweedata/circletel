/**
 * DFA (Dark Fibre Africa) Coverage Client
 *
 * Integrates with DFA's ArcGIS REST API to check fiber coverage
 * API Documentation: https://dfafrica.maps.arcgis.com
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
  haversineDistance,
  isWithinSouthAfricaBounds,
  createWGS84BoundingBox,
  calculatePolygonCentroid,
} from './coordinate-utils';

export class DFACoverageClient {
  private readonly baseUrl =
    'https://utility.arcgis.com/usrsvcs/servers/044304ebfe2140b18e6e50d1af16e9e0/rest/services/Hosted/PublicCoverage/FeatureServer';
  private readonly timeout = 5000;
  private readonly maxNearNetDistance = 200;

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
      // Step 1: PiCheckBold Connected Buildings (active fiber)
      const connectedBuilding = await this.queryConnectedBuildings(
        latitude,
        longitude
      );

      if (connectedBuilding) {
        return {
          hasCoverage: true,
          coverageType: 'connected',
          buildingDetails: {
            objectId: connectedBuilding.objectid,
            buildingId: connectedBuilding.dfa_building_id,
            status: 'Connected',
            ftth: connectedBuilding.ftth,
            broadband: connectedBuilding.broadband,
            precinct: connectedBuilding.precinct,
            promotion: connectedBuilding.promotion,
            coordinates: {
              latitude: connectedBuilding.latitude ?? 0,
              longitude: connectedBuilding.longitude ?? 0
            }
          },
          message: 'Active DFA fiber connection available'
        };
      }

      // Step 2: PiCheckBold Near-Net Buildings (if enabled)
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
    const geometry = JSON.stringify({
      x: longitude,
      y: latitude,
      spatialReference: { wkid: 4326 },
    });

    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry,
      geometryType: 'esriGeometryPoint',
      inSR: '4326',
      where: "dfa_connected_y_n='Yes'",
      outFields:
        'objectid,dfa_building_id,longitude,latitude,dfa_connected_y_n,ftth,broadband,precinct,promotion',
      outSR: '4326',
    });

    const response = await axios.get<
      ArcGISQueryResponse<DFAConnectedBuilding>
    >(`${this.baseUrl}/2/query`, {
      params,
      timeout: this.timeout,
    });

    if (response.data.features && response.data.features.length > 0) {
      const feature = response.data.features[0];
      const building = { ...feature.attributes };
      if (
        (!building.latitude || !building.longitude) &&
        feature.geometry?.rings?.length
      ) {
        const centroid = calculatePolygonCentroid(feature.geometry.rings);
        building.latitude = centroid.latitude;
        building.longitude = centroid.longitude;
      }
      return building;
    }

    // Fallback: small bounding box query
    const bbox = createWGS84BoundingBox(latitude, longitude, 3);
    const params2 = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      where: "dfa_connected_y_n='Yes'",
      outFields:
        'objectid,dfa_building_id,longitude,latitude,dfa_connected_y_n,ftth,broadband,precinct,promotion',
      outSR: '4326',
    });

    const response2 = await axios.get<
      ArcGISQueryResponse<DFAConnectedBuilding>
    >(`${this.baseUrl}/2/query`, {
      params: params2,
      timeout: this.timeout,
    });

    if (response2.data.features && response2.data.features.length > 0) {
      const feature = response2.data.features[0];
      const building = { ...feature.attributes };
      if (
        (!building.latitude || !building.longitude) &&
        feature.geometry?.rings?.length
      ) {
        const centroid = calculatePolygonCentroid(feature.geometry.rings);
        building.latitude = centroid.latitude;
        building.longitude = centroid.longitude;
      }
      return building;
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
    const bbox = createWGS84BoundingBox(latitude, longitude, maxDistance);

    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      outFields: 'objectid,dfa_building_id,building_name,street_address',
      outSR: '4326',
    });

    const response = await axios.get<ArcGISQueryResponse<DFANearNetBuilding>>(
      `${this.baseUrl}/1/query`,
      {
        params,
        timeout: this.timeout,
      }
    );

    if (response.data.features && response.data.features.length > 0) {
      let nearestBuilding: {
        buildingName: string;
        address: string;
        distance: number;
      } | null = null;
      let minDistance = maxDistance;

      for (const feature of response.data.features) {
        if (feature.geometry?.rings && feature.geometry.rings.length > 0) {
          const centroid = calculatePolygonCentroid(feature.geometry.rings);
          const distance = haversineDistance(
            latitude,
            longitude,
            centroid.latitude,
            centroid.longitude
          );

          if (distance < minDistance) {
            minDistance = distance;
            nearestBuilding = {
              buildingName:
                feature.attributes.building_name || 'Unnamed Building',
              address:
                feature.attributes.street_address || 'Address not available',
              distance,
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
    const bbox = createWGS84BoundingBox(latitude, longitude, maxDistance);

    const params = new URLSearchParams({
      f: 'json',
      returnGeometry: 'true',
      spatialRel: 'esriSpatialRelIntersects',
      geometry: JSON.stringify(bbox),
      geometryType: 'esriGeometryEnvelope',
      inSR: '4326',
      outFields: 'objectid,stage,ea1',
      outSR: '4326',
      where: "stage = 'Completed'",
    });

    try {
      const response = await axios.get(
        `${this.baseUrl}/5/query`,
        {
          params,
          timeout: this.timeout,
        }
      );

      if (response.data.features && response.data.features.length > 0) {
        let nearestDistance = maxDistance;
        let routeName: string | undefined;

        for (const feature of response.data.features) {
          if (feature.geometry?.paths) {
            for (const path of feature.geometry.paths) {
              for (const point of path) {
                const distance = haversineDistance(
                  latitude,
                  longitude,
                  point[1],
                  point[0]
                );
                if (distance < nearestDistance) {
                  nearestDistance = distance;
                  routeName = feature.attributes.ea1;
                }
              }
            }
          }
        }

        if (nearestDistance < maxDistance) {
          return {
            distance: nearestDistance,
            routeName,
          };
        }
      }
    } catch (error) {
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
        `${this.baseUrl}/2?f=json`,
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
