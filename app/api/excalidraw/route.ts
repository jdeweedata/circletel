import { NextResponse } from 'next/server'
import { readdir } from 'fs/promises'
import * as path from 'path'

const DESIGNS_DIR = path.join(process.cwd(), 'public', 'diagrams')

export async function GET() {
  try {
    const files = await readdir(DESIGNS_DIR)
    const excalidrawFiles = files.filter(f => f.endsWith('.excalidraw'))

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.circletel.co.za'

    const diagrams = excalidrawFiles.map(f => {
      const name = f.replace('.excalidraw', '')
      return {
        name,
        file: f,
        urls: {
          json: `${baseUrl}/api/excalidraw/${name}`,
          svg: `${baseUrl}/api/excalidraw/${name}.svg`,
          open: `${baseUrl}/diagrams/viewer.html?name=${name}`,
        },
      }
    })

    return NextResponse.json({
      diagrams,
      usage: 'Open any "open" URL to load the diagram in Excalidraw',
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Could not list files' }, { status: 500 })
  }
}
