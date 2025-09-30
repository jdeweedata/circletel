import { NextRequest, NextResponse } from 'next/server'
import { netcashPayment } from '@/lib/payment/netcash-service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cardDetails } = body
    
    if (!cardDetails) {
      return NextResponse.json({ 
        success: false, 
        error: 'Card details are required' 
      }, { status: 400 })
    }
    
    // Tokenize the card
    const tokenResult = await netcashPayment.tokenizeCard({
      cardNumber: cardDetails.cardNumber,
      cardHolder: cardDetails.cardName,
      expiryMonth: cardDetails.expiryMonth,
      expiryYear: cardDetails.expiryYear,
      cvv: cardDetails.cvv
    })
    
    if (tokenResult.success) {
      return NextResponse.json({
        success: true,
        token: tokenResult.token,
        maskedCard: tokenResult.masked_card,
        cardType: tokenResult.card_type
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: tokenResult.error 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Tokenization error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to tokenize card' 
    }, { status: 500 })
  }
}