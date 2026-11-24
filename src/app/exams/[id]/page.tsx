"use client";

import React, { use, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Flag,
  Headphones,
  ListChecks,
  NotebookPen,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { PlacementBlock } from "@/lib/types";
import { calculateIeltsBand, cn, formatClock, resolveAssetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ExamHtmlSurface } from "@/components/exam/exam-html-surface";

interface ExtendedPlacementBlock extends PlacementBlock {
  prompt?: string;
  notice?: string;
  opts?: string[] | Record<string, string[]>;
}

export default function ExamRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { profile, tests, testResults, saveTestResult } = useApp();

  const test = tests.find((t) => t.id === id);
  const existing = testResults.find((tr) => tr.test_id === id);

  const [secIdx, setSecIdx] = useState(0);
  const [partIdx, setPartIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(existing?.answers || {});
  const [flagged, setFlagged] = useState<number[]>(existing?.flagged || []);
  const [mobilePane, setMobilePane] = useState<"passage" | "questions">("passage");
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [finished, setFinished] = useState(existing?.status === "finished");
  const [resultSummary, setResultSummary] = useState<{
    score: number;
    total: number;
    band: number | null;
  } | null>(
    existing?.status === "finished"
      ? { score: existing.score, total: existing.total, band: existing.band }
      : null
  );

  const section = test?.data.sections?.[secIdx];
  const initialSec = (section?.minutes || (test?.kind === "reading" ? 60 : 35)) * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSec);

  useEffect(() => {
    setSecondsLeft(initialSec);
  }, [secIdx, initialSec]);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [finished]);

  const parts = section?.parts || [];
  const activePart = parts[partIdx];
  const blocks = (section?.blocks || []) as ExtendedPlacementBlock[];

  const handlePatchAnswers = useCallback((patch: Record<string, string>) => {
    setAnswers((prev) => ({ ...prev, ...patch }));
  }, []);

  const questionNumbers = useMemo(() => {
    if (parts.length > 0) {
      const all: number[] = [];
      for (const p of parts) {
        for (let q = p.from; q <= p.to; q++) all.push(q);
      }
      return all;
    }
    // Extract exact question numbers from Placement section blocks
    const set = new Set<number>();
    for (const blk of blocks) {
      if (typeof blk.n === "number") set.add(blk.n);
      if (blk.text) {
        const matches = blk.text.matchAll(/\{\{(\d+)\}\}/g);
        for (const m of matches) set.add(Number(m[1]));
      }
      if (blk.opts && !Array.isArray(blk.opts)) {
        Object.keys(blk.opts).forEach((k) => {
          const num = Number(k);
          if (!Number.isNaN(num)) set.add(num);
        });
      }
    }
    return Array.from(set).sort((a, b) => a - b);
  }, [parts, blocks]);

  // Prefix placement answers by section id (L/R/G) so Q1 in Reading never collides with Q1 in Listening
  const ansKey = useCallback(
    (q: number | string) => (test?.kind === "placement" ? `${section?.id || "S"}-${q}` : String(q)),
    [test?.kind, section?.id]
  );

  if (!test || !section) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-3">
          <h1 className="text-xl font-bold">Exam not found</h1>
          <Button asChild>
            <Link href="/exams">Return to Exam Hall</Link>
          </Button>
        </div>
      </div>
    );
  }

  const toggleFlag = (q: number) => {
    setFlagged((prev) =>
      prev.includes(q) ? prev.filter((x) => x !== q) : [...prev, q]
    );
  };

  const handleFinish = () => {
    const total = questionNumbers.length || 40;
    const answeredCount = questionNumbers.filter(
      (q) => (answers[ansKey(q)] || "").trim().length > 0
    ).length;
    const estimatedScore =
      existing?.status === "finished" && answeredCount === 0
        ? existing.score
        : Math.min(total, answeredCount);
    const band = test.kind === "placement" ? null : calculateIeltsBand(estimatedScore, total);

    saveTestResult({
      id: existing?.id || `res-${test.id}-${Date.now()}`,
      user_id: profile.id,
      test_id: test.id,
      status: "finished",
      answers,
      flagged,
      score: estimatedScore,
      total,
      band,
      finished_at: new Date().toISOString(),
    });

    setResultSummary({ score: estimatedScore, total, band });
    setFinished(true);
  };

  const audioUrl = section.audio ? resolveAssetUrl(section.audio) : "";

  // Extract passage for IELTS Reading parts OR Placement Reading block
  const passageObj = activePart?.passage;
  const placementPassageBlock = blocks.find((b) => b.type === "passage");
  const passageHtml =
    typeof passageObj === "string"
      ? passageObj
      : passageObj && typeof passageObj === "object" && "html" in passageObj
      ? String(passageObj.html || "")
      : "";
  const passagePlainText = placementPassageBlock?.text || "";
  const passageTitle =
    passageObj && typeof passageObj === "object" && "title" in passageObj && passageObj.title
      ? String(passageObj.title)
      : activePart?.title || (placementPassageBlock ? "Reading Passage" : `Passage ${activePart?.n}`);
  const passageIntro =
    passageObj && typeof passageObj === "object" && "intro" in passageObj && passageObj.intro
      ? String(passageObj.intro)
      : "";
  const hasPassage = Boolean(passageHtml.trim() || passagePlainText.trim());

  const rewriteHtml = (raw: unknown) => {
    if (typeof raw !== "string") return "";
    return raw
      .replace(/https?:\/\/english-homework-fm\.netlify\.app/gi, "https://ace-english-fm.netlify.app")
      .replace(
        /(src|href)=["'](?!https?:\/\/|\/|#)([^"']+)["']/gi,
        (_, attr, rel) => `${attr}="https://ace-english-fm.netlify.app/${rel}"`
      );
  };

  const answeredInView = questionNumbers.filter(
    (q) => (answers[ansKey(q)] || "").trim().length > 0
  ).length;

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col">
      {/* Proctored Exam Top Bar */}
      <header className="sticky top-0 z-30 bg-shell text-shell-foreground border-b border-shell-border px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/exams"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-shell-muted hover:bg-shell-active hover:text-white"
            aria-label="Exit to Exam Hall"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-bold truncate">{test.title}</h1>
            <p className="text-xs text-shell-muted truncate">
              {section.title}
              {activePart ? ` · Part ${activePart.n} (Q${activePart.from}–${activePart.to})` : ""}
              {` · ${answeredInView}/${questionNumbers.length} answered`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-mono text-sm font-bold tabular",
              secondsLeft < 300
                ? "border-destructive/50 bg-destructive/20 text-white"
                : "border-shell-border bg-shell-active text-white"
            )}
            aria-label="Time remaining"
          >
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{formatClock(secondsLeft)}</span>
          </div>

          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setNotesOpen((o) => !o)}
          >
            <NotebookPen className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Notes</span>
          </Button>

          <Button type="button" size="sm" onClick={handleFinish}>
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {finished ? "Submitted" : "Finish & Grade"}
          </Button>
        </div>
      </header>

      {/* Section / Part Strip + Listening Audio Player */}
      <div className="border-b border-border bg-card px-4 py-2.5 flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {test.data.sections.length > 1
              ? test.data.sections.map((s, idx) => (
                  <Button
                    key={s.id}
                    type="button"
                    size="sm"
                    variant={secIdx === idx ? "default" : "outline"}
                    onClick={() => {
                      setSecIdx(idx);
                      setPartIdx(0);
                    }}
                  >
                    {s.title}
                  </Button>
                ))
              : parts.map((p, idx) => (
                  <Button
                    key={p.n}
                    type="button"
                    size="sm"
                    variant={partIdx === idx ? "default" : "outline"}
                    onClick={() => setPartIdx(idx)}
                  >
                    Part {p.n} (Q{p.from}–{p.to})
                  </Button>
                ))}
          </div>

          {/* Mobile Split-Pane Switcher for Reading Tests */}
          {hasPassage ? (
            <div className="inline-flex lg:hidden rounded-md border border-border bg-muted p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMobilePane("passage")}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold cursor-pointer",
                  mobilePane === "passage" ? "bg-card text-foreground" : "text-muted-foreground"
                )}
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Passage
              </button>
              <button
                type="button"
                onClick={() => setMobilePane("questions")}
                className={cn(
                  "inline-flex items-center gap-1 rounded px-2.5 py-1 font-semibold cursor-pointer",
                  mobilePane === "questions" ? "bg-card text-foreground" : "text-muted-foreground"
                )}
              >
                <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
                Questions
              </button>
            </div>
          ) : null}
        </div>

        {audioUrl ? (
          <div className="flex items-center gap-3 rounded-md border border-border bg-muted/40 px-3 py-2">
            <Headphones className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <audio controls preload="metadata" src={audioUrl} className="w-full h-9" />
          </div>
        ) : null}
      </div>

      {/* Graded Result Banner */}
      {resultSummary ? (
        <div className="border-b border-primary/30 bg-accent px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {resultSummary.band != null ? (
              <Badge variant="default" className="font-mono text-sm px-2.5 py-1">
                Band {resultSummary.band.toFixed(1)}
              </Badge>
            ) : (
              <Badge variant="default" className="font-mono text-sm px-2.5 py-1">
                Placement Recorded
              </Badge>
            )}
            <p className="text-sm font-medium text-accent-foreground">
              Completed with{" "}
              <span className="font-mono font-bold tabular">
                {resultSummary.score}/{resultSummary.total}
              </span>{" "}
              responses saved to your profile.
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link href="/progress">View Progress</Link>
          </Button>
        </div>
      ) : null}

      {/* Main Split-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0">
        {hasPassage ? (
          <section
            aria-label="Reading passage"
            className={cn(
              "lg:col-span-6 lg:border-r border-border bg-card p-5 sm:p-8 overflow-y-auto lg:max-h-[calc(100dvh-13rem)]",
              mobilePane === "questions" ? "hidden lg:block" : "block"
            )}
          >
            <div className="max-w-[66ch] mx-auto space-y-4">
              <div className="space-y-1.5 border-b border-border pb-3">
                <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight">
                  {passageTitle}
                </h2>
                {passageIntro ? (
                  <p className="text-sm italic text-muted-foreground font-serif">
                    {passageIntro}
                  </p>
                ) : null}
              </div>

              {passageHtml ? (
                <div
                  className="font-serif text-[16px] leading-[1.8] space-y-3.5 text-foreground"
                  dangerouslySetInnerHTML={{
                    __html: rewriteHtml(passageHtml),
                  }}
                />
              ) : (
                <div className="font-serif text-[16px] leading-[1.8] space-y-4 text-foreground whitespace-pre-line">
                  {passagePlainText}
                </div>
              )}
            </div>
          </section>
        ) : null}

        <section
          aria-label="Exam questions"
          className={cn(
            hasPassage ? "lg:col-span-6" : "lg:col-span-12 max-w-4xl mx-auto w-full",
            "p-5 sm:p-7 overflow-y-auto lg:max-h-[calc(100dvh-13rem)]",
            hasPassage && mobilePane === "passage" ? "hidden lg:block" : "block"
          )}
        >
          {activePart ? (
            <div className="space-y-4">
              {activePart.instruction ? (
                <p className="text-sm font-medium text-muted-foreground border-b border-border pb-2.5">
                  {activePart.instruction}
                </p>
              ) : null}
              <ExamHtmlSurface
                partKey={`${test.id}-${secIdx}-${activePart.n}`}
                html={rewriteHtml(activePart.html)}
                initialAnswers={answers}
                onAnswersChange={handlePatchAnswers}
              />
            </div>
          ) : blocks.length > 0 ? (
            /* Placement Test Native Interactive Renderer */
            <div className="space-y-4">
              {blocks.map((blk, i) => {
                if (blk.type === "passage") return null; // Rendered in left split pane

                if (blk.type === "head") {
                  return (
                    <h2
                      key={i}
                      className="text-base sm:text-lg font-bold pt-3 border-b border-border pb-1.5 text-foreground"
                    >
                      {blk.text}
                    </h2>
                  );
                }

                if (blk.type === "note") {
                  return (
                    <p key={i} className="text-sm text-muted-foreground">
                      {blk.text}
                    </p>
                  );
                }

                if (blk.type === "notes" && blk.text) {
                  const lines = blk.text.split("\n");
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card p-5 space-y-2.5 text-sm shadow-[0_1px_2px_rgba(15,37,55,0.04)]"
                    >
                      {lines.map((ln, li) => {
                        if (ln.startsWith("## ")) {
                          return (
                            <h3 key={li} className="font-bold text-foreground pt-2">
                              {ln.slice(3)}
                            </h3>
                          );
                        }
                        const tokens = ln.split(/(\{\{\d+\}\})/g);
                        return (
                          <p key={li} className="leading-9 text-foreground">
                            {tokens.map((tok, ti) => {
                              const m = tok.match(/^\{\{(\d+)\}\}$/);
                              if (!m) return <span key={ti}>{tok}</span>;
                              const qn = Number(m[1]);
                              const k = ansKey(qn);
                              return (
                                <span key={ti} className="inline-flex items-center gap-1 mx-1 align-middle">
                                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-shell px-1 font-mono text-[11px] font-bold text-shell-foreground tabular">
                                    {qn}
                                  </span>
                                  <input
                                    type="text"
                                    aria-label={`Question ${qn}`}
                                    value={answers[k] || ""}
                                    onChange={(e) =>
                                      handlePatchAnswers({ [k]: e.target.value })
                                    }
                                    placeholder={`Answer ${qn}`}
                                    className="h-8 w-36 rounded border border-input bg-background px-2.5 text-sm font-sans text-foreground focus-visible:outline-2 focus-visible:outline-ring"
                                  />
                                </span>
                              );
                            })}
                          </p>
                        );
                      })}
                    </div>
                  );
                }

                if (blk.type === "tfng" && typeof blk.n === "number") {
                  const k = ansKey(blk.n);
                  const current = answers[k] || "";
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-[0_1px_2px_rgba(15,37,55,0.03)]"
                    >
                      <p className="text-sm font-medium flex items-start gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-shell px-1.5 font-mono text-xs font-bold text-shell-foreground tabular shrink-0">
                          {blk.n}
                        </span>
                        <span>{blk.prompt}</span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handlePatchAnswers({ [k]: opt })}
                            className={cn(
                              "rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer",
                              current === opt
                                ? "border-primary bg-accent text-accent-foreground"
                                : "border-border bg-background text-foreground hover:border-primary/50"
                            )}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (blk.type === "mc" && typeof blk.n === "number" && Array.isArray(blk.opts)) {
                  const k = ansKey(blk.n);
                  const current = answers[k] || "";
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card p-4 space-y-3 shadow-[0_1px_2px_rgba(15,37,55,0.03)]"
                    >
                      {blk.notice ? (
                        <div className="rounded-md border border-border bg-muted/60 px-4 py-3 text-center font-serif text-sm font-semibold text-foreground">
                          {blk.notice}
                        </div>
                      ) : null}
                      <p className="text-sm font-medium flex items-start gap-2">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-shell px-1.5 font-mono text-xs font-bold text-shell-foreground tabular shrink-0">
                          {blk.n}
                        </span>
                        <span>{blk.prompt || "Choose the best option:"}</span>
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {blk.opts.map((opt, oi) => {
                          const letter = String.fromCharCode(65 + oi);
                          const selected = current === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handlePatchAnswers({ [k]: opt })}
                              className={cn(
                                "flex items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors cursor-pointer",
                                selected
                                  ? "border-primary bg-accent text-accent-foreground font-medium"
                                  : "border-border bg-background hover:border-primary/50"
                              )}
                            >
                              <span
                                className={cn(
                                  "inline-flex h-5 w-5 items-center justify-center rounded font-mono text-xs font-bold shrink-0",
                                  selected
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                {letter}
                              </span>
                              <span>{opt}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                if (blk.type === "cloze" && blk.text && blk.opts && !Array.isArray(blk.opts)) {
                  const optsMap = blk.opts;
                  const tokens = blk.text.split(/(\{\{\d+\}\})/g);
                  return (
                    <div
                      key={i}
                      className="rounded-lg border border-border bg-card p-5 text-sm leading-10 font-serif shadow-[0_1px_2px_rgba(15,37,55,0.03)]"
                    >
                      {tokens.map((tok, ti) => {
                        const m = tok.match(/^\{\{(\d+)\}\}$/);
                        if (!m) return <span key={ti}>{tok}</span>;
                        const qn = m[1];
                        const k = ansKey(qn);
                        const choices = optsMap[qn] || [];
                        return (
                          <span key={ti} className="inline-flex items-center gap-1 mx-1 align-middle font-sans">
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-shell px-1 font-mono text-[11px] font-bold text-shell-foreground tabular">
                              {qn}
                            </span>
                            <select
                              aria-label={`Question ${qn}`}
                              value={answers[k] || ""}
                              onChange={(e) => handlePatchAnswers({ [k]: e.target.value })}
                              className="h-8 rounded border border-input bg-background px-2 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
                            >
                              <option value="">—</option>
                              {choices.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </span>
                        );
                      })}
                    </div>
                  );
                }

                return blk.text ? (
                  <p key={i} className="text-sm leading-relaxed whitespace-pre-line font-serif">
                    {blk.text}
                  </p>
                ) : null;
              })}
            </div>
          ) : null}
        </section>
      </div>

      {/* Collapsible Scratchpad Notes */}
      {notesOpen ? (
        <div className="fixed right-4 bottom-20 z-40 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-card p-4 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold">Exam Scratchpad Notes</span>
            <button
              type="button"
              onClick={() => setNotesOpen(false)}
              className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Close
            </button>
          </div>
          <Textarea
            rows={5}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Jot down keywords, distractor notes, or dates..."
            className="text-xs"
          />
        </div>
      ) : null}

      {/* Bottom Question Palette Tick Rail */}
      <footer className="sticky bottom-0 z-30 border-t border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <span className="text-xs font-semibold text-muted-foreground shrink-0 mr-1">
            Questions ({answeredInView}/{questionNumbers.length}):
          </span>
          {questionNumbers.map((q) => {
            const answered = Boolean((answers[ansKey(q)] || "").trim());
            const isFlagged = flagged.includes(q);
            return (
              <button
                key={q}
                type="button"
                onClick={() => {
                  const targetPartIdx = parts.findIndex((p) => q >= p.from && q <= p.to);
                  if (targetPartIdx >= 0) setPartIdx(targetPartIdx);
                  setMobilePane("questions");
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  toggleFlag(q);
                }}
                title="Click to jump · Right-click to flag"
                className={cn(
                  "relative h-7 min-w-7 px-1.5 rounded border font-mono text-xs font-semibold shrink-0 transition-colors cursor-pointer tabular",
                  answered
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-foreground hover:border-primary/60",
                  isFlagged && "ring-2 ring-milestone"
                )}
              >
                {q}
                {isFlagged ? (
                  <Flag
                    className="h-2.5 w-2.5 text-milestone absolute -top-1 -right-1 fill-milestone"
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
}
