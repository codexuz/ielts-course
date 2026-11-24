"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Layers,
  LogOut,
  RotateCcw,
  Settings2,
  ShieldCheck,
  Trophy,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ColorSchemeControl } from "@/components/theme-controls";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    ready,
    isLoggedIn,
    profile,
    isAdmin,
    isLiveSupabase,
    vocab,
    groups,
    readingRequests,
    switchRole,
    setPace,
    chooseGroup,
    logout,
    resetLocalSeed,
  } = useApp();

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (ready && isLiveSupabase && !isLoggedIn && pathname !== "/login") {
      router.replace("/login");
    }
  }, [ready, isLiveSupabase, isLoggedIn, pathname, router]);

  const dueWordsCount = vocab.filter((v) => v.status !== "mastered").length;
  const pendingReqCount = readingRequests.filter((r) => r.status === "pending").length;

  const navItems = [
    { href: "/", label: "Course", shortLabel: "Course", icon: GraduationCap, match: (p: string) => p === "/" || p.startsWith("/day") },
    { href: "/exams", label: "IELTS Exams", shortLabel: "Exams", icon: ClipboardCheck, match: (p: string) => p.startsWith("/exams") },
    { href: "/reading", label: "Reading Room", shortLabel: "Reading", icon: BookOpen, match: (p: string) => p.startsWith("/reading") },
    { href: "/words", label: "My Words", shortLabel: "Words", icon: Layers, badge: dueWordsCount > 0 ? String(dueWordsCount) : undefined, match: (p: string) => p.startsWith("/words") },
    { href: "/progress", label: "Progress", shortLabel: "Progress", icon: Trophy, match: (p: string) => p.startsWith("/progress") },
    { href: "/admin", label: "Admin Panel", shortLabel: "Admin", icon: ShieldCheck, badge: pendingReqCount > 0 ? String(pendingReqCount) : undefined, match: (p: string) => p.startsWith("/admin") },
  ];

  const handleLogout = async () => {
    await logout();
    setSettingsOpen(false);
    router.push("/login");
  };

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col lg:flex-row">
      {/* Desktop Persistent Oxford Ink Navy Rail */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-shell text-shell-foreground border-r border-shell-border z-30">
        <div className="flex items-center gap-3 px-5 h-16 border-b border-shell-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-sm font-bold tracking-tight tabular">
            24
          </div>
          <div className="min-w-0">
            <Link href="/" className="block text-base font-bold tracking-tight text-shell-foreground leading-none">
              IELTS Max
            </Link>
            <span className="block text-xs text-shell-muted mt-1 truncate">
              {isLiveSupabase ? "Supabase Live" : "Local Seed Mode"}
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto" aria-label="Primary navigation">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-shell-active text-white"
                    : "text-shell-muted hover:bg-shell-active/60 hover:text-shell-foreground"
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-primary"
                  />
                ) : null}
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge ? (
                  <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 font-mono text-xs text-white tabular">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Account & Role Footer inside Rail */}
        <div className="border-t border-shell-border p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-shell-foreground truncate">
                {profile.full_name}
              </p>
              <p className="text-xs text-shell-muted truncate">
                {isAdmin ? "Admin / Teacher" : `Level ${profile.level} · ${profile.pace}-day pace`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open display and account settings"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-shell-muted hover:bg-shell-active hover:text-white cursor-pointer"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {!isLiveSupabase ? (
            <div className="grid grid-cols-2 gap-1 rounded-md bg-black/20 p-1">
              <button
                type="button"
                onClick={() => switchRole("student")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                  !isAdmin ? "bg-primary text-primary-foreground" : "text-shell-muted hover:text-white"
                )}
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => switchRole("admin")}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                  isAdmin ? "bg-primary text-primary-foreground" : "text-shell-muted hover:text-white"
                )}
              >
                Admin
              </button>
            </div>
          ) : null}
        </div>
      </aside>

      {/* Mobile Sticky Top Header */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-2 bg-shell text-shell-foreground border-b border-shell-border px-4 h-14">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-mono text-xs font-bold tabular">
            24
          </span>
          <span className="text-sm font-bold tracking-tight truncate">IELTS Max</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isLiveSupabase ? (
            <button
              type="button"
              onClick={() => switchRole(isAdmin ? "student" : "admin")}
              className="inline-flex items-center gap-1 rounded-md border border-shell-border bg-shell-active px-2.5 py-1 text-xs font-medium text-shell-foreground cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isAdmin ? "Admin" : "Student"}</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Display and account settings"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-shell-muted hover:bg-shell-active hover:text-white cursor-pointer"
          >
            <Settings2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-10 min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Tab Bar with safe-area padding */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm mobile-bottom-nav"
      >
        <div className="grid grid-cols-6 gap-0.5 px-1 pt-1">
          {navItems.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 rounded-md py-1.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 inset-x-3 h-[2px] rounded-full bg-primary"
                  />
                ) : null}
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate max-w-full px-0.5">{item.shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Display, Study Pace & Account Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Display &amp; Account Settings</DialogTitle>
            <DialogDescription>
              Configure appearance, study pace, group assignment, and active session role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-1">
            <div className="space-y-2">
              <p className="text-sm font-medium">Appearance</p>
              <ColorSchemeControl />
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Study Pace</p>
                <Badge variant="outline">{profile.pace} days</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={profile.pace === 24 ? "default" : "outline"}
                  onClick={() => setPace(24)}
                >
                  24-Day Intensive
                </Button>
                <Button
                  type="button"
                  variant={profile.pace === 48 ? "default" : "outline"}
                  onClick={() => setPace(48)}
                >
                  48-Day Split Pace
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                48-day mode splits each course day into Listening/Speaking (Part 1) and Reading/Writing (Part 2) with a second grammar set.
              </p>
            </div>

            {groups.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Study Cohort Group</p>
                <Select
                  value={profile.group_id || groups[0].id}
                  onValueChange={(val) => chooseGroup(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            <Separator />

            <div className="flex flex-wrap items-center justify-between gap-2">
              {!isLiveSupabase ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetLocalSeed();
                    setSettingsOpen(false);
                  }}
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Reset Seed Data
                </Button>
              ) : (
                <span />
              )}

              <Button type="button" variant="destructive" size="sm" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
