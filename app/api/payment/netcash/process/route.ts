import { NextRequest, NextResponse } from 'next/server'
import { netcashPayment } from '@/lib/payment/netcash-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      amount, 
      description, 
      customerEmail, 
      customerName, 
      customerPhone,
      token,
      recurring 
    } = body
    
    if (!amount || !customerEmail || !customerName) {
      return NextResponse.json({ 
        success: false, 
        error: 'Required fields missing' 
      }, { status: 400 })
    }
    
    // Process the payment
    const paymentResult = await netcashPayment.processPayment({
      token,
      amount,
      reference: '', // Will be auto-generated
      description: description || 'CircleTel Wireless Package',
      customerEmail,
      customerName,
      customerPhone
    })
    
    if (paymentResult.success) {
      // If recurring payment is requested, set it up
      if (recurring && token) {
        const recurringResult = await netcashPayment.setupRecurringPayment(
          token,
          amount,
          'monthly'
        )
        
        return NextResponse.json({
          success: true,
          transactionId: paymentResult.transactionId,
          paymentUrl: paymentResult.paymentUrl,
          recurring: recurringResult
        })
      }
      
      return NextResponse.json({
        success: true,
        transactionId: paymentResult.transactionId,
        paymentUrl: paymentResult.paymentUrl
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: paymentResult.error 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process payment' 
    }, { status: 500 })
  }
}