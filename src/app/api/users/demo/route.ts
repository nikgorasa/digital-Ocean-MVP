import { NextResponse } from "next/server";
import * as users from "@/lib/db/users";

export async function GET() {
  try {
    const demoUsers = await users.findDemoUsers();
    return NextResponse.json(demoUsers);
  } catch (error) {
    console.error("Demo users error:", error);
    return NextResponse.json({ error: "Failed to fetch demo users" }, { status: 500 });
  }
}
