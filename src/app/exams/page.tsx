"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, ClipboardCheck, Clock, Headphones } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useApp } from "@/lib/store";
import { padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ExamsHallPage() {
  const { tests, testResults } = useApp();

  const placement = tests.find((t) => t.kind === "placement");
  const listeningTests = tests
    .filter((t) => t.kind === "listening")
    .sort((a, b) => (a.day || 0) - (b.day || 0));
  const readingTests = tests
    .filter((t) => t.kind === "reading")
    .sort((a, b) => (a.day || 0) - (b.day || 0));

  const getResult = (id: string) => testResults.find((tr) => tr.test_id === id);

  return (
    <AppShell>
      <div className="space-y-7">
        <div className="border-b border-border pb-5 space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Computer-Delivered IELTS Exam Hall
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Take the timed Placement Test or any of the 8 full-length IELTS Listening and Reading mock exams with split-pane reading, question flagging, and Band score evaluation.
          </p>
        </div>

        {/* Placement Test Banner */}
        {placement ? (
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between shadow-[0_1px_2px_rgba(15,37,55,0.04)]">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="default">Diagnostic</Badge>
                {getResult(placement.id)?.status === "finished" ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                    Completed
                  </Badge>
                ) : (
                  <Badge variant="milestone">Required before Day 1</Badge>
                )}
              </div>
              <h2 className="text-lg font-bold tracking-tight">{placement.title}</h2>
              <p className="text-sm text-muted-foreground">
                3 sections · Listening (23 Qs), Reading (16 Qs), and Grammar &amp; Vocabulary (60 Qs).
              </p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href={`/exams/${placement.id}`}>
                {getResult(placement.id)?.status === "finished" ? "Review / Retake" : "Start Placement Test"}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </section>
        ) : null}

        {/* IELTS Listening Tests */}
        <section className="space-y-3" aria-labelledby="listening-heading">
          <div className="flex items-center gap-2">
            <Headphones className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 id="listening-heading" className="text-lg font-bold tracking-tight">
              IELTS Listening Mock Tests ({listeningTests.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listeningTests.map((t) => {
              const res = getResult(t.id);
              const mins = t.data.sections?.[0]?.minutes || 35;
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="milestone" className="font-mono">
                        DAY {padDay(t.day || 0)}
                      </Badge>
                      {res?.status === "finished" ? (
                        <Badge variant="success" className="font-mono">
                          {res.score}/{res.total} · Band {res.band?.toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono tabular">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {mins} min · 40 Qs
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold leading-snug">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      4 full parts with studio recording, interactive tables, maps, and multiple-choice questions.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant={res?.status === "finished" ? "outline" : "default"}>
                      <Link href={`/exams/${t.id}`}>
                        {res?.status === "finished" ? "Review Exam" : "Start Listening Exam"}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* IELTS Reading Tests */}
        <section className="space-y-3" aria-labelledby="reading-heading">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 id="reading-heading" className="text-lg font-bold tracking-tight">
              IELTS Academic Reading Mock Tests ({readingTests.length})
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {readingTests.map((t) => {
              const res = getResult(t.id);
              const mins = t.data.sections?.[0]?.minutes || 60;
              return (
                <div
                  key={t.id}
                  className="rounded-lg border border-border bg-card p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="milestone" className="font-mono">
                        DAY {padDay(t.day || 0)}
                      </Badge>
                      {res?.status === "finished" ? (
                        <Badge variant="success" className="font-mono">
                          {res.score}/{res.total} · Band {res.band?.toFixed(1)}
                        </Badge>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono tabular">
                          <ClipboardCheck className="h-3.5 w-3.5" aria-hidden="true" />
                          {mins} min · 3 passages · 40 Qs
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold leading-snug">{t.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Split-pane desktop reading layout with passage notes, question flagging, and mobile view toggle.
                    </p>
                  </div>
                  <div className="flex justify-end">
                    <Button asChild size="sm" variant={res?.status === "finished" ? "outline" : "default"}>
                      <Link href={`/exams/${t.id}`}>
                        {res?.status === "finished" ? "Review Exam" : "Start Reading Exam"}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
