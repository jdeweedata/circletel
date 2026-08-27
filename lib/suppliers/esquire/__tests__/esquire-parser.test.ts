import { describe, expect, it } from '@jest/globals'

import { parseEsquireXml } from '../esquire-parser'

const FIXTURE = `<?xml version="1.0"?>
<ROOT>
  <products>
    <product>
      <ProductName>ZTE G5C 5G CPE WiFi Router</ProductName>
      <ProductCode>G5C</ProductCode>
      <Category>Network Routers 5G</Category>
      <ProductSummary>5G CPE</ProductSummary>
      <Price>1999.000035</Price>
      <AvailableQty>Yes</AvailableQty>
      <image>https://cdn.example/g5c.jpg</image>
    </product>
    <product>
      <ProductName>Scented Candle</ProductName>
      <ProductCode>CANDLE-1</ProductCode>
      <Category>Scented Candles</Category>
      <ProductSummary></ProductSummary>
      <Price>49.5</Price>
      <AvailableQty>No</AvailableQty>
      <image></image>
    </product>
  </products>
</ROOT>`

describe('parseEsquireXml', () => {
  it('parses ProductCode as SKU and maps Yes/No availability', () => {
    const result = parseEsquireXml(FIXTURE)

    expect(result.success).toBe(true)
    expect(result.products).toHaveLength(2)

    const g5c = result.products.find((p) => p.sku === 'G5C')!
    expect(g5c.name).toBe('ZTE G5C 5G CPE WiFi Router')
    expect(g5c.category).toBe('Network Routers 5G')
    expect(g5c.cost_price).toBe(1999)
    expect(g5c.in_stock).toBe(true)
    expect(g5c.available_qty_raw).toBe('Yes')
    expect(g5c.source_image_url).toBe('https://cdn.example/g5c.jpg')

    const candle = result.products.find((p) => p.sku === 'CANDLE-1')!
    expect(candle.in_stock).toBe(false)
    expect(candle.available_qty_raw).toBe('No')
    expect(candle.source_image_url).toBeNull()
  })

  it('skips rows without a ProductCode', () => {
    const result = parseEsquireXml(`<ROOT><products>
      <product><ProductName>No code</ProductName><ProductCode></ProductCode><Price>1</Price><AvailableQty>Yes</AvailableQty></product>
    </products></ROOT>`)

    expect(result.success).toBe(true)
    expect(result.products).toHaveLength(0)
  })

  it('unwraps CDATA in Category', () => {
    const result = parseEsquireXml(`<ROOT><products>
      <product>
        <ProductName>Vanilla</ProductName>
        <ProductCode>C1</ProductCode>
        <Category><![CDATA[Scented Candles]]></Category>
        <Price>10</Price>
        <AvailableQty>Yes</AvailableQty>
      </product>
    </products></ROOT>`)

    expect(result.products[0]?.category).toBe('Scented Candles')
  })

  it('fails closed on invalid XML', () => {
    const result = parseEsquireXml('<not-xml')
    expect(result.success).toBe(false)
    expect(result.products).toHaveLength(0)
    expect(result.errors.join(' ')).toMatch(/xml/i)
  })
})
