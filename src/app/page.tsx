"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Check,
  Clock,
  ClipboardCheck,
  Flame,
  Lock,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import { cn, formatDuration, isTestDay, padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function CourseHomePage() {
  const {
    profile,
    isAdmin,
    days,
    submissions,
    tests,
    testResults,
    homeworkTime,
    vocab,
    isDayOpen,
    setPace,
  } = useApp();

  const mySubs = isAdmin
    ? submissions
    : submissions.filter((s) => s.user_id === profile.id);
  const submittedDays = new Set(
    mySubs.filter((s) => s.status === "submitted").map((s) => s.n)
  );
  const completedCount = submittedDays.size;
  const pct = Math.round((completedCount / 24) * 100);

  const totalSeconds = Object.values(homeworkTime).reduce((a, b) => a + b, 0);
  const dueWords = vocab.filter((v) => v.status !== "mastered").length;

  // Determine the next active day to continue
  const activeDayNumber =
    days.find((d) => isDayOpen(d.n) && !submittedDays.has(d.n))?.n ??
    days[0]?.n ??
    1;
  const activeDay = days.find((d) => d.n === activeDayNumber);

  const placementDone = testResults.some(
    (tr) => tr.test_id === "placement" && tr.status === "finished"
  );

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Session Header & Pace Bar */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border pb-5">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              24-Day English &amp; IELTS Course
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              {profile.full_name} · Level {profile.level} · Complete each day&apos;s five core skills to stamp your passport and unlock the next day.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-md border border-border bg-card p-0.5"
              role="group"
              aria-label="Study pace selector"
            >
              <button
                type="button"
                onClick={() => setPace(24)}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  profile.pace === 24
                    ? "bg-shell text-shell-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                24-day pace
              </button>
              <button
                type="button"
                onClick={() => setPace(48)}
                className={cn(
                  "rounded px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                  profile.pace === 48
                    ? "bg-shell text-shell-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                48-day split
              </button>
            </div>
            {isAdmin ? (
              <Button asChild size="sm" variant="outline">
                <Link href="/admin">Open Admin Console</Link>
              </Button>
            ) : null}
          </div>
        </section>

        {/* Compact Status Ledger Strip (Hairline-divided, zero nested cards) */}
        <section
          aria-label="Course progress summary"
          className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
        >
          <div className="p-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Passport Progress</span>
              <span className="font-mono font-semibold text-foreground tabular">{pct}%</span>
            </div>
            <div className="text-xl font-bold font-mono tabular">
              {completedCount} <span className="text-sm font-normal text-muted-foreground">/ 24 days</span>
            </div>
            <Progress value={pct} className="h-1.5" />
          </div>

          <div className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Logged Study Time</span>
            </div>
            <div className="text-xl font-bold font-mono tabular">
              {formatDuration(totalSeconds)}
            </div>
            <p className="text-xs text-muted-foreground">Across active days</p>
          </div>

          <div className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Flame className="h-3.5 w-3.5 text-milestone" aria-hidden="true" />
              <span>Words Due Today</span>
            </div>
            <div className="text-xl font-bold font-mono tabular">{dueWords}</div>
            <Link
              href="/words"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Practice SRS deck
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          <div className="p-4 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ClipboardCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span>Placement &amp; Mocks</span>
            </div>
            <div className="text-xl font-bold font-mono tabular">
              {testResults.filter((t) => t.status === "finished").length}
              <span className="text-sm font-normal text-muted-foreground"> / {tests.length}</span>
            </div>
            <Link
              href="/exams"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              {placementDone ? "Open IELTS Exam Hall" : "Start Placement Test"}
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </section>

        {/* Active Day Dispatch Banner */}
        {activeDay ? (
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-[0_1px_3px_rgba(15,37,55,0.05)]">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default" className="font-mono">
                  DAY {padDay(activeDay.n)}
                </Badge>
                {isTestDay(activeDay.n) ? (
                  <Badge variant="milestone">
                    <Award className="h-3 w-3" aria-hidden="true" />
                    IELTS Mock Test Day
                  </Badge>
                ) : null}
                {profile.pace === 48 ? (
                  <Badge variant="secondary">Split Pace: Part 1 &amp; Part 2</Badge>
                ) : null}
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                {activeDay.data.article?.title || activeDay.data.video?.title || activeDay.data.title}
              </h2>
              <p className="text-sm text-muted-foreground">
                Podcast: {activeDay.data.podcast?.title || "Daily audio"} · Watching:{" "}
                {activeDay.data.video?.title || "TED-Ed"} · Speaking:{" "}
                {activeDay.data.speaking?.title || "IELTS Speaking"}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button asChild size="lg">
                <Link href={`/day/${activeDay.n}`}>
                  Continue Day {padDay(activeDay.n)}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </section>
        ) : null}

        {/* Signature Move: 24-Day Examination Passport Matrix */}
        <section className="space-y-3" aria-labelledby="passport-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 id="passport-heading" className="text-lg font-bold tracking-tight">
                24-Day Examination Passport
              </h2>
              <p className="text-xs text-muted-foreground">
                Days 06, 12, 18, and 24 include full timed Computer-Delivered IELTS Listening &amp; Reading exams.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary" />
                Submitted
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-primary bg-accent" />
                Open
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-milestone" />
                IELTS Test Day
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-muted border border-border" />
                Locked
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {days.map((day) => {
              const open = isDayOpen(day.n);
              const sub = mySubs.find((s) => s.n === day.n);
              const done = sub?.status === "submitted";
              const testDay = isTestDay(day.n);
              const spent = homeworkTime[day.n] || 0;
              const topicTitle =
                day.data.video?.title ||
                day.data.article?.title ||
                day.data.podcast?.title ||
                `Day ${padDay(day.n)}`;

              const cellContent = (
                <div
                  className={cn(
                    "h-full rounded-lg border p-4 flex flex-col justify-between gap-3 transition-colors",
                    done
                      ? "border-primary/40 bg-card"
                      : open
                      ? "border-border bg-card hover:border-primary/60"
                      : "border-border/70 bg-muted/40 opacity-75"
                  )}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold tracking-wider text-muted-foreground tabular">
                        DAY {padDay(day.n)}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {testDay ? (
                          <Badge variant="milestone" className="text-[11px] px-1.5 py-0">
                            IELTS
                          </Badge>
                        ) : null}
                        {done ? (
                          <span className="inline-flex items-center gap-1 rounded bg-success-bg px-1.5 py-0.5 text-[11px] font-semibold text-success">
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Stamped
                          </span>
                        ) : open ? (
                          <span className="inline-flex items-center rounded bg-accent px-1.5 py-0.5 text-[11px] font-semibold text-accent-foreground">
                            Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Lock className="h-3 w-3" aria-hidden="true" />
                            Locked
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">
                      {topicTitle}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {day.data.article?.title || day.data.podcast?.title}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
                    <span className="font-mono tabular">
                      {spent > 0 ? formatDuration(spent) : profile.pace === 48 ? "2 parts" : "6 skills"}
                    </span>
                    <span className={cn("font-medium", open ? "text-primary" : "text-muted-foreground")}>
                      {done ? "Review" : open ? "Start →" : "Locked"}
                    </span>
                  </div>
                </div>
              );

              return open ? (
                <Link key={day.n} href={`/day/${day.n}`} className="block group focus-visible:outline-none">
                  {cellContent}
                </Link>
              ) : (
                <div key={day.n} aria-disabled="true">
                  {cellContent}
                </div>
              );
            })}
          </div>
        </section>

        {/* Secondary Resource Row: Reading Room & Exam Hall Quick Launch */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-card p-5 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <span>Leveled Reading Room</span>
              </div>
              <p className="text-sm text-muted-foreground">
                43 curated articles across 10 IELTS themes, each written at 5 CEFR levels (A2–C2) with read-aloud and 9 interactive exercise tabs.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/reading">Explore</Link>
            </Button>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-milestone font-semibold text-sm">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Computer-Delivered IELTS Hall</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Full Placement Test plus 8 official-format IELTS Listening and Reading mock exams with timer, highlighting, notes, and Band scoring.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/exams">Open Hall</Link>
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
