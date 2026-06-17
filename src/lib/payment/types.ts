export interface CheckoutRequest {
  bookingId: string;
  gateway?: "razorpay" | "phonepe";
}

export interface CheckoutResponse {
  checkoutUrl: string;
  orderId: string;
}

export interface WebhookResult {
  success: boolean;
  bookingId: string;
  paymentId?: string;
}

export interface PaymentStatus {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
  amount: number;
  gateway: string;
  paymentId?: string;
  createdAt: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
}

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  receipt: string;
}

export interface RazorpayWebhookBody {
  event: string;
  payload: {
    payment: {
      entity: {
        id: string;
        order_id: string;
        amount: number;
        status: string;
        method: string;
      };
    };
    order: {
      entity: {
        id: string;
        amount: number;
        receipt: string;
      };
    };
  };
}

export interface PhonePePaymentResponse {
  success: boolean;
  code: string;
  data: {
    merchantId: string;
    transactionId: string;
    paymentLink: string;
  };
}

export interface PhonePeCallbackBody {
  response: string;
  encryptedPayload: string;
  encryptedChecksum: string;
}
