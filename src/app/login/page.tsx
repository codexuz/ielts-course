"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CheckCircle2, Headphones, Mic, PenTool, ShieldCheck, Video } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function LoginPage() {
  const router = useRouter();
  const { isLiveSupabase, signInSupabase, signUpSupabase, loginDemo } = useApp();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState(isLiveSupabase ? "" : "student@ieltsmax.edu");
  const [password, setPassword] = useState(isLiveSupabase ? "" : "ieltsmax2026");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (isLiveSupabase) {
        const res =
          mode === "login"
            ? await signInSupabase(email, password)
            : await signUpSupabase(email, password, fullName);
        if (res.error) {
          setError(res.error);
          return;
        }
      } else {
        loginDemo("student", email);
      }
      router.push("/");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-xl border border-border bg-card overflow-hidden">
        {/* Left Oxford Ink Navy Panel */}
        <div className="md:col-span-5 bg-shell text-shell-foreground p-7 sm:p-8 flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold tabular">
                24
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight leading-none">IELTS Max</p>
                <p className="text-xs text-shell-muted mt-1">Intensive English &amp; IELTS Cohort</p>
              </div>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                24 days. 5 core skills. Real exam precision.
              </h1>
              <p className="text-sm text-shell-muted">
                Every day unlocks sequentially as you master podcasts, articles, TED-Ed talks, speaking recordings, and IELTS Task 2 essays.
              </p>
            </div>

            <ul className="space-y-2.5 text-sm text-shell-foreground/90">
              <li className="flex items-center gap-2.5">
                <Headphones className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span>Timestamped podcast transcription</span>
              </li>
              <li className="flex items-center gap-2.5">
                <BookOpen className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span>Article summarization &amp; 43-article Reading Room</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Video className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span>TED-Ed video gap-fill &amp; short film analysis</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mic className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span>Speaking voice recorder &amp; vocabulary quiz</span>
              </li>
              <li className="flex items-center gap-2.5">
                <PenTool className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                <span>IELTS Task 2 writing feedback &amp; computer-delivered exams</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-shell-border flex items-center justify-between text-xs text-shell-muted">
            <span>Next.js + Supabase Edition</span>
            <Badge variant="outline" className="border-shell-border text-shell-foreground">
              {isLiveSupabase ? "Supabase Live" : "Local Seed Ready"}
            </Badge>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:col-span-7 p-7 sm:p-9 flex flex-col justify-center space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {mode === "login" ? "Sign in to your workspace" : "Create your student account"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isLiveSupabase
                ? "Authenticate with your Supabase account credentials."
                : "Running in Local Seed Mode — sign in directly or enter as Student / Admin below."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                mode === "login" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`rounded py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                mode === "signup" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" ? (
              <div className="space-y-1.5">
                <label htmlFor="full-name" className="text-sm font-medium">
                  Full name
                </label>
                <Input
                  id="full-name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g., Bilolbek Nematov"
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label htmlFor="email" className="text-sm font-medium">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Input
                id="password"
                type="password"
                required
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <p role="alert" className="text-sm text-destructive font-medium">
                {error}
              </p>
            ) : null}

            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Log in" : "Create account"}
            </Button>
          </form>

          {!isLiveSupabase ? (
            <div className="pt-4 border-t border-border space-y-2.5">
              <p className="text-xs font-medium text-muted-foreground">
                Quick Local Seed Access (all 24 days, 9 exams &amp; 43 articles preloaded):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    loginDemo("student");
                    router.push("/");
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
                  Enter as Student
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    loginDemo("admin");
                    router.push("/admin");
                  }}
                >
                  <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                  Enter as Admin / Teacher
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
