/**
 * IELTS Max — Clean Curriculum & Admin Supabase Seed Script
 * Migrates ONLY curriculum (24 days, grammar2, 9 IELTS/Placement tests, answer keys)
 * plus creates the configured Admin account — NO old users, NO old progress, NO old groups.
 *
 * Usage:
 *   Ensure supabase/migrations/001_initial_schema.sql has been executed in Supabase SQL Editor.
 *   Run: npm run seed
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  for (const fname of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), fname);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
    }
  }
}

async function seed() {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "rakhmanovbilolbek04@gmail.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  const adminName = process.env.ADMIN_NAME || "Bilolbek Rakhmanov";

  if (!url || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env / .env.local");
    process.exit(1);
  }

  const sb = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const seedDir = path.resolve(process.cwd(), "src/data/seed");

  const readJson = (name: string) =>
    JSON.parse(fs.readFileSync(path.join(seedDir, name), "utf8"));

  // 1. Seed Days (1-24) + grammar2 (curriculum only)
  const days = readJson("days.json") as Array<{
    n: number;
    data: Record<string, unknown>;
    updated_at?: string;
  }>;
  const grammar2 = readJson("grammar2.json") as Record<string, unknown[]>;

  console.log(`Seeding ${days.length} course days (curriculum only)...`);
  const dayRows = days.map((d) => ({
    n: d.n,
    data: d.data,
    grammar2: grammar2[String(d.n)] ?? [],
    updated_at: d.updated_at ?? new Date().toISOString(),
  }));
  const { error: dayErr } = await sb.from("days").upsert(dayRows, { onConflict: "n" });
  if (dayErr) throw dayErr;

  // 2. Seed Answer Keys
  const answerKeys = readJson("answer_keys.json") as Array<{
    n: number;
    answers?: unknown;
    speak_answers?: unknown;
  }>;
  if (answerKeys.length) {
    console.log(`Seeding ${answerKeys.length} answer key sets...`);
    const { error: akErr } = await sb.from("answer_keys").upsert(
      answerKeys.map((k) => ({
        n: k.n,
        answers: k.answers ?? [],
        speak_answers: k.speak_answers ?? [],
      })),
      { onConflict: "n" }
    );
    if (akErr) throw akErr;
  }

  // 3. Seed Tests (Placement + 8 IELTS Listening & Reading Tests with fixed audio URLs)
  const tests = readJson("tests.json") as Array<{
    id: string;
    title: string;
    kind: string;
    day: number | null;
    required: boolean;
    reveal: boolean;
    data: Record<string, unknown>;
  }>;
  console.log(`Seeding ${tests.length} IELTS & Placement tests...`);
  const { error: testErr } = await sb.from("tests").upsert(tests, { onConflict: "id" });
  if (testErr) throw testErr;

  // 4. Ensure Admin Account exists in Auth & public.profiles (skipping old users/progress/groups)
  const { data: usersList } = await sb.auth.admin.listUsers();
  let adminUser = usersList?.users?.find(
    (u) => u.email?.toLowerCase() === adminEmail.toLowerCase()
  );

  if (!adminUser && adminPassword) {
    console.log(`Creating Admin account (${adminEmail})...`);
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { full_name: adminName, role: "admin" },
    });
    if (createErr) throw createErr;
    adminUser = created.user;
  }

  if (adminUser) {
    console.log(`Promoting ${adminEmail} to admin in public.profiles...`);
    const { error: profErr } = await sb.from("profiles").upsert(
      {
        id: adminUser.id,
        email: adminEmail,
        full_name: adminName,
        role: "admin",
        level: "C2",
        pace: 24,
        open_days: Array.from({ length: 24 }, (_, i) => i + 1),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (profErr) throw profErr;
  }

  console.log("IELTS Max clean curriculum + admin seed completed successfully.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
