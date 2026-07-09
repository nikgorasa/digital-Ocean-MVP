import { NextRequest, NextResponse } from "next/server";
import * as users from "@/lib/db/users";
import { requireAdmin, sanitizeUser } from "@/lib/auth-helpers";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

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

    const sanitizedUsers = result.users.map((u) => sanitizeUser(u as Record<string, unknown>));

    return NextResponse.json({
      users: sanitizedUsers,
      total: result.total,
      counts: { active: activeCount, admins: adminCount, customers: customerCount },
      page,
      limit,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Users fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { email, name, role, companyId } = body;

    if (!email || !name) {
      return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    const existing = await users.findByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    const effectiveRole = role || "CUSTOMER";
    const effectiveCompanyId = effectiveRole === "CORPORATE_USER" ? (companyId || null) : null;

    const user = await users.create({
      email,
      name,
      role: effectiveRole,
      companyId: effectiveCompanyId,
    });

    return NextResponse.json(sanitizeUser(user as Record<string, unknown>), { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("User create error:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { id, role, isActive, name, email, companyId } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const existing = await users.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const effectiveRole = role !== undefined ? role : existing.role;

    const updateData: Record<string, unknown> = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;

    if (effectiveRole !== "CORPORATE_USER") {
      // Non-corporate users cannot be linked to a company
      if (companyId !== undefined && companyId !== null) {
        return NextResponse.json(
          { error: "Only CORPORATE_USER role can be linked to a company" },
          { status: 400 }
        );
      }
      updateData.companyId = null;
    } else {
      if (companyId !== undefined) updateData.companyId = companyId;
    }

    const user = await users.update(id, updateData);
    return NextResponse.json(sanitizeUser(user as Record<string, unknown>));
  } catch (error) {
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("User update error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
