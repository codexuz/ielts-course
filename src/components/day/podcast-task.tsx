"use client";

import React, { useRef, useState } from "react";
import { Check, Eye, EyeOff, Headphones, Play, RotateCcw } from "lucide-react";
import type { CourseDay } from "@/lib/types";
import { cn, formatClock, normalizeAnswer, padDay, resolveAssetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface PodcastTaskProps {
  day: CourseDay;
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  submitted: boolean;
}

export function PodcastTask({ day, value, onChange, submitted }: PodcastTaskProps) {
  const podcast = day.data.podcast;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [speed, setSpeed] = useState(1);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [activeIdx, setActiveIdx] = useState(0);

  if (!podcast) {
    return <p className="text-sm text-muted-foreground">No podcast assigned for this day.</p>;
  }

  const audioUrl = resolveAssetUrl(
    podcast.audio || podcast.url || `files/day${padDay(day.n)}-podcast.mp3`
  );
  const lines = podcast.lines || [];

  const playFrom = (idx: number, timeSec: number) => {
    setActiveIdx(idx);
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.max(0, timeSec);
    el.playbackRate = speed;
    void el.play().catch(() => {});
  };

  const changeSpeed = (nextSpeed: number) => {
    setSpeed(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const completedCount = lines.filter((line, idx) => {
    const typed = normalizeAnswer(value[String(idx)]);
    const target = normalizeAnswer(line.text);
    return typed.length > 0 && (typed === target || typed.length >= target.length * 0.6);
  }).length;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-bold tracking-tight">
                {podcast.title || `Day ${padDay(day.n)} Podcast`}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">
              {podcast.note || "Listen sentence by sentence and type what you hear. Click any timestamp to jump directly to that line."}
            </p>
          </div>
          <Badge variant="outline" className="font-mono self-start sm:self-center">
            {completedCount} / {lines.length} sentences
          </Badge>
        </div>

        {/* Sticky Audio Console */}
        <div className="rounded-md border border-border bg-muted/40 p-3 flex flex-col gap-3 sm:flex-row sm:items-center">
          <audio
            ref={audioRef}
            controls
            preload="metadata"
            src={audioUrl}
            className="w-full h-10"
          />
          <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Playback speed">
            {[0.75, 1, 1.25, 1.5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => changeSpeed(s)}
                className={cn(
                  "rounded px-2 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer tabular",
                  speed === s
                    ? "bg-shell text-shell-foreground"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Sentence-by-Sentence Transcription Lines */}
      <div className="space-y-3">
        {lines.map((line, idx) => {
          const userVal = value[String(idx)] || "";
          const normUser = normalizeAnswer(userVal);
          const normTarget = normalizeAnswer(line.text);
          const exact = normUser.length > 0 && normUser === normTarget;
          const isShown = revealed[idx] || submitted;

          return (
            <div
              key={idx}
              className={cn(
                "rounded-lg border p-4 space-y-2.5 transition-colors bg-card",
                activeIdx === idx ? "border-primary/60" : "border-border"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 min-w-6 items-center justify-center rounded bg-muted px-1.5 font-mono text-xs font-semibold text-foreground tabular">
                    {idx + 1}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => playFrom(idx, line.t)}
                  >
                    <Play className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="font-mono tabular">{formatClock(line.t)}</span>
                  </Button>
                  {activeIdx === idx ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => playFrom(idx, Math.max(0, line.t - 2))}
                      aria-label="Replay 2 seconds earlier"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      -2s
                    </Button>
                  ) : null}
                </div>

                <div className="flex items-center gap-2">
                  {exact ? (
                    <Badge variant="success">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      Exact match
                    </Badge>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setRevealed((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                  >
                    {isShown ? (
                      <>
                        <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        Hide script
                      </>
                    ) : (
                      <>
                        <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        Check line
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <Textarea
                rows={2}
                value={userVal}
                onFocus={() => setActiveIdx(idx)}
                onChange={(e) => onChange({ ...value, [String(idx)]: e.target.value })}
                placeholder={`Type sentence ${idx + 1}...`}
                className="font-sans text-sm"
              />

              {isShown ? (
                <div className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-serif text-foreground">
                  <span className="font-sans text-xs font-semibold text-muted-foreground mr-2">
                    Transcript:
                  </span>
                  {line.text}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
