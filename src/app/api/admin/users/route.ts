import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email: string;
      password?: string;
      full_name: string;
      role?: "student" | "assistant" | "teacher" | "admin";
      group_id?: string | null;
      level?: string;
      pace?: 24 | 48;
      open_days?: number[];
    };

    if (!body.email?.trim() || !body.full_name?.trim()) {
      return NextResponse.json(
        { error: "Full name and email address are required." },
        { status: 400 }
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Live Supabase mode when service role key is present
    if (url && serviceKey) {
      const adminSb = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: created, error: authErr } = await adminSb.auth.admin.createUser({
        email: body.email.trim(),
        password: body.password || "IeltsMax2026!",
        email_confirm: true,
        user_metadata: {
          full_name: body.full_name.trim(),
          role: body.role || "student",
        },
      });

      if (authErr || !created.user) {
        return NextResponse.json(
          { error: authErr?.message || "Failed to create Supabase user." },
          { status: 400 }
        );
      }

      const profileRow = {
        id: created.user.id,
        email: body.email.trim(),
        full_name: body.full_name.trim(),
        role: body.role || "student",
        group_id: body.group_id || null,
        level: body.level || "A1",
        pace: body.pace === 48 ? 48 : 24,
        open_days: body.open_days || [1],
      };

      const { error: profErr } = await adminSb
        .from("profiles")
        .upsert(profileRow, { onConflict: "id" });

      if (profErr) {
        return NextResponse.json({ error: profErr.message }, { status: 400 });
      }

      return NextResponse.json({ mode: "supabase", user: profileRow }, { status: 201 });
    }

    // Local Seed Mode fallback — return clean generated profile for client persistence
    return NextResponse.json(
      {
        mode: "local",
        user: {
          id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          email: body.email.trim(),
          full_name: body.full_name.trim(),
          role: body.role || "student",
          group_id: body.group_id || null,
          level: body.level || "A1",
          pace: body.pace === 48 ? 48 : 24,
          open_days: body.open_days || [1],
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 500 });
  }
}
