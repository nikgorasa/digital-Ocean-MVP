let mockOrderCounter = 0;

export type MockScenario = 'success' | 'failure' | 'timeout' | 'random';

export interface MockPaymentOptions {
  scenario?: MockScenario;
  amount?: number;
  bookingId?: string;
}

export function generateMockOrderId(): string {
  mockOrderCounter++;
  return `mock_order_${Date.now()}_${mockOrderCounter}`;
}

export function generateMockPaymentId(): string {
  return `mock_pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createMockWebhookPayload(orderId: string, amount?: number, bookingId?: string) {
  return {
    event: "payment.captured",
    payload: {
      payment: {
        entity: {
          id: generateMockPaymentId(),
          order_id: orderId,
          amount: amount || 0,
          status: "captured",
          method: "upi",
        },
      },
      order: {
        entity: {
          id: orderId,
          amount: amount || 0,
          receipt: bookingId || "",
        },
      },
    },
  };
}

export function getMockCheckoutUrl(orderId: string, appUrl: string, bookingId?: string, amount?: number): string {
  const params = new URLSearchParams({ order_id: orderId, mock: "true" });
  if (bookingId) params.set("bookingId", bookingId);
  if (amount) params.set("amount", String(amount));
  return `${appUrl}/payment/success?${params.toString()}`;
}

export async function simulateMockPayment(options: MockPaymentOptions = {}): Promise<{
  success: boolean;
  orderId: string;
  paymentId?: string;
  error?: string;
  scenario: MockScenario;
}> {
  const scenario = options.scenario || 'random';
  const orderId = generateMockOrderId();
  
  // Simulate processing delay (1-3 seconds)
  const delay = 1000 + Math.random() * 2000;
  await new Promise(resolve => setTimeout(resolve, delay));

  // Determine outcome based on scenario
  let success: boolean;
  let error: string | undefined;

  switch (scenario) {
    case 'success':
      success = true;
      break;
    case 'failure':
      success = false;
      error = 'Payment declined by bank';
      break;
    case 'timeout':
      success = false;
      error = 'Payment timeout - please try again';
      break;
    case 'random':
    default:
      // 90% success rate
      success = Math.random() > 0.1;
      if (!success) {
        const errors = [
          'Payment declined by bank',
          'Insufficient funds',
          'Card expired',
          'Invalid card number',
          'Payment timeout',
        ];
        error = errors[Math.floor(Math.random() * errors.length)];
      }
      break;
  }

  return {
    success,
    orderId,
    paymentId: success ? generateMockPaymentId() : undefined,
    error,
    scenario,
  };
}
