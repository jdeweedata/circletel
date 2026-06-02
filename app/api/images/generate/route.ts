/**
 * POST /api/images/generate
 * 
 * Generate an image via OpenRouter and return a public URL.
 * 
 * Body:
 *   { prompt: string, style?: "product"|"blog_hero"|"wireframe"|"icon", aspect?: "square"|"landscape"|"portrait" }
 * 
 * Response:
 *   { url: string, model: string, cost: number, width: number, height: number }
 * 
 * Requires admin authentication.
 */

import { NextResponse } from 'next/server'
import { generateImage, saveBase64Image } from '@/lib/services/image-generation'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    // Auth check — only admin users can generate images
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { prompt, style, aspect, model } = body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await generateImage({ prompt, style, aspect, model })

    // If the result is a base64 data URL, save it to Supabase storage
    if (result.url.startsWith('data:image')) {
      const filename = `gen_${uuidv4()}.png`
      const b64 = result.url.includes(',') ? result.url.split(',')[1] : result.url
      const buffer = Buffer.from(b64, 'base64')

      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('media')
        .upload(`generated/${filename}`, buffer, {
          contentType: 'image/png',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Failed to upload to storage: ${uploadError.message}`)
      }

      const { data: urlData } = supabase
        .storage
        .from('media')
        .getPublicUrl(`generated/${filename}`)

      result.url = urlData.publicUrl
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Image Generation] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    )
  }
}
