/**
 * Payment Error Handling Utility
 * Provides error code mapping, user-friendly messages, and retry suggestions
 */

export enum PaymentErrorCode {
  // Card/Payment Errors
  DECLINED = 'DECLINED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_CARD = 'INVALID_CARD',
  EXPIRED_CARD = 'EXPIRED_CARD',
  INVALID_CVV = 'INVALID_CVV',
  CARD_BLOCKED = 'CARD_BLOCKED',

  // Network/Technical Errors
  TIMEOUT = 'TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',

  // User Errors
  CANCELLED = 'CANCELLED',
  ABANDONED = 'ABANDONED',

  // System Errors
  ORDER_CREATION_FAILED = 'ORDER_CREATION_FAILED',
  PAYMENT_INITIATION_FAILED = 'PAYMENT_INITIATION_FAILED',

  // Unknown
  UNKNOWN = 'UNKNOWN',
}

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
  userMessage: string;
  suggestion: string;
  retryable: boolean;
  suggestAlternative: boolean;
}

/**
 * Map error codes to user-friendly error information
 */
export function mapPaymentError(errorCode: string | PaymentErrorCode, rawMessage?: string): PaymentError {
  const code = errorCode.toUpperCase() as PaymentErrorCode;

  const errorMap: Record<PaymentErrorCode, Omit<PaymentError, 'code'>> = {
    [PaymentErrorCode.DECLINED]: {
      message: 'Payment declined by your bank',
      userMessage: 'Your payment was declined. This usually happens when your bank blocks online transactions or international payments.',
      suggestion: 'Please contact your bank to authorize the payment, or try a different card.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.INSUFFICIENT_FUNDS]: {
      message: 'Insufficient funds',
      userMessage: 'Your card has insufficient funds for this transaction.',
      suggestion: 'Please check your account balance and try again with a different card, or contact your bank.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.INVALID_CARD]: {
      message: 'Invalid card details',
      userMessage: 'The card details you entered appear to be invalid.',
      suggestion: 'Please double-check your card number, expiry date, and CVV, then try again.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.EXPIRED_CARD]: {
      message: 'Card has expired',
      userMessage: 'Your card has expired.',
      suggestion: 'Please use a different card with a valid expiry date.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.INVALID_CVV]: {
      message: 'Invalid CVV/CVC code',
      userMessage: 'The CVV/CVC code you entered is incorrect.',
      suggestion: 'Please check the 3-digit security code on the back of your card and try again.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.CARD_BLOCKED]: {
      message: 'Card is blocked',
      userMessage: 'Your card has been blocked by your bank.',
      suggestion: 'Please contact your bank to unblock your card, or use a different payment method.',
      retryable: true,
      suggestAlternative: true,
    },
    [PaymentErrorCode.TIMEOUT]: {
      message: 'Payment gateway timeout',
      userMessage: 'The payment request timed out. This might be due to slow internet connection or payment gateway issues.',
      suggestion: 'Please check your internet connection and try again in a few moments.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.NETWORK_ERROR]: {
      message: 'Network connection error',
      userMessage: 'We couldn\'t connect to the payment gateway. Please check your internet connection.',
      suggestion: 'Please ensure you have a stable internet connection and try again.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.SERVER_ERROR]: {
      message: 'Payment gateway server error',
      userMessage: 'The payment gateway is experiencing technical difficulties.',
      suggestion: 'Please try again in a few minutes. If the problem persists, contact support.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.CANCELLED]: {
      message: 'Payment cancelled by user',
      userMessage: 'You cancelled the payment.',
      suggestion: 'No problem! You can resume your order whenever you\'re ready.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.ABANDONED]: {
      message: 'Payment window closed',
      userMessage: 'The payment window was closed before completion.',
      suggestion: 'You can continue with your payment whenever you\'re ready.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.ORDER_CREATION_FAILED]: {
      message: 'Failed to create order',
      userMessage: 'We couldn\'t create your order due to a system error.',
      suggestion: 'Please try again. If the problem persists, contact support with your order details.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.PAYMENT_INITIATION_FAILED]: {
      message: 'Failed to initiate payment',
      userMessage: 'We couldn\'t start the payment process.',
      suggestion: 'Please try again. If the problem persists, contact support.',
      retryable: true,
      suggestAlternative: false,
    },
    [PaymentErrorCode.UNKNOWN]: {
      message: rawMessage || 'Unknown payment error',
      userMessage: 'An unexpected error occurred during payment processing.',
      suggestion: 'Please try again. If the problem persists, contact support for assistance.',
      retryable: true,
      suggestAlternative: false,
    },
  };

  const errorInfo = errorMap[code] || errorMap[PaymentErrorCode.UNKNOWN];

  return {
    code,
    ...errorInfo,
  };
}

