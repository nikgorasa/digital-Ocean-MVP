import { NextRequest, NextResponse } from "next/server";
import * as users from "@/lib/db/users";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")));

    const result = await users.findAll({ search: search || undefined, role: role || undefined, page, limit });

    const [activeCount, adminCount, customerCount] = await Promise.all([
      users.countActive(),
      users.countByRoles(["ADMIN", "SUPER_ADMIN"]),
      users.countByRole("CUSTOMER"),
    ]);

    return NextResponse.json({
      users: result.users,
      total: result.total,
      counts: { active: activeCount, admins: adminCount, customers: customerCount },
      page,
      limit,
    });
  } catch (error) {
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role, companyId, password } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    // Create Supabase Auth user
    const { supabaseAdmin } = await import("@/lib/supabase-admin");
    const tempPassword = password || `GoRASA-${Math.random().toString(36).slice(-8)}`;

    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { name, role: role || "CUSTOMER" },
    });

    if (authError) {
      console.error("Supabase Auth error:", authError.message);
      // If user already exists in auth, try to get their ID
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u) => u.email === email);
      if (existing) {
        // User exists in auth, just create DB record with their auth ID
        const user = await users.create({
          id: existing.id,
          email,
          name,
          role: role || "CUSTOMER",
          companyId: companyId || null,
          supabaseId: existing.id,
        });
        return NextResponse.json({ ...user, tempPassword, note: "User already existed in auth" }, { status: 201 });
      }
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }

    // Create DB record linked to auth user
    const user = await users.create({
      id: authUser.user.id,
      email,
      name,
      role: role || "CUSTOMER",
      companyId: companyId || null,
      supabaseId: authUser.user.id,
    });

    return NextResponse.json({ ...user, tempPassword }, { status: 201 });
  } catch (error) {
    console.error("User create error:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, role, isActive, name, email } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    const user = await users.update(id, updateData);
    return NextResponse.json(user);
  } catch (error) {
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
