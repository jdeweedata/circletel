import { NextResponse } from 'next/server';
import { client, projectId, dataset } from '@/lib/sanity/client';

export async function GET() {
  try {
    // Test basic connection by fetching project info
    const result = await client.fetch(`*[_type == "sanity.imageAsset"][0...1]`);

    return NextResponse.json({
      success: true,
      message: 'Sanity connection successful',
      projectId,
      dataset,
      testQuery: 'Executed successfully',
      assetsFound: result?.length || 0,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      projectId,
      dataset,
    }, { status: 500 });
  }
}
