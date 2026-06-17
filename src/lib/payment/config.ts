export const PAYMENT_CONFIG = {
  mock: process.env.PAYMENT_MOCK !== "false",
  gateway: (process.env.PAYMENT_GATEWAY || "razorpay") as "razorpay" | "phonepe",
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  },
  phonepe: {
    merchantId: process.env.PHONEPE_MERCHANT_ID || "",
    saltKey: process.env.PHONEPE_SALT_KEY || "",
    saltIndex: process.env.PHONEPE_SALT_INDEX || "1",
    apiBase: process.env.PHONEPE_API_BASE || "https://api-preprod.phonepe.com",
  },
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};
