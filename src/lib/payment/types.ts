export interface CheckoutRequest {
  bookingId: string;
  gateway?: "zaakpay";
  returnUrl?: string;
  cancelUrl?: string;
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
  merchantTxnId?: string;
  createdAt: string;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
}

export interface ZaakpayOrderResponse {
  status: number;
  msg: string;
  merchantTransactionId: string;
}

export interface ZaakpayWebhookBody {
  merchantId: string;
  merchantTransactionId: string;
  transactionId: string;
  amount: number;
  status: number;
  responseCode: string;
  responseMessage: string;
}

export interface ZaakpayCheckStatusResponse {
  status: number;
  data: {
    state: string;
    amount: number;
    transactionId: string;
    merchantTransactionId: string;
  };
}
