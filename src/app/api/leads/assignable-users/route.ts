import { NextResponse } from "next/server";
import * as users from "@/lib/db/users";

export async function GET() {
  try {
    const result = await users.findAll();
    const assignable = (result.users as any[])
      .filter((u) => ["SALES", "ADMIN", "SUPER_ADMIN"].includes(u.role) && u.isActive)
      .map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return NextResponse.json(assignable);
  } catch {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
