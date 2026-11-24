"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Award, CheckCircle2, ClipboardCheck, Clock, Flame, Trophy } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import { cn, formatDuration, padDay } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ProgressRankingPage() {
  const { profile, isAdmin, submissions, testResults, tests, homeworkTime, ranking, groups } = useApp();
  const [groupFilter, setGroupFilter] = useState<string>("all");

  // When in Admin preview, still show the tracked cohort student metrics cleanly
  const trackedSubs = isAdmin
    ? submissions.filter((s) => s.status === "submitted")
    : submissions.filter((s) => s.user_id === profile.id && s.status === "submitted");
  const completedCount = trackedSubs.length;
  const totalSeconds = Object.values(homeworkTime).reduce((a, b) => a + b, 0);
  const finishedExams = testResults.filter((t) => t.status === "finished");

  const achievements = [
    { id: "first", title: "First Step", desc: "Complete Day 1", earned: completedCount >= 1 },
    { id: "rhythm", title: "Getting into the Rhythm", desc: "Complete 3 course days", earned: completedCount >= 3 },
    { id: "week", title: "One Week Strong", desc: "Complete 7 days", earned: completedCount >= 7 },
    { id: "half", title: "Halfway There", desc: "Complete 12 days", earned: completedCount >= 12 },
    { id: "almost", title: "Almost There", desc: "Complete 20 days", earned: completedCount >= 20 },
    { id: "finish", title: "24-Day Finisher", desc: "Complete all 24 days", earned: completedCount >= 24 },
  ];

  const visibleRanking =
    groupFilter === "all"
      ? ranking
      : ranking.filter((r) => !r.group_id || r.group_id === groupFilter);

  return (
    <AppShell>
      <div className="space-y-7">
        <div className="border-b border-border pb-5 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Progress &amp; Class Ranking
          </h1>
          <p className="text-sm text-muted-foreground">
            Track daily study hours, IELTS exam bands, earned milestones, and weekly cohort standings.
          </p>
        </div>

        {/* Summary Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(15,37,55,0.04)]">
          <div className="p-5 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">Course Completion</span>
            <div className="text-2xl font-bold font-mono tabular">
              {completedCount} / 24 <span className="text-sm font-normal text-muted-foreground">days</span>
            </div>
            <Progress value={Math.round((completedCount / 24) * 100)} className="h-1.5" />
          </div>
          <div className="p-5 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              Total Logged Time
            </span>
            <div className="text-2xl font-bold font-mono tabular">{formatDuration(totalSeconds)}</div>
            <p className="text-xs text-muted-foreground">Tracked automatically in active day workspaces</p>
          </div>
          <div className="p-5 space-y-1">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Flame className="h-3.5 w-3.5 text-milestone" aria-hidden="true" />
              IELTS Exams Completed
            </span>
            <div className="text-2xl font-bold font-mono tabular">
              {finishedExams.length} / {tests.length}
            </div>
            <p className="text-xs text-muted-foreground">Placement + Listening &amp; Reading mocks</p>
          </div>
        </section>

        {/* Completed Exam Results Ledger */}
        {finishedExams.length > 0 ? (
          <section className="space-y-3" aria-labelledby="exam-ledger-heading">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 id="exam-ledger-heading" className="text-lg font-bold tracking-tight">
                Recorded Exam Results
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {finishedExams.map((tr) => {
                const exam = tests.find((t) => t.id === tr.test_id);
                return (
                  <div
                    key={tr.id}
                    className="rounded-lg border border-border bg-card p-4 flex items-center justify-between gap-4 shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
                  >
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-sm font-bold truncate">
                        {exam?.title || tr.test_id}
                      </h3>
                      <p className="text-xs text-muted-foreground font-mono tabular">
                        Score: {tr.score} / {tr.total}
                        {tr.finished_at
                          ? ` · ${new Date(tr.finished_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {tr.band != null ? (
                        <Badge variant="default" className="font-mono">
                          Band {tr.band.toFixed(1)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Level {profile.level}</Badge>
                      )}
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/exams/${tr.test_id}`}>Review</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Achievements */}
        <section className="space-y-3" aria-labelledby="ach-heading">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-milestone" aria-hidden="true" />
            <h2 id="ach-heading" className="text-lg font-bold tracking-tight">
              Course Milestones ({achievements.filter((a) => a.earned).length}/6)
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((a) => (
              <div
                key={a.id}
                className={cn(
                  "rounded-lg border p-4 flex items-center justify-between gap-3",
                  a.earned
                    ? "border-primary/40 bg-card shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
                    : "border-border bg-muted/30 opacity-75"
                )}
              >
                <div>
                  <h3 className="text-sm font-bold">{a.title}</h3>
                  <p className="text-xs text-muted-foreground">{a.desc}</p>
                </div>
                {a.earned ? (
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" aria-label="Earned" />
                ) : (
                  <Badge variant="outline">Locked</Badge>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Daily Study Time Breakdown */}
        <section className="rounded-xl border border-border bg-card p-5 space-y-4 shadow-[0_1px_2px_rgba(15,37,55,0.04)]">
          <h2 className="text-base font-bold">Daily Study Hours Breakdown</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(homeworkTime)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, secs]) => {
                const pct = Math.min(100, Math.round((secs / 21600) * 100));
                return (
                  <div key={day} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono tabular">
                      <span className="font-semibold text-foreground">DAY {padDay(Number(day))}</span>
                      <span className="text-muted-foreground">{formatDuration(secs)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.max(4, pct)}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>

        {/* Cohort Leaderboard (Clean non-duplicated Rank & Student columns) */}
        <section className="space-y-3" aria-labelledby="ranking-table-caption">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-milestone" aria-hidden="true" />
              <h2 id="ranking-table-caption" className="text-lg font-bold tracking-tight">
                Cohort Leaderboard ({visibleRanking.length})
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setGroupFilter("all")}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-xs font-semibold cursor-pointer",
                  groupFilter === "all"
                    ? "border-shell bg-shell text-shell-foreground"
                    : "border-border bg-card text-muted-foreground"
                )}
              >
                All Groups
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGroupFilter(g.id)}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-medium cursor-pointer",
                    groupFilter === g.id
                      ? "border-shell bg-shell text-shell-foreground"
                      : "border-border bg-card text-muted-foreground"
                  )}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-labelledby="ranking-table-caption"
            className="responsive-table-wrap shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
          >
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Rank</th>
                  <th>Days</th>
                  <th>Accuracy</th>
                  <th>IELTS Tests</th>
                  <th>Points</th>
                </tr>
              </thead>
              <tbody>
                {visibleRanking.map((row, idx) => {
                  const name = row.full_name || row.name || `Student ${idx + 1}`;
                  const isMe =
                    row.user_id === profile.id ||
                    name.toLowerCase().includes(profile.full_name.split(" ")[0].toLowerCase());
                  const daysDone = row.days ?? row.submitted_days ?? 0;
                  const testsDone = row.tests ?? row.tests_done ?? 0;
                  const pts = row.points ?? 0;
                  const acc =
                    typeof row.accuracy === "number" && row.accuracy > 0
                      ? `${row.accuracy}%`
                      : "—";

                  return (
                    <tr key={row.user_id || idx} className={cn(isMe && "bg-accent/40")}>
                      <th scope="row">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{name}</span>
                          {isMe ? <Badge variant="default" className="text-[11px]">You</Badge> : null}
                        </div>
                      </th>
                      <td data-label="Rank" className="font-mono tabular">
                        <span
                          className={cn(
                            "inline-flex h-6 min-w-7 items-center justify-center rounded px-1.5 text-xs font-bold",
                            idx < 3
                              ? "bg-milestone-bg text-milestone border border-milestone-border/40"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          #{idx + 1}
                        </span>
                      </td>
                      <td data-label="Days" className="font-mono tabular">{daysDone} / 24</td>
                      <td data-label="Accuracy" className="font-mono tabular">{acc}</td>
                      <td data-label="IELTS Tests" className="font-mono tabular">{testsDone}</td>
                      <td data-label="Points" className="font-mono font-bold text-primary tabular">
                        {pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
