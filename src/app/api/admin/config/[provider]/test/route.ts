import { NextRequest, NextResponse } from "next/server";
import { readConfig } from "@/lib/config-service";
import { requireAdmin } from "@/lib/auth-helpers";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  try {
    await requireAdmin();
    const { provider } = await params;

    if (!["tbo_hotel", "tbo_hotel_static", "tbo_flight"].includes(provider)) {
      return NextResponse.json({ error: `Unknown provider: ${provider}` }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const testUsername = body.username;
    const testPassword = body.password;

    // If credentials provided inline, use those; otherwise fall back to saved config
    const cfg = await readConfig(provider);

    const username = testUsername || cfg.username || cfg.staticUsername || "";
    const password = testPassword || cfg.password || cfg.staticPassword || "";

    switch (provider) {
      case "tbo_hotel": {
        const baseUrl = cfg.baseUrl || "https://affiliate.tektravels.com/HotelAPI";
        const authUrl = "http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
        const clientId = cfg.clientId || "ApiIntegrationNew";

        const res = await fetch(authUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ClientId: clientId,
            UserName: username,
            Password: password,
            EndUserIp: "192.168.1.1",
          }),
        });

        if (!res.ok) {
          return NextResponse.json({
            success: false,
            error: `Auth HTTP ${res.status}: ${res.statusText}`,
          });
        }

        const data = await res.json();
        if (data.Status === 1) {
          return NextResponse.json({
            success: true,
            message: "Authentication successful",
            tokenId: data.TokenId?.slice(0, 20) + "...",
          });
        }
        return NextResponse.json({
          success: false,
          error: data.Error?.ErrorMessage || `Auth failed: Status ${data.Status}`,
        });
      }

      case "tbo_hotel_static": {
        const staticUrl = cfg.staticUrl || "http://api.tbotechnology.in/TBOHolidays_HotelAPI";
        const auth = Buffer.from(`${username}:${password}`).toString("base64");

        const res = await fetch(`${staticUrl}/CountryList`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        });

        if (!res.ok) {
          return NextResponse.json({
            success: false,
            error: `Static HTTP ${res.status}: ${res.statusText}`,
          });
        }

        const data = await res.json();
        const countryCount = data.CountryList?.length || 0;
        return NextResponse.json({
          success: true,
          message: `Static data accessible — ${countryCount} countries found`,
          detail: { countryCount },
        });
      }

      case "tbo_flight": {
        const authUrl = "http://Sharedapi.tektravels.com/SharedData.svc/rest/Authenticate";
        const clientId = cfg.clientId || "ApiIntegrationNew";

        const res = await fetch(authUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ClientId: clientId,
            UserName: username,
            Password: password,
            EndUserIp: "192.168.1.1",
          }),
        });

        if (!res.ok) {
          return NextResponse.json({
            success: false,
            error: `Auth HTTP ${res.status}: ${res.statusText}`,
          });
        }

        const data = await res.json();
        if (data.Status === 1) {
          return NextResponse.json({
            success: true,
            message: "Flight authentication successful",
            tokenId: data.TokenId?.slice(0, 20) + "...",
          });
        }
        return NextResponse.json({
          success: false,
          error: data.Error?.ErrorMessage || `Auth failed: Status ${data.Status}`,
        });
      }

      default:
        return NextResponse.json({ error: "Unknown provider" }, { status: 400 });
    }
  } catch (e) {
    console.error("Config test error:", e);
    return NextResponse.json({
      success: false,
      error: e instanceof Error ? e.message : "Connection test failed",
    });
  }
}
