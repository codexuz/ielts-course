"use client";

import React, { useState } from "react";
import { CheckCircle2, Video, XCircle } from "lucide-react";
import type { CourseDay } from "@/lib/types";
import { cn, extractYouTubeId, normalizeAnswer } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WatchingTaskProps {
  day: CourseDay;
  answers: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  answerKey?: string[];
  canRevealKey: boolean;
}

export function WatchingTask({
  day,
  answers,
  onChange,
  answerKey,
  canRevealKey,
}: WatchingTaskProps) {
  const video = day.data.video;
  const [checked, setChecked] = useState(false);

  if (!video) {
    return <p className="text-sm text-muted-foreground">No video gap-fill assigned for this day.</p>;
  }

  const ytId = extractYouTubeId(video.url);
  const segments = video.segments || [];
  const gapCount = Math.max(0, segments.length - 1);

  const filledCount = Array.from({ length: gapCount }, (_, i) => answers[String(i)] || "").filter(
    (v) => v.trim().length > 0
  ).length;

  const hasKey = Boolean(answerKey && answerKey.length > 0 && (canRevealKey || checked));
  const correctCount = hasKey
    ? Array.from({ length: gapCount }, (_, i) => {
        const expected = answerKey?.[i];
        return expected && normalizeAnswer(answers[String(i)]) === normalizeAnswer(expected);
      }).filter(Boolean).length
    : 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight">
                {video.title || `Day ${day.n} Video Gap-Fill`}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {video.note || "Watch the talk and fill in each missing word in the transcript below."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {filledCount} / {gapCount} filled
            </Badge>
            {hasKey ? (
              <Badge variant="success" className="font-mono">
                Score: {correctCount}/{gapCount}
              </Badge>
            ) : null}
          </div>
        </div>

        {ytId ? (
          <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
              title={video.title || "Course video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        ) : null}
      </div>

      {/* Inline Gap-Fill Transcript */}
      <div className="rounded-lg border border-border bg-card p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <h3 className="text-base font-bold">Interactive Gap-Fill Transcript</h3>
          {answerKey && answerKey.length > 0 ? (
            <Button type="button" size="sm" variant="outline" onClick={() => setChecked((c) => !c)}>
              {checked ? "Hide check" : "Check answers"}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">
              Answer key unlocks upon submitting the day
            </span>
          )}
        </div>

        <div className="font-serif text-[16px] leading-[2.05] text-foreground whitespace-pre-line">
          {segments.map((seg, i) => {
            const isLast = i === segments.length - 1;
            const val = answers[String(i)] || "";
            const expected = answerKey?.[i];
            const showEval = hasKey && Boolean(expected);
            const isCorrect = showEval && normalizeAnswer(val) === normalizeAnswer(expected);

            return (
              <React.Fragment key={i}>
                <span>{seg}</span>
                {!isLast ? (
                  <span className="inline-flex items-center gap-1 align-baseline mx-1 my-0.5 font-sans">
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-shell px-1 font-mono text-[11px] font-semibold text-shell-foreground tabular">
                      {i + 1}
                    </span>
                    <input
                      type="text"
                      aria-label={`Gap ${i + 1}`}
                      value={val}
                      onChange={(e) => onChange({ ...answers, [String(i)]: e.target.value })}
                      className={cn(
                        "h-8 w-36 sm:w-40 rounded border px-2.5 text-sm font-sans bg-background text-foreground focus-visible:outline-2 focus-visible:outline-ring",
                        showEval
                          ? isCorrect
                            ? "border-success bg-success-bg/40"
                            : "border-destructive bg-destructive/10"
                          : "border-input"
                      )}
                      placeholder={`Gap ${i + 1}`}
                    />
                    {showEval ? (
                      isCorrect ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" aria-label="Correct" />
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{expected}</span>
                        </span>
                      )
                    ) : null}
                  </span>
                ) : null}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
