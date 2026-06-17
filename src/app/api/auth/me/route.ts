import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find or create user in database
    const { data: existingUser } = await supabaseAdmin
      .from("User")
      .select("*")
      .eq("email", user.email!)
      .single();

    if (!existingUser) {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("User")
        .insert({
          id: randomUUID(),
          supabaseId: user.id,
          email: user.email!,
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User",
          avatar: user.user_metadata?.avatar_url,
          role: "CUSTOMER",
          updatedAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        console.error("User create error:", createError);
        return NextResponse.json(
          { error: "Failed to create user" },
          { status: 500 }
        );
      }

      return NextResponse.json(newUser);
    }

    // Update supabaseId if not set
    if (!existingUser.supabaseId) {
      await supabaseAdmin
        .from("User")
        .update({ supabaseId: user.id })
        .eq("id", existingUser.id);
    }

    return NextResponse.json(existingUser);
  } catch (error) {
    console.error("Auth/me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
