import nodemailer from 'nodemailer';
import { formatCurrency } from './utils';

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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cckr.vercel.app';

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
    currency?: string;
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
          <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(booking.amount, booking.currency || 'INR')}</p>
        </div>
        <p>View your booking details in <a href="${APP_URL}/trips">My Trips</a>.</p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),

  paymentReminder: (booking: {
    guestName: string;
    hotelName: string;
    amount: number;
    bookingId: string;
    currency?: string;
  }) => ({
    subject: `Complete Your Payment - ${booking.hotelName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #f59e0b;">Payment Reminder ⏰</h2>
        <p>Dear ${booking.guestName},</p>
        <p>Your booking for <strong>${booking.hotelName}</strong> is still pending payment.</p>
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${formatCurrency(booking.amount, booking.currency || 'INR')}</p>
          <p style="margin: 5px 0; color: #92400e;"><strong>Note:</strong> This booking will be automatically cancelled in 12 hours if payment is not completed.</p>
        </div>
        <p><a href="${APP_URL}/trips" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">Complete Payment</a></p>
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
        <p>If you'd like to rebook, please visit <a href="${APP_URL}/hotels">GoRASA Hotels</a>.</p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),

  invoiceIssued: (invoice: {
    companyName: string;
    invoiceNumber: string;
    bookingItem: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    dueDate: string | null;
    currency?: string;
  }) => ({
    subject: `Invoice ${invoice.invoiceNumber} - GoRASA Travel`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Invoice Issued</h2>
        <p>Dear ${invoice.companyName},</p>
        <p>An invoice has been issued for your recent booking.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">Invoice #${invoice.invoiceNumber}</h3>
          <p style="margin: 5px 0;"><strong>Booking:</strong> ${invoice.bookingItem}</p>
          <p style="margin: 5px 0;"><strong>Amount:</strong> ${formatCurrency(invoice.amount, invoice.currency || 'INR')}</p>
          ${invoice.taxAmount > 0 ? `<p style="margin: 5px 0;"><strong>Tax:</strong> ${formatCurrency(invoice.taxAmount, invoice.currency || 'INR')}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Total:</strong> ${formatCurrency(invoice.totalAmount, invoice.currency || 'INR')}</p>
          <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAID</span></p>
          ${invoice.dueDate ? `<p style="margin: 5px 0;"><strong>Due Date:</strong> ${invoice.dueDate}</p>` : ''}
        </div>
        <p><a href="${APP_URL}/trips" style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">View Invoice</a></p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),

  invoiceOverdue: (invoice: {
    companyName: string;
    invoiceNumber: string;
    totalAmount: number;
    dueDate: string;
    currency?: string;
  }) => ({
    subject: `OVERDUE: Invoice ${invoice.invoiceNumber} - GoRASA Travel`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Invoice Overdue</h2>
        <p>Dear ${invoice.companyName},</p>
        <p>The following invoice is past its due date and requires immediate attention.</p>
        <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 10px 0;">Invoice #${invoice.invoiceNumber}</h3>
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${formatCurrency(invoice.totalAmount, invoice.currency || 'INR')}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${invoice.dueDate}</p>
          <p style="margin: 5px 0; color: #92400e;"><strong>Status:</strong> OVERDUE</p>
        </div>
        <p>Please settle this invoice at your earliest convenience.</p>
        <p>Best regards,<br/>GoRASA Team</p>
      </div>
    `,
  }),
};
