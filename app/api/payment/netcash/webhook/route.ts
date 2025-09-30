import { NextRequest, NextResponse } from 'next/server'
import { netcashPayment } from '@/lib/payment/netcash-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Process the webhook notification
    const result = await netcashPayment.handleWebhook(body)
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Webhook processed successfully' 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'Webhook processing failed' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// Handle GET requests (for webhook validation)
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    status: 'active',
    service: 'netcash-webhook',
    timestamp: new Date().toISOString()
  })
}