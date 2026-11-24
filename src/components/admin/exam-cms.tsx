"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ExternalLink, Save } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export function ExamCmsPanel() {
  const { tests, adminUpdateTest } = useApp();
  const [selectedId, setSelectedId] = useState(tests[0]?.id || "placement");
  const [partIdx, setPartIdx] = useState(0);
  const [savedNotice, setSavedNotice] = useState(false);

  const test = tests.find((t) => t.id === selectedId);
  const section = test?.data.sections?.[0];
  const parts = section?.parts || [];
  const activePart = parts[partIdx];

  const [title, setTitle] = useState("");
  const [reveal, setReveal] = useState(true);
  const [minutes, setMinutes] = useState(40);
  const [audio, setAudio] = useState("");
  const [partTitle, setPartTitle] = useState("");
  const [partInstruction, setPartInstruction] = useState("");
  const [partPassage, setPartPassage] = useState("");
  const [partHtml, setPartHtml] = useState("");

  useEffect(() => {
    if (!test) return;
    setTitle(test.title);
    setReveal(test.reveal);
    setMinutes(test.data.sections?.[0]?.minutes || 40);
    setAudio(test.data.sections?.[0]?.audio || "");
    const p = test.data.sections?.[0]?.parts?.[partIdx];
    setPartTitle(p?.title || "");
    setPartInstruction(p?.instruction || "");
    const rawPassage = p?.passage;
    setPartPassage(
      typeof rawPassage === "string"
        ? rawPassage
        : rawPassage && typeof rawPassage === "object"
        ? rawPassage.html || ""
        : ""
    );
    setPartHtml(p?.html || "");
    setSavedNotice(false);
  }, [test, partIdx]);

  if (!test) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nextSections = [...test.data.sections];
    if (nextSections[0]) {
      const nextParts = nextSections[0].parts ? [...nextSections[0].parts] : undefined;
      if (nextParts && nextParts[partIdx]) {
        const existingPassage = nextParts[partIdx].passage;
        const nextPassage =
          existingPassage && typeof existingPassage === "object"
            ? { ...existingPassage, html: partPassage }
            : partPassage || undefined;
        nextParts[partIdx] = {
          ...nextParts[partIdx],
          title: partTitle,
          instruction: partInstruction,
          passage: nextPassage,
          html: partHtml,
        };
      }
      nextSections[0] = {
        ...nextSections[0],
        minutes: Number(minutes) || 40,
        audio: audio || undefined,
        parts: nextParts,
      };
    }

    adminUpdateTest({
      ...test,
      title,
      reveal,
      data: { ...test.data, title, sections: nextSections },
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Exam Catalog */}
      <div className="lg:col-span-4 rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
        {tests.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setSelectedId(t.id);
              setPartIdx(0);
            }}
            className={cn(
              "w-full text-left p-3.5 transition-colors cursor-pointer space-y-1",
              selectedId === t.id ? "bg-accent" : "hover:bg-muted/50"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <Badge variant={t.kind === "placement" ? "default" : "milestone"} className="text-[11px] uppercase">
                {t.kind}
              </Badge>
              {t.day ? (
                <span className="font-mono text-xs text-muted-foreground tabular">DAY {padDay(t.day)}</span>
              ) : null}
            </div>
            <p className="text-sm font-semibold text-foreground line-clamp-2">{t.title}</p>
          </button>
        ))}
      </div>

      {/* Right Exam Editor */}
      <form
        onSubmit={handleSave}
        className="lg:col-span-8 rounded-lg border border-border bg-card p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <h3 className="text-base font-bold">Edit Exam: {test.id}</h3>
          <div className="flex items-center gap-2">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Saved
              </span>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <Link href={`/exams/${test.id}`}>
                Preview
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </Button>
            <Button type="submit" size="sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Exam
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="ex-title" className="text-xs font-semibold text-muted-foreground">
              Exam Title
            </label>
            <Input id="ex-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="ex-min" className="text-xs font-semibold text-muted-foreground">
              Duration (minutes)
            </label>
            <Input
              id="ex-min"
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
            />
          </div>

          <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-xs font-semibold">Reveal Answers After Finish</p>
              <p className="text-[11px] text-muted-foreground">Allow students to inspect review mode</p>
            </div>
            <Switch checked={reveal} onCheckedChange={setReveal} />
          </div>

          {test.kind === "listening" || test.kind === "placement" ? (
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="ex-audio" className="text-xs font-semibold text-muted-foreground">
                Listening Audio URL / File Path
              </label>
              <Input id="ex-audio" value={audio} onChange={(e) => setAudio(e.target.value)} />
            </div>
          ) : null}
        </div>

        {parts.length > 0 ? (
          <div className="space-y-4 border-t border-border pt-4">
            <div className="flex flex-wrap gap-1.5">
              {parts.map((p, idx) => (
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

            {activePart ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="ex-ptitle" className="text-xs font-semibold text-muted-foreground">
                      Part Title
                    </label>
                    <Input id="ex-ptitle" value={partTitle} onChange={(e) => setPartTitle(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="ex-pinstr" className="text-xs font-semibold text-muted-foreground">
                      Part Instruction
                    </label>
                    <Input id="ex-pinstr" value={partInstruction} onChange={(e) => setPartInstruction(e.target.value)} />
                  </div>
                </div>

                {test.kind === "reading" ? (
                  <div className="space-y-1">
                    <label htmlFor="ex-pass" className="text-xs font-semibold text-muted-foreground">
                      Reading Passage HTML
                    </label>
                    <Textarea
                      id="ex-pass"
                      rows={6}
                      value={partPassage}
                      onChange={(e) => setPartPassage(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                ) : null}

                <div className="space-y-1">
                  <label htmlFor="ex-html" className="text-xs font-semibold text-muted-foreground">
                    Questions HTML (uses data-q attributes)
                  </label>
                  <Textarea
                    id="ex-html"
                    rows={7}
                    value={partHtml}
                    onChange={(e) => setPartHtml(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}
