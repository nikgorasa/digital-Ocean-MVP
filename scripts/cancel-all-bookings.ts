#!/usr/bin/env node
/**
 * Cancel all TBO bookings and refund credits to company wallet
 * Usage: npx tsx scripts/cancel-all-bookings.ts
 */

import { prisma } from "../src/lib/prisma";
import { cancelBooking } from "../src/lib/tbo-hotel-client";

async function main() {
  console.log("=== CANCEL ALL BOOKINGS ===\n");

  // Get all non-cancelled bookings
  const bookings = await prisma.booking.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { bookedAt: "desc" },
  });

  console.log(`Found ${bookings.length} non-cancelled bookings\n`);

  // Separate TBO bookings from mock bookings
  const tboBookings = bookings.filter(b => b.supplierBookingRef);
  const mockBookings = bookings.filter(b => !b.supplierBookingRef);

  console.log(`TBO Bookings (with supplierBookingRef): ${tboBookings.length}`);
  console.log(`Mock/Test Bookings (no supplierBookingRef): ${mockBookings.length}\n`);

  // Get company for wallet refunds
  const companyId = "cmrdkoim10000l8048tqwpnuj"; // VASA Denticity
  const company = await prisma.company.findUnique({ where: { id: companyId } });
  if (!company) {
    console.error("Company not found!");
    return;
  }
  console.log(`Company: ${company.name}`);
  console.log(`Current Wallet Balance: ₹${company.walletBalance}\n`);

  let totalRefund = 0;
  let cancelledCount = 0;
  let failedCount = 0;

  // Cancel TBO hotel bookings via TBO API
  console.log("--- Cancelling TBO Hotel Bookings ---");
  for (const booking of tboBookings.filter(b => b.type === "HOTEL")) {
    const tboBookingId = parseInt(booking.supplierBookingRef!);
    if (isNaN(tboBookingId)) {
      console.log(`  SKIP ${booking.itemName} - invalid supplierBookingRef: ${booking.supplierBookingRef}`);
      continue;
    }

    console.log(`  Cancelling: ${booking.itemName} (TBO ID: ${tboBookingId}, ₹${booking.price})...`);
    try {
      const result = await cancelBooking({ bookingId: tboBookingId, remarks: "Bulk cancellation for credit recovery" });
      console.log(`    ✓ Cancelled. ChangeRequestId: ${result.changeRequestId}`);

      // Update booking status
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
      });

      // Refund to wallet if corporate booking
      if (booking.companyId && booking.paymentStatus === "COMPLETED") {
        const refundAmount = booking.price;
        const newBalance = company.walletBalance + refundAmount;
        await prisma.$transaction([
          prisma.company.update({
            where: { id: booking.companyId },
            data: { walletBalance: newBalance },
          }),
          prisma.walletLedger.create({
            data: {
              companyId: booking.companyId,
              type: "REFUND",
              amount: refundAmount,
              balanceAfter: newBalance,
              referenceType: "BOOKING",
              referenceId: booking.id,
              description: `Refund: ${booking.itemName} (TBO Cancel)`,
              performedBy: "SYSTEM",
            },
          }),
        ]);
        company.walletBalance = newBalance;
        totalRefund += refundAmount;
        console.log(`    ✓ Refunded ₹${refundAmount} to wallet. New balance: ₹${newBalance}`);
      }

      cancelledCount++;
    } catch (e) {
      console.log(`    ✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
      failedCount++;
    }
  }

  // Cancel TBO flight bookings (no TBO cancel API for flights in test, just mark as cancelled)
  console.log("\n--- Cancelling TBO Flight Bookings ---");
  for (const booking of tboBookings.filter(b => b.type === "FLIGHT")) {
    console.log(`  Marking as cancelled: ${booking.itemName} (PNR: ${booking.pnr}, ₹${booking.price})...`);
    
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
    });

    if (booking.companyId && booking.paymentStatus === "COMPLETED") {
      const refundAmount = booking.price;
      const newBalance = company.walletBalance + refundAmount;
      await prisma.$transaction([
        prisma.company.update({
          where: { id: booking.companyId },
          data: { walletBalance: newBalance },
        }),
        prisma.walletLedger.create({
          data: {
            companyId: booking.companyId,
            type: "REFUND",
            amount: refundAmount,
            balanceAfter: newBalance,
            referenceType: "BOOKING",
            referenceId: booking.id,
            description: `Refund: ${booking.itemName} (Flight Cancel)`,
            performedBy: "SYSTEM",
          },
        }),
      ]);
      company.walletBalance = newBalance;
      totalRefund += refundAmount;
      console.log(`    ✓ Refunded ₹${refundAmount} to wallet. New balance: ₹${newBalance}`);
    }

    cancelledCount++;
  }

  // Cancel mock/test bookings
  console.log("\n--- Cancelling Mock/Test Bookings ---");
  for (const booking of mockBookings) {
    console.log(`  Marking as cancelled: ${booking.itemName} (₹${booking.price})...`);
    
    await prisma.booking.update({
      where: { id: booking.id },
      data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
    });

    if (booking.companyId && booking.paymentStatus === "COMPLETED") {
      const refundAmount = booking.price;
      const newBalance = company.walletBalance + refundAmount;
      await prisma.$transaction([
        prisma.company.update({
          where: { id: booking.companyId },
          data: { walletBalance: newBalance },
        }),
        prisma.walletLedger.create({
          data: {
            companyId: booking.companyId,
            type: "REFUND",
            amount: refundAmount,
            balanceAfter: newBalance,
            referenceType: "BOOKING",
            referenceId: booking.id,
            description: `Refund: ${booking.itemName} (Mock Cancel)`,
            performedBy: "SYSTEM",
          },
        }),
      ]);
      company.walletBalance = newBalance;
      totalRefund += refundAmount;
      console.log(`    ✓ Refunded ₹${refundAmount} to wallet. New balance: ₹${newBalance}`);
    }

    cancelledCount++;
  }

  // Cancel associated invoices
  console.log("\n--- Cancelling Invoices ---");
  const invoicesCancelled = await prisma.invoice.updateMany({
    where: { status: { not: "CANCELLED" } },
    data: { status: "CANCELLED" },
  });
  console.log(`  Cancelled ${invoicesCancelled.count} invoices`);

  // Summary
  console.log("\n=== SUMMARY ===");
  console.log(`Total bookings cancelled: ${cancelledCount}`);
  console.log(`Failed cancellations: ${failedCount}`);
  console.log(`Total refund: ₹${totalRefund.toFixed(2)}`);
  console.log(`Final wallet balance: ₹${company.walletBalance.toFixed(2)}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
