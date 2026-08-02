/**
 * TP-Link Omada Open API types (northbound / cloud).
 * @see https://omada-northbound-docs.tplinkcloud.com/
 */

export interface OmadaTokenResponse {
  errorCode: number
  msg?: string
  result?: {
    accessToken: string
    tokenId?: string
    refreshToken?: string
    expiresIn?: number
  }
}

export interface OmadaApiResponse<T> {
  errorCode: number
  msg?: string
  result?: T
}

export interface OmadaSite {
  siteId?: string
  id?: string
  name: string
  region?: string
  timeZone?: string
  deviceCount?: number
  [key: string]: unknown
}

export interface OmadaDevice {
  mac?: string
  name?: string
  model?: string
  type?: string
  status?: number | string
  ip?: string
  sn?: string
  siteId?: string
  [key: string]: unknown
}

export interface OmadaClient {
  mac?: string
  name?: string
  ip?: string
  deviceType?: string
  [key: string]: unknown
}

export interface OmadaConfig {
  baseUrl: string
  omadaId: string
  clientId: string
  clientSecret: string
}
