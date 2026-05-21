import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import * as path from 'path'

const DESIGNS_DIR = path.join(process.cwd(), 'public', 'diagrams')

const ALLOWED_EXTENSIONS = ['.excalidraw', '.svg']

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() })
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  const { name } = await context.params

  if (!name || name.includes('..') || name.includes('/')) {
    return NextResponse.json({ error: 'Invalid name' }, { status: 400 })
  }

  const ext = path.extname(name)
  const hasExt = ALLOWED_EXTENSIONS.includes(ext)
  const filename = hasExt ? name : `${name}.excalidraw`
  const filePath = path.join(DESIGNS_DIR, filename)

  if (!filePath.startsWith(DESIGNS_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const content = await readFile(filePath, 'utf-8')
    const actualExt = path.extname(filename)

    const contentType = actualExt === '.svg'
      ? 'image/svg+xml'
      : 'application/json'

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders(),
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404, headers: corsHeaders() })
  }
}
