"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, Film, HelpCircle, Sparkles, XCircle } from "lucide-react";
import type { CartoonItem, CourseDay, FilmItem, GrammarQuestion } from "@/lib/types";
import { cn, extractYouTubeId, normalizeAnswer, padDay, resolveAssetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface GrammarTaskProps {
  day: CourseDay;
  grammar2?: GrammarQuestion[];
  pace: 24 | 48;
  answers: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
}

const GRAMMAR_TYPE_LABEL: Record<string, string> = {
  correct: "Find and correct the mistake",
  verb: "Put the verb in the right form",
  rewrite: "Rewrite the sentence",
  combine: "Combine the sentences",
  paraphrase: "Paraphrase the sentence",
};

export function GrammarTask({
  day,
  grammar2,
  pace,
  answers,
  onChange,
}: GrammarTaskProps) {
  const [setIdx, setSetIdx] = useState<1 | 2>(1);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const list1 = day.data.grammar || [];
  const list2 = grammar2 || [];
  const activeList = setIdx === 1 ? list1 : list2;
  const prefix = setIdx === 1 ? "g1_" : "g2_";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Daily Grammar Challenge</h2>
          <p className="text-sm text-muted-foreground">
            Practise accuracy across error correction, verb forms, clause combining, and academic paraphrasing.
          </p>
        </div>

        {list2.length > 0 ? (
          <div className="inline-flex rounded-md border border-border bg-muted p-0.5 self-start">
            <button
              type="button"
              onClick={() => setSetIdx(1)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold cursor-pointer",
                setIdx === 1 ? "bg-card text-foreground" : "text-muted-foreground"
              )}
            >
              Set 1 ({list1.length})
            </button>
            <button
              type="button"
              onClick={() => setSetIdx(2)}
              className={cn(
                "rounded px-3 py-1.5 text-xs font-semibold cursor-pointer",
                setIdx === 2 ? "bg-card text-foreground" : "text-muted-foreground"
              )}
            >
              Set 2 {pace === 48 ? "· 48-Day Part 2" : "· Bonus"} ({list2.length})
            </button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {activeList.map((item, i) => {
          const key = `${prefix}${i}`;
          const val = answers[key] || "";
          const isChecked = checked[key];
          const isCorrect =
            isChecked &&
            item.a.some((acc) => normalizeAnswer(acc) === normalizeAnswer(val));

          return (
            <div key={key} className="rounded-lg border border-border bg-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-shell font-mono text-xs font-semibold text-shell-foreground tabular">
                    {i + 1}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {GRAMMAR_TYPE_LABEL[item.t] || item.t}
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setChecked((prev) => ({ ...prev, [key]: true }))}
                >
                  Check
                </Button>
              </div>

              <p className="text-sm sm:text-base font-medium text-foreground">{item.q}</p>

              {item.start ? (
                <p className="text-xs text-muted-foreground">
                  Start with: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{item.start}</code>
                </p>
              ) : null}

              <Input
                value={val}
                onChange={(e) => onChange({ ...answers, [key]: e.target.value })}
                placeholder={item.start ? `${item.start} ...` : "Type your corrected sentence..."}
                className={cn(
                  isChecked &&
                    (isCorrect ? "border-success bg-success-bg/30" : "border-destructive bg-destructive/5")
                )}
              />

              {isChecked ? (
                <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                        <span className="text-success">Correct</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                        <span className="text-destructive">Model answer: {item.a[0]}</span>
                      </>
                    )}
                  </div>
                  {item.why ? (
                    <p className="text-muted-foreground flex items-start gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                      <span>{item.why}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FilmCartoonTaskProps {
  day: CourseDay;
  film?: FilmItem;
  cartoon?: CartoonItem;
  sampleText?: string;
  filmText: string;
  cartoonText: string;
  onFilmChange: (v: string) => void;
  onCartoonChange: (v: string) => void;
}

export function FilmCartoonTask({
  day,
  film,
  cartoon,
  sampleText,
  filmText,
  cartoonText,
  onFilmChange,
  onCartoonChange,
}: FilmCartoonTaskProps) {
  const [showSample, setShowSample] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const ytId = extractYouTubeId(day.data.film?.url || film?.yt);
  const cartoonUrl = resolveAssetUrl(`cartoons/day${padDay(day.n)}.jpg`);

  const filmWords = film?.words || [];
  const cartoonWords = cartoon?.words || [];

  const lowerFilm = filmText.toLowerCase();
  const lowerCartoon = cartoonText.toLowerCase();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* Short Film Panel */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Film className="h-4 w-4 text-primary" aria-hidden="true" />
          <h2 className="text-base font-bold">
            Short Film: {film?.title || `Day ${padDay(day.n)} Film`}
          </h2>
        </div>

        {ytId ? (
          <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?rel=0`}
              title={film?.title || "Short film"}
              allowFullScreen
              className="h-full w-full border-0"
            />
          </div>
        ) : null}

        {filmWords.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">
              Useful expressions (highlighted automatically when used):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {filmWords.map(([expr, def]) => {
                const stem = expr.toLowerCase().replace(/^to\s+/, "").split("/")[0].trim();
                const used = stem.length > 2 && lowerFilm.includes(stem);
                return (
                  <span
                    key={expr}
                    title={def}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                      used
                        ? "border-success/40 bg-success-bg text-success font-medium"
                        : "border-border bg-muted/40 text-foreground"
                    )}
                  >
                    {used ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                    <span>{expr}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <Textarea
          rows={5}
          value={filmText}
          onChange={(e) => onFilmChange(e.target.value)}
          placeholder="Retell the short film's story and message using the expressions above..."
        />

        {sampleText ? (
          <div className="space-y-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setShowSample((s) => !s)}
            >
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {showSample ? "Hide Band 8 sample" : "View Band 8 sample"}
            </Button>
            {showSample ? (
              <div className="rounded-md border border-border bg-muted/40 p-3.5 text-sm font-serif leading-relaxed text-foreground">
                {sampleText}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Editorial Cartoon Panel */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">Editorial Cartoon Commentary</h2>
          <Badge variant="outline" className="font-mono">Day {padDay(day.n)}</Badge>
        </div>

        <div className="overflow-hidden rounded-md border border-border bg-muted/30 min-h-48 flex items-center justify-center">
          {!imgFailed ? (
            <img
              src={cartoonUrl}
              alt={`Day ${day.n} editorial cartoon`}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full max-h-80 object-contain mx-auto"
            />
          ) : (
            <div className="p-6 text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Editorial Cartoon — Day {padDay(day.n)}
              </p>
              <a
                href={cartoonUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-primary underline"
              >
                Open cartoon image in new tab
              </a>
            </div>
          )}
        </div>

        {cartoonWords.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">Target commentary idioms:</p>
            <div className="flex flex-wrap gap-1.5">
              {cartoonWords.map(([expr, def]) => {
                const stem = expr.toLowerCase().replace(/^to\s+/, "").trim();
                const used = stem.length > 2 && lowerCartoon.includes(stem);
                return (
                  <span
                    key={expr}
                    title={def}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs",
                      used
                        ? "border-success/40 bg-success-bg text-success font-medium"
                        : "border-border bg-muted/40 text-foreground"
                    )}
                  >
                    {used ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
                    <span>{expr}</span>
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <Textarea
          rows={5}
          value={cartoonText}
          onChange={(e) => onCartoonChange(e.target.value)}
          placeholder="Describe what the cartoon depicts and comment on its deeper social meaning..."
        />
      </div>
    </div>
  );
}
