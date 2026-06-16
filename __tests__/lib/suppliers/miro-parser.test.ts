import ExcelJS from 'exceljs'
import {
  parseMiRoCsvContent,
  parseMiRoXlsxBuffer,
} from '@/lib/suppliers/miro/miro-parser'

describe('MiRO CSV parser', () => {
  it('parses MiRO pricing CSV rows with quoted prices and product links', () => {
    const csv = [
      'Item Code,Item Description,Retail Price,Your Price,Item Link',
      'RB5009UG,"MikroTik RB5009 router","R3,999.00","R2,750.50",https://miro.co.za/router',
      'RAP2260,"Reyee WiFi 6 Access Point",R1,499.00,R987.65,https://miro.co.za/ap',
    ].join('\n')

    const result = parseMiRoCsvContent(csv, 'miro-live.csv')

    expect(result.success).toBe(true)
    expect(result.products_found).toBe(2)
    expect(result.products_parsed).toBe(2)
    expect(result.products).toEqual([
      {
        sku: 'RB5009UG',
        name: 'MikroTik RB5009 router',
        description: 'MikroTik RB5009 router',
        manufacturer: 'MiRO',
        cost_price: 2750.5,
        retail_price: 3999,
        source_image_url: '',
        product_url: 'https://miro.co.za/router',
        stock_cpt: 0,
        stock_jhb: 0,
        stock_dbn: 0,
        stock_total: 0,
        category: 'MiRO',
      },
      {
        sku: 'RAP2260',
        name: 'Reyee WiFi 6 Access Point',
        description: 'Reyee WiFi 6 Access Point',
        manufacturer: 'MiRO',
        cost_price: 987.65,
        retail_price: 1499,
        source_image_url: '',
        product_url: 'https://miro.co.za/ap',
        stock_cpt: 0,
        stock_jhb: 0,
        stock_dbn: 0,
        stock_total: 0,
        category: 'MiRO',
      },
    ])
  })

  it('parses MiRO pricing XLSX content from a live feed buffer', async () => {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('MikroTik')
    sheet.addRow(['Price list generated on 16-06-2026'])
    sheet.addRow(['MiRO Client Code: TEST'])
    sheet.addRow([])
    sheet.addRow(['Item Code', 'Item Description', 'Retail Price', 'Your Price', 'Item Link'])
    sheet.addRow([
      'RB5009UG',
      'MikroTik RB5009 router',
      'R3,999.00',
      'R2,750.50',
      'https://miro.co.za/router',
    ])

    const buffer = await workbook.xlsx.writeBuffer()
    const result = await parseMiRoXlsxBuffer(buffer, 'miro-live.xlsx')

    expect(result.success).toBe(true)
    expect(result.products_found).toBe(1)
    expect(result.products_parsed).toBe(1)
    expect(result.products[0]).toMatchObject({
      sku: 'RB5009UG',
      manufacturer: 'MikroTik',
      cost_price: 2750.5,
      retail_price: 3999,
      product_url: 'https://miro.co.za/router',
    })
  })
})
