import { NextResponse } from 'next/server';
import { sendDailyDigest } from '@/lib/sales-engine/slack-digest-service';

export async function POST() {
  try {
    const result = await sendDailyDigest();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, message: 'Slack digest sent successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
