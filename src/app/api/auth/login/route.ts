import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, supabaseId, name, avatar } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Find or create user in database
    const { data: existingUser } = await supabaseAdmin
      .from("User")
      .select("*")
      .eq("email", email)
      .single();

    let user = existingUser;

    if (!existingUser) {
      const { data: newUser, error: createError } = await supabaseAdmin
        .from("User")
        .insert({
          id: randomUUID(),
          supabaseId: supabaseId || null,
          email,
          name: name || email.split("@")[0],
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
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

      user = newUser;
    } else if (supabaseId && !existingUser.supabaseId) {
      await supabaseAdmin
        .from("User")
        .update({ supabaseId })
        .eq("id", existingUser.id);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Auth/login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
