export const PAYMENT_CONFIG = {
  mock: process.env.NODE_ENV === "production"
    ? process.env.PAYMENT_MOCK === "true"
    : process.env.PAYMENT_MOCK !== "false",
  gateway: (process.env.PAYMENT_GATEWAY || "zaakpay") as "zaakpay",
  zaakpay: {
    merchantId: process.env.ZAAKPAY_MERCHANT_ID || "",
    secretKey: process.env.ZAAKPAY_SECRET_KEY || "",
    salt: process.env.ZAAKPAY_SALT || "",
    apiBase: process.env.ZAAKPAY_API_BASE || "https://sandbox.zaakpay.com",
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
