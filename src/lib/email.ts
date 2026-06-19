import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// SMTP Configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Verify connection on startup
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('[Email] SMTP connection verified');
    return true;
  } catch (error) {
    console.warn('[Email] SMTP connection failed:', error);
    return false;
  }
}

// Send email
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"GoRASA" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('[Email] Sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

// Email templates
export const emailTemplates = {
  bookingConfirmation: (booking: {
    guestName: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    confirmationNo: string;
    amount: number;
  }) => ({
    subject: `Booking Confirmed - ${booking.hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Booking Confirmed! 🎉</h2>
        <p>Dear ${booking.guestName},</p>
        <p>Your hotel booking has been confirmed.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${booking.hotelName}</h3>
          <p style="margin: 5px 0;"><strong>Confirmation No:</strong> ${booking.confirmationNo}</p>
          <p style="margin: 5px 0;"><strong>Check-in:</strong> ${booking.checkIn}</p>
          <p style="margin: 5px 0;"><strong>Check-out:</strong> ${booking.checkOut}</p>
          <p style="margin: 5px 0;"><strong>Total:</strong> ₹${booking.amount.toLocaleString()}</p>
        </div>
        <p>View your booking details in <a href="https://cckr.vercel.app/trips">My Trips</a>.</p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),

  paymentReminder: (booking: {
    guestName: string;
    hotelName: string;
    amount: number;
    bookingId: string;
  }) => ({
    subject: `Complete Your Payment - ${booking.hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Payment Reminder ⏰</h2>
        <p>Dear ${booking.guestName},</p>
        <p>Your booking for <strong>${booking.hotelName}</strong> is still pending payment.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Amount:</strong> ₹${booking.amount.toLocaleString()}</p>
          <p style="margin: 5px 0; color: #92400e;"><strong>Note:</strong> This booking will be automatically cancelled in 12 hours if payment is not completed.</p>
        </div>
        <p><a href="https://cckr.vercel.app/trips" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Complete Payment</a></p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),

  bookingCancelled: (booking: {
    guestName: string;
    hotelName: string;
    reason: string;
  }) => ({
    subject: `Booking Cancelled - ${booking.hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Booking Cancelled</h2>
        <p>Dear ${booking.guestName},</p>
        <p>Your booking for <strong>${booking.hotelName}</strong> has been cancelled.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <p style="margin: 5px 0;"><strong>Reason:</strong> ${booking.reason}</p>
        </div>
        <p>If you'd like to rebook, please visit <a href="https://cckr.vercel.app/hotels">GoRASA Hotels</a>.</p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),
};
