"use client";

import React, { useState } from "react";
import { PenTool, Sparkles } from "lucide-react";
import type { CourseDay, WritingFeedbackRecord } from "@/lib/types";
import { useApp } from "@/lib/store";
import { cn, countWords, resolveAssetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface WritingTaskProps {
  day: CourseDay;
  value: string;
  onChange: (next: string) => void;
  existingFeedback?: WritingFeedbackRecord;
}

const KIND_LABELS: Record<string, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  linking: "Linking",
  idea: "Ideas",
  task: "Task",
};

export function WritingTask({
  day,
  value,
  onChange,
  existingFeedback,
}: WritingTaskProps) {
  const { profile, saveWritingFeedback } = useApp();
  const writing = day.data.writing;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState<"diff" | "clean">("diff");

  if (!writing || !writing.prompt) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-sm text-muted-foreground">
        No formal IELTS writing prompt is scheduled for Day {day.n}. Use the Article Summary and Daily Reflection tabs to practise your writing today.
      </div>
    );
  }

  const minWords = writing.minWords || 150;
  const wc = countWords(value);

  const handleRequestFeedback = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/writing-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: value,
          prompt: writing.prompt,
          minWords,
          day: day.n,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Could not evaluate writing.");
        return;
      }
      saveWritingFeedback({
        user_id: profile.id,
        n: day.n,
        band: json.band,
        feedback: json.feedback,
        model: json.model,
        created_at: new Date().toISOString(),
      });
    } catch {
      setError("Network error while evaluating writing.");
    } finally {
      setLoading(false);
    }
  };

  const images = [
    ...(writing.image ? [writing.image] : []),
    ...(writing.images || []),
  ].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <PenTool className="h-4 w-4 text-primary" aria-hidden="true" />
            <h2 className="text-lg font-bold tracking-tight">
              {writing.type || "IELTS Writing Practice"}
            </h2>
          </div>
          <Badge variant={wc >= minWords ? "success" : "outline"} className="font-mono">
            {wc} / {minWords}+ words
          </Badge>
        </div>

        <div className="rounded-md border border-border bg-muted/40 p-4 text-sm font-serif leading-relaxed whitespace-pre-line text-foreground">
          {writing.prompt}
        </div>

        {images.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {images.map((img, i) => (
              <img
                key={i}
                src={resolveAssetUrl(img)}
                alt={`Writing task diagram ${i + 1}`}
                className="rounded-md border border-border bg-white p-2"
              />
            ))}
          </div>
        ) : null}

        <Textarea
          rows={12}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Draft your IELTS response here..."
          className="text-sm leading-relaxed"
        />

        {error ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Receive IELTS 4-criteria rubric scoring plus an annotated &ldquo;Better Version&rdquo; rewrite.
          </p>
          <Button type="button" onClick={handleRequestFeedback} disabled={loading || wc < 15}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {loading ? "Evaluating..." : existingFeedback ? "Re-evaluate Writing" : "Get IELTS Feedback"}
          </Button>
        </div>
      </div>

      {/* Feedback & Better Version Diff Card */}
      {existingFeedback ? (
        <div className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
            <div>
              <h3 className="text-base font-bold">IELTS Writing Evaluation</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {existingFeedback.feedback?.overview ||
                  existingFeedback.feedback?.summary ||
                  "Rubric breakdown and band upgrade suggestions."}
              </p>
            </div>
            {existingFeedback.band || existingFeedback.feedback?.band ? (
              <div className="rounded-md bg-shell px-3.5 py-2 text-center text-shell-foreground">
                <div className="text-[11px] text-shell-muted">Estimated Band</div>
                <div className="font-mono text-2xl font-bold tabular">
                  {Number(existingFeedback.band || existingFeedback.feedback?.band).toFixed(1)}
                </div>
              </div>
            ) : null}
          </div>

          {Array.isArray(existingFeedback.feedback?.criteria) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {existingFeedback.feedback.criteria.map((item, idx) => (
                <div
                  key={item.name || idx}
                  className="rounded-md border border-border bg-background p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-foreground">
                      {item.name || item.title || `Criterion ${idx + 1}`}
                    </span>
                    {item.band != null || item.score != null ? (
                      <Badge variant="outline" className="font-mono text-primary">
                        Band {Number(item.band ?? item.score).toFixed(1)}
                      </Badge>
                    ) : null}
                  </div>
                  {item.good?.length ? (
                    <ul className="space-y-1 text-xs text-success">
                      {item.good.map((g, gi) => (
                        <li key={gi}>+ {g}</li>
                      ))}
                    </ul>
                  ) : null}
                  {item.fix?.length ? (
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {item.fix.map((f, fi) => (
                        <li key={fi}>• {f}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ) : existingFeedback.feedback?.criteria ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(existingFeedback.feedback.criteria).map(([label, detail]) => (
                <div key={label} className="rounded-md border border-border bg-background p-3.5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-foreground">{label}</span>
                    {detail.score != null ? (
                      <span className="font-mono text-sm font-bold text-primary tabular">
                        {Number(detail.score).toFixed(1)}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{detail.comment}</p>
                </div>
              ))}
            </div>
          ) : null}

          {existingFeedback.model?.pieces?.length ? (
            <div className="space-y-4 pt-3 border-t border-border">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold">A Better Version of Your Writing</h4>
                  {existingFeedback.model_level ? (
                    <Badge variant="outline" className="font-mono text-[11px]">
                      Target: {existingFeedback.model_level}
                    </Badge>
                  ) : null}
                </div>
                <div className="inline-flex rounded-md border border-border bg-muted p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("diff")}
                    className={cn(
                      "rounded px-2.5 py-1 font-medium cursor-pointer",
                      viewMode === "diff" ? "bg-card text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Annotated Diff
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("clean")}
                    className={cn(
                      "rounded px-2.5 py-1 font-medium cursor-pointer",
                      viewMode === "clean" ? "bg-card text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Clean Rewrite
                  </button>
                </div>
              </div>

              {(() => {
                // Normalize both nested { title, parts: [{ t, was, why, kind }] } and flat [{ text, was, now }]
                const blocks = existingFeedback.model.pieces.some((p) => Array.isArray(p.parts))
                  ? existingFeedback.model.pieces.map((p, idx) => ({
                      title: p.title || `Paragraph ${idx + 1}`,
                      parts: p.parts || [],
                    }))
                  : [{ title: "", parts: existingFeedback.model.pieces }];

                const allChanges = blocks.flatMap((b) =>
                  b.parts
                    .filter((pt) => pt.was !== undefined && (pt.t || pt.now))
                    .map((pt) => ({
                      was: pt.was || "",
                      now: pt.t || pt.now || "",
                      kind: pt.kind || "vocabulary",
                      why: pt.why || "",
                    }))
                );

                return (
                  <div className="space-y-4">
                    <div className="space-y-3">
                      {blocks.map((blk, bIdx) => (
                        <div
                          key={bIdx}
                          className="rounded-md border border-border bg-background p-4 space-y-2"
                        >
                          {blk.title ? (
                            <p className="text-xs font-semibold text-muted-foreground">
                              {blk.title}
                            </p>
                          ) : null}
                          <div className="font-serif text-[15px] leading-8 text-foreground space-x-1">
                            {blk.parts.map((pt, pIdx) => {
                              const replacement = pt.t ?? pt.now;
                              if (pt.was !== undefined && replacement) {
                                return (
                                  <span key={pIdx} className="inline">
                                    {viewMode === "diff" ? (
                                      <del className="text-destructive/80 decoration-destructive/60 mr-1">
                                        {pt.was}
                                      </del>
                                    ) : null}
                                    <ins className="no-underline rounded bg-accent px-1 py-0.5 font-medium text-accent-foreground">
                                      {replacement}
                                    </ins>{" "}
                                  </span>
                                );
                              }
                              return <span key={pIdx}>{pt.text ?? pt.t ?? ""} </span>;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {allChanges.length > 0 ? (
                      <ul className="space-y-2">
                        {allChanges.map((ch, idx) => (
                          <li
                            key={idx}
                            className="rounded-md border border-border bg-muted/30 px-3.5 py-2.5 text-xs space-y-1"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-[11px]">
                                {KIND_LABELS[ch.kind] || "Upgrade"}
                              </Badge>
                              {ch.why ? (
                                <span className="font-medium text-foreground">{ch.why}</span>
                              ) : null}
                            </div>
                            <p className="text-muted-foreground line-through">{ch.was}</p>
                            <p className="font-medium text-primary">→ {ch.now}</p>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {existingFeedback.model?.lessons?.length ? (
                      <div className="rounded-md border border-border bg-muted/25 p-4 space-y-2">
                        <p className="text-xs font-bold text-foreground">Key Band-Up Takeaways</p>
                        <ul className="space-y-1.5 text-xs text-muted-foreground">
                          {existingFeedback.model.lessons.map((ls, li) =>
                            typeof ls === "string" ? (
                              <li key={li}>• {ls}</li>
                            ) : (
                              <li key={li}>
                                <strong className="text-foreground">{ls.point}</strong>
                                {ls.example ? ` — ${ls.example}` : ""}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                );
              })()}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
