import { netcashConfig, formatAmountForNetcash, generatePaymentReference } from './netcash-config'

interface TokenizationRequest {
  cardNumber: string
  cardHolder: string
  expiryMonth: string
  expiryYear: string
  cvv: string
}

interface TokenizationResponse {
  success: boolean
  token?: string
  masked_card?: string
  card_type?: string
  error?: string
}

interface PaymentRequest {
  token?: string
  amount: number
  reference: string
  description: string
  customerEmail: string
  customerName: string
  customerPhone?: string
}

interface PaymentResponse {
  success: boolean
  transactionId?: string
  paymentUrl?: string
  error?: string
}

export class NetcashPaymentService {
  private pciVaultKey: string
  private serviceKey: string

  constructor() {
    this.pciVaultKey = netcashConfig.pciVault.key
    this.serviceKey = netcashConfig.payNow.serviceKey
  }

  /**
   * Tokenize card details using PCI Vault
   * This securely stores card details and returns a token
   */
  async tokenizeCard(cardDetails: TokenizationRequest): Promise<TokenizationResponse> {
    try {
      // Format expiry date
      const expiryDate = `${cardDetails.expiryMonth}/${cardDetails.expiryYear}`
      
      // Build tokenization request
      const requestData = {
        PciVaultKey: this.pciVaultKey,
        CardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
        CardHolder: cardDetails.cardHolder,
        ExpiryDate: expiryDate,
        CVV: cardDetails.cvv,
        Method: 'Tokenize'
      }

      // In production, this would be a real API call
      // For now, we'll simulate the tokenization
      const response = await this.simulateTokenization(requestData)
      
      return response
    } catch (error) {
      console.error('Tokenization error:', error)
      return {
        success: false,
        error: 'Failed to tokenize card details'
      }
    }
  }

  /**
   * Process payment using tokenized card or direct payment
   */
  async processPayment(paymentData: PaymentRequest): Promise<PaymentResponse> {
    try {
      const reference = paymentData.reference || generatePaymentReference()
      const amountInCents = formatAmountForNetcash(paymentData.amount)

      // Build payment form data for Netcash Pay Now
      const formData = new FormData()
      formData.append('m1', this.serviceKey) // Service Key
      formData.append('m2', reference) // Unique Reference
      formData.append('p2', reference) // Unique Reference (duplicate)
      formData.append('p3', paymentData.description) // Description
      formData.append('p4', amountInCents.toString()) // Amount in cents
      formData.append('Budget', 'N') // Budget facility (N = No)
      formData.append('m4', paymentData.customerEmail) // Extra 1: Customer Email
      formData.append('m5', paymentData.customerName) // Extra 2: Customer Name
      formData.append('m6', netcashConfig.payNow.returnUrl) // Return URL
      
      // Set webhook URLs
      formData.append('m10', netcashConfig.payNow.notifyUrl) // Notify URL
      formData.append('m14', '1') // Enable email notification
      
      // If we have a token, add it for recurring payments
      if (paymentData.token) {
        formData.append('Token', paymentData.token)
      }

      // Generate payment URL (in production, this would redirect to Netcash)
      const paymentUrl = this.generatePaymentUrl(formData)

      return {
        success: true,
        transactionId: reference,
        paymentUrl: paymentUrl
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      return {
        success: false,
        error: 'Failed to process payment'
      }
    }
  }

  /**
   * Validate card using Netcash validation service
   */
  async validateCard(cardNumber: string): Promise<{ valid: boolean; cardType?: string }> {
    // Remove spaces from card number
    const cleanCardNumber = cardNumber.replace(/\s/g, '')
    
    // Basic card validation
    const cardType = this.detectCardType(cleanCardNumber)
    const isValid = this.luhnCheck(cleanCardNumber)
    
    return {
      valid: isValid,
      cardType: cardType
    }
  }

  /**
   * Setup recurring payment subscription
   */
  async setupRecurringPayment(token: string, amount: number, frequency: 'monthly' | 'weekly' | 'daily') {
    try {
      const requestData = {
        ServiceKey: this.serviceKey,
        Token: token,
        Amount: formatAmountForNetcash(amount),
        Frequency: frequency,
        StartDate: new Date().toISOString().split('T')[0],
        NumberOfOccurrences: 0 // 0 for indefinite
      }

      // This would be the actual API call in production
      console.log('Setting up recurring payment:', requestData)
      
      return {
        success: true,
        subscriptionId: generatePaymentReference()
      }
    } catch (error) {
      console.error('Recurring payment setup error:', error)
      return {
        success: false,
        error: 'Failed to setup recurring payment'
      }
    }
  }

  /**
   * Handle webhook notifications from Netcash
   */
  async handleWebhook(payload: Record<string, unknown>): Promise<{ success: boolean }> {
    try {
      // Validate webhook signature (in production)
      // Process the payment status update
      
      const { TransactionAccepted, Reference, Reason, Amount } = payload
      
      if (TransactionAccepted) {
        // Payment successful
        console.log(`Payment ${Reference} accepted for amount ${Amount}`)
        // Update order status in database
      } else {
        // Payment failed
        console.log(`Payment ${Reference} declined: ${Reason}`)
        // Handle failed payment
      }
      
      return { success: true }
    } catch (error) {
      console.error('Webhook processing error:', error)
      return { success: false }
    }
  }

  // Private helper methods

  private async simulateTokenization(data: Record<string, unknown>): Promise<TokenizationResponse> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For testing, always return success with a mock token
    const cardNumber = data.CardNumber
    const lastFour = cardNumber.slice(-4)
    const cardType = this.detectCardType(cardNumber)
    
    return {
      success: true,
      token: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      masked_card: `****-****-****-${lastFour}`,
      card_type: cardType
    }
  }

  private generatePaymentUrl(formData: FormData): string {
    // In production, this would create a POST form submission to Netcash
    // For testing, we'll return a URL with query parameters
    const params = new URLSearchParams()
    formData.forEach((value, key) => {
      params.append(key, value.toString())
    })
    
    return `${netcashConfig.urls.paymentSubmit}?${params.toString()}`
  }

  private detectCardType(cardNumber: string): string {
    const patterns = {
      visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
      mastercard: /^5[1-5][0-9]{14}$/,
      amex: /^3[47][0-9]{13}$/,
      discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/
    }
    
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        return type
      }
    }
    
    return 'unknown'
  }

  private luhnCheck(cardNumber: string): boolean {
    let sum = 0
    let isEven = false
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10)
      
      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }
}

// Export singleton instance
export const netcashPayment = new NetcashPaymentService()