/**
 * Detect payment error code from error message
 */
export function detectPaymentErrorCode(error: Error | string): PaymentErrorCode {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // Card errors
  if (lowerMessage.includes('declined') || lowerMessage.includes('reject')) {
    return PaymentErrorCode.DECLINED;
  }
  if (lowerMessage.includes('insufficient') || lowerMessage.includes('funds')) {
    return PaymentErrorCode.INSUFFICIENT_FUNDS;
  }
  if (lowerMessage.includes('invalid card') || lowerMessage.includes('bad card')) {
    return PaymentErrorCode.INVALID_CARD;
  }
  if (lowerMessage.includes('expired')) {
    return PaymentErrorCode.EXPIRED_CARD;
  }
  if (lowerMessage.includes('cvv') || lowerMessage.includes('cvc') || lowerMessage.includes('security code')) {
    return PaymentErrorCode.INVALID_CVV;
  }
  if (lowerMessage.includes('blocked') || lowerMessage.includes('restricted')) {
    return PaymentErrorCode.CARD_BLOCKED;
  }

  // Network errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return PaymentErrorCode.TIMEOUT;
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return PaymentErrorCode.NETWORK_ERROR;
  }
  if (lowerMessage.includes('server error') || lowerMessage.includes('500') || lowerMessage.includes('503')) {
    return PaymentErrorCode.SERVER_ERROR;
  }

  // User actions
  if (lowerMessage.includes('cancel') || lowerMessage.includes('abort')) {
    return PaymentErrorCode.CANCELLED;
  }
  if (lowerMessage.includes('abandon') || lowerMessage.includes('closed')) {
    return PaymentErrorCode.ABANDONED;
  }

  // System errors
  if (lowerMessage.includes('create order') || lowerMessage.includes('order creation')) {
    return PaymentErrorCode.ORDER_CREATION_FAILED;
  }
  if (lowerMessage.includes('initiate payment') || lowerMessage.includes('payment initiation')) {
    return PaymentErrorCode.PAYMENT_INITIATION_FAILED;
  }

  return PaymentErrorCode.UNKNOWN;
}

/**
 * Check if error should trigger alternative payment method suggestion
 */
export function shouldSuggestAlternative(retryCount: number, errorCode: PaymentErrorCode): boolean {
  // Suggest alternative after 3 retries for any error
  if (retryCount >= 3) {
    return true;
  }

  // Immediate suggestion for blocked cards
  if (errorCode === PaymentErrorCode.CARD_BLOCKED) {
    return true;
  }

  return false;
}

/**
 * Get alternative payment methods suggestion message
 */
export function getAlternativePaymentSuggestion(): string {
  return `
We notice you're having trouble completing your payment. Here are some alternatives:

• **EFT/Bank Transfer**: Pay directly from your bank account
• **Contact Us**: Call 0860 CIRCLE (247 253) for assisted payment
• **Payment Link**: We can email you a secure payment link
• **Reserve Your Order**: We can hold your order for 24 hours while you arrange payment

Our support team is available Mon-Fri 8am-6pm to assist you.
  `.trim();
}

/**
 * Format retry suggestion based on retry count
 */
export function getRetrySuggestion(retryCount: number): string {
  if (retryCount === 0) {
    return 'You can try again with a different payment method.';
  }
  if (retryCount === 1) {
    return 'Please double-check your payment details before trying again.';
  }
  if (retryCount === 2) {
    return 'If you\'re still having trouble, consider using a different card or contact your bank.';
  }
  return 'After multiple attempts, we recommend contacting support for assistance.';
}
