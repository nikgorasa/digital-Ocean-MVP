import { NextResponse } from "next/server";
import * as users from "@/lib/db/users";
import * as packages from "@/lib/db/packages";
import * as leads from "@/lib/db/leads";
import * as bookings from "@/lib/db/bookings";
import * as companies from "@/lib/db/companies";
import { isPrisma, prisma, supabaseAdmin } from "@/lib/db";

export async function GET() {
  try {
    const [usersResult, activePackages, allLeads, bookingsCount, totalRevenue, companiesCount] = await Promise.all([
      users.findAll({ limit: 9999 }),
      packages.countActive(),
      leads.findAll().then((d: any[]) => d.length),
      bookings.countAll(),
      bookings.sumRevenue(),
      companies.countAll(),
    ]);

    let roleDistribution: { role: string; count: number }[] = [];
    if (isPrisma()) {
      const roles = await prisma.user.findMany({ select: { role: true } });
      const map: Record<string, number> = {};
      roles.forEach((r) => { map[r.role] = (map[r.role] || 0) + 1; });
      roleDistribution = Object.entries(map).map(([role, count]) => ({ role, count }));
    } else {
      const { data } = await supabaseAdmin.from('User').select('role');
      const map: Record<string, number> = {};
      (data || []).forEach((r: any) => { map[r.role] = (map[r.role] || 0) + 1; });
      roleDistribution = Object.entries(map).map(([role, count]) => ({ role, count }));
    }

    return NextResponse.json({
      totalCompanies: companiesCount,
      totalUsers: usersResult.total,
      activePackages,
      totalLeads: allLeads,
      totalBookings: bookingsCount,
      pendingLeads: 0,
      totalRevenue,
      roleDistribution,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
