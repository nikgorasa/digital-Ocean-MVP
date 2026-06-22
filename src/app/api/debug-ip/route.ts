import { NextResponse } from "next/server";

export async function GET() {
  const prefix = process.env.VERCEL_REGION ? `Vercel (${process.env.VERCEL_REGION})` : "Local";
  const ips: Record<string, string> = {};
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    const ip = await res.json();
    ips.ipv4 = `${ip.ip} (${prefix})`;
  } catch {
    ips.ipv4 = `failed (${prefix})`;
  }
  try {
    const res = await fetch("https://api6.ipify.org");
    const ip = await res.text();
    ips.ipv6 = `${ip} (${prefix})`;
  } catch {
    ips.ipv6 = `failed (${prefix})`;
  }
  return NextResponse.json(ips);
}
