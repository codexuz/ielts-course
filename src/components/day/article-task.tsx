"use client";

import React, { useMemo, useState } from "react";
import { BookOpen, Check, ExternalLink, Plus } from "lucide-react";
import type { CourseDay } from "@/lib/types";
import { useApp } from "@/lib/store";
import { cn, countWords, resolveAssetUrl } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface ArticleTaskProps {
  day: CourseDay;
  value: string;
  onChange: (next: string) => void;
}

export function ArticleTask({ day, value, onChange }: ArticleTaskProps) {
  const { addVocabWord, vocab } = useApp();
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const article = day.data.article;

  const essentialWords = useMemo(() => {
    const raw = article?.text || "";
    const idx = raw.search(/essential\s+words|key\s+vocabulary/i);
    if (idx === -1) return [];
    const tail = raw.slice(idx);
    const lines = tail.split(/\r?\n/).slice(1);
    const extracted: string[] = [];
    for (const ln of lines) {
      const clean = ln.trim();
      if (!clean) continue;
      const m = clean.match(/^(?:\d+[.)]\s*|[•\-–]\s*)?([A-Za-z][A-Za-z\s'\-()/]{1,42}?)(?:\s*[:–—-]|$)/);
      if (m && m[1].trim().length >= 2) {
        extracted.push(m[1].trim());
      }
      if (extracted.length >= 20) break;
    }
    return extracted;
  }, [article?.text]);

  if (!article) {
    return <p className="text-sm text-muted-foreground">No article assigned for this day.</p>;
  }

  const wc = countWords(value);
  const lowerSummary = value.toLowerCase();
  const usedCount = essentialWords.filter((w) => {
    const stem = w.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
    return stem.length > 2 && lowerSummary.includes(stem.split(" ")[0]);
  }).length;

  const handleSaveWord = (word: string) => {
    addVocabWord({
      word,
      status: "new",
      day: day.n,
      en: `From Day ${day.n} Article: ${article.title || ""}`,
    });
    setSavedNotice(word);
    setTimeout(() => setSavedNotice(null), 2000);
  };

  const pdfUrl = article.url ? resolveAssetUrl(article.url) : "";
  const paragraphs = (article.text || "").split(/\n{2,}/).filter((p) => p.trim());

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Article Reading Pane (Source Serif 4, 65-75ch optimal measure) */}
      <article className="lg:col-span-7 rounded-lg border border-border bg-card p-5 sm:p-7 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span className="text-xs font-semibold uppercase tracking-wider">Article Reading</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-foreground">
              {article.title || `Day ${day.n} Article`}
            </h2>
          </div>

          {pdfUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                Open PDF
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </div>

        {paragraphs.length > 0 ? (
          <div className="space-y-4 font-serif text-[16px] leading-[1.75] text-foreground max-w-[70ch]">
            {paragraphs.map((para, i) => (
              <p key={i} className="whitespace-pre-line">
                {para}
              </p>
            ))}
          </div>
        ) : pdfUrl ? (
          <div className="rounded-md border border-border bg-muted/40 p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              This article is delivered as a formatted PDF sheet. Open the PDF to read and then write your summary on the right.
            </p>
            <Button asChild>
              <a href={pdfUrl} target="_blank" rel="noreferrer">
                Read Article PDF
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Button>
          </div>
        ) : null}
      </article>

      {/* Right: Summary Composer + Essential Words Tracker */}
      <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-6">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-bold">Article Summary</h3>
            <Badge variant={wc >= 120 ? "success" : "outline"} className="font-mono">
              {wc} / 150 words
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground">
            {article.task ||
              "Summarise the main ideas of the article in your own words (about 150 words). Aim to incorporate the essential vocabulary."}
          </p>

          <Textarea
            rows={10}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Write your summary in your own words..."
            className="text-sm leading-relaxed"
          />

          <p className="text-xs text-muted-foreground">
            Draft autosaves automatically to your Day {day.n} record.
          </p>
        </div>

        {essentialWords.length > 0 ? (
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Essential Words</h3>
              <span className="font-mono text-xs text-muted-foreground tabular">
                {usedCount}/{essentialWords.length} used
              </span>
            </div>

            {savedNotice ? (
              <p className="text-xs font-medium text-success">
                Added &ldquo;{savedNotice}&rdquo; to My Words deck.
              </p>
            ) : null}

            <div className="flex flex-wrap gap-1.5">
              {essentialWords.map((w) => {
                const stem = w.toLowerCase().replace(/\s*\([^)]*\)/g, "").trim();
                const used = stem.length > 2 && lowerSummary.includes(stem.split(" ")[0]);
                const inDeck = vocab.some((v) => v.word.toLowerCase() === w.toLowerCase());
                return (
                  <button
                    key={w}
                    type="button"
                    onClick={() => handleSaveWord(w)}
                    title={inDeck ? "Already in My Words" : "Click to save to My Words"}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors cursor-pointer",
                      used
                        ? "border-success/40 bg-success-bg text-success"
                        : "border-border bg-muted/40 text-foreground hover:border-primary/50"
                    )}
                  >
                    {used ? (
                      <Check className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <Plus className="h-3 w-3 opacity-60" aria-hidden="true" />
                    )}
                    <span>{w}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
