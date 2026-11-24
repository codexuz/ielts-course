"use client";

import React, { useEffect, useState } from "react";
import { Check, Save } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn, isTestDay, padDay } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CourseCmsPanel() {
  const { days, answerKeys, adminUpdateDay, adminUpdateAnswerKey } = useApp();
  const [selectedDay, setSelectedDay] = useState(1);
  const [savedNotice, setSavedNotice] = useState(false);

  const dayObj = days.find((d) => d.n === selectedDay);
  const keyObj = answerKeys.find((k) => k.n === selectedDay);

  const [title, setTitle] = useState("");
  const [podcastTitle, setPodcastTitle] = useState("");
  const [podcastAudio, setPodcastAudio] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [articleText, setArticleText] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [speakingTitle, setSpeakingTitle] = useState("");
  const [speakingText, setSpeakingText] = useState("");
  const [writingType, setWritingType] = useState("");
  const [writingMinWords, setWritingMinWords] = useState(150);
  const [writingPrompt, setWritingPrompt] = useState("");
  const [filmUrl, setFilmUrl] = useState("");
  const [videoKeyCsv, setVideoKeyCsv] = useState("");
  const [speakKeyCsv, setSpeakKeyCsv] = useState("");

  useEffect(() => {
    if (!dayObj) return;
    setTitle(dayObj.data.title || "");
    setPodcastTitle(dayObj.data.podcast?.title || "");
    setPodcastAudio(dayObj.data.podcast?.audio || dayObj.data.podcast?.url || "");
    setArticleTitle(dayObj.data.article?.title || "");
    setArticleUrl(dayObj.data.article?.url || "");
    setArticleText(dayObj.data.article?.text || "");
    setVideoTitle(dayObj.data.video?.title || "");
    setVideoUrl(dayObj.data.video?.url || "");
    setSpeakingTitle(dayObj.data.speaking?.title || "");
    setSpeakingText(dayObj.data.speaking?.text || "");
    setWritingType(dayObj.data.writing?.type || "");
    setWritingMinWords(dayObj.data.writing?.minWords || 150);
    setWritingPrompt(dayObj.data.writing?.prompt || "");
    setFilmUrl(dayObj.data.film?.url || "");
    setVideoKeyCsv((keyObj?.answers || []).join(", "));
    setSpeakKeyCsv((keyObj?.speak_answers || []).join(", "));
    setSavedNotice(false);
  }, [selectedDay, dayObj, keyObj]);

  if (!dayObj) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    adminUpdateDay(selectedDay, {
      ...dayObj.data,
      title,
      podcast: {
        ...dayObj.data.podcast,
        title: podcastTitle,
        audio: podcastAudio,
      },
      article: {
        ...dayObj.data.article,
        title: articleTitle,
        url: articleUrl,
        text: articleText,
      },
      video: {
        ...dayObj.data.video,
        title: videoTitle,
        url: videoUrl,
      },
      speaking: {
        ...dayObj.data.speaking,
        title: speakingTitle,
        text: speakingText,
      },
      writing: {
        ...dayObj.data.writing,
        type: writingType,
        minWords: Number(writingMinWords) || 150,
        prompt: writingPrompt,
      },
      film: {
        ...dayObj.data.film,
        url: filmUrl,
      },
    });

    const parsedVideoKeys = videoKeyCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const parsedSpeakKeys = speakKeyCsv
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    adminUpdateAnswerKey(selectedDay, parsedVideoKeys, parsedSpeakKeys);

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* 24-Day Selector Strip */}
      <div className="rounded-lg border border-border bg-card p-4 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold">Select Course Day to Edit</h2>
          <span className="text-xs text-muted-foreground font-mono">
            Editing Day {padDay(selectedDay)} {isTestDay(selectedDay) ? "· IELTS Test Day" : ""}
          </span>
        </div>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {days.map((d) => (
            <button
              key={d.n}
              type="button"
              onClick={() => setSelectedDay(d.n)}
              className={cn(
                "h-9 rounded-md border font-mono text-xs font-semibold transition-colors cursor-pointer tabular",
                selectedDay === d.n
                  ? "border-primary bg-primary text-primary-foreground"
                  : isTestDay(d.n)
                  ? "border-milestone-border/50 bg-milestone-bg/40 text-milestone hover:border-milestone"
                  : "border-border bg-background text-foreground hover:border-primary/60"
              )}
            >
              {padDay(d.n)}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSave} className="rounded-lg border border-border bg-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Badge variant="default" className="font-mono">DAY {padDay(selectedDay)}</Badge>
            <h3 className="text-base font-bold">Curriculum &amp; Media Editor</h3>
          </div>
          <div className="flex items-center gap-2">
            {savedNotice ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-success">
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Changes saved
              </span>
            ) : null}
            <Button type="submit" size="sm">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Day {padDay(selectedDay)}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="cms-title" className="text-xs font-semibold text-muted-foreground">
              Day Motto / Headline
            </label>
            <Input id="cms-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cms-pod-title" className="text-xs font-semibold text-muted-foreground">
              Podcast Title
            </label>
            <Input id="cms-pod-title" value={podcastTitle} onChange={(e) => setPodcastTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-pod-url" className="text-xs font-semibold text-muted-foreground">
              Podcast Audio URL / Path
            </label>
            <Input id="cms-pod-url" value={podcastAudio} onChange={(e) => setPodcastAudio(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cms-vid-title" className="text-xs font-semibold text-muted-foreground">
              TED-Ed / Video Title
            </label>
            <Input id="cms-vid-title" value={videoTitle} onChange={(e) => setVideoTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-vid-url" className="text-xs font-semibold text-muted-foreground">
              Video YouTube URL or ID
            </label>
            <Input id="cms-vid-url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cms-art-title" className="text-xs font-semibold text-muted-foreground">
              Article Title
            </label>
            <Input id="cms-art-title" value={articleTitle} onChange={(e) => setArticleTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-art-url" className="text-xs font-semibold text-muted-foreground">
              Article PDF Path / URL
            </label>
            <Input id="cms-art-url" value={articleUrl} onChange={(e) => setArticleUrl(e.target.value)} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="cms-art-text" className="text-xs font-semibold text-muted-foreground">
              Article Body &amp; Essential Words
            </label>
            <Textarea id="cms-art-text" rows={5} value={articleText} onChange={(e) => setArticleText(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cms-spk-title" className="text-xs font-semibold text-muted-foreground">
              Speaking Topic Title
            </label>
            <Input id="cms-spk-title" value={speakingTitle} onChange={(e) => setSpeakingTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-film-url" className="text-xs font-semibold text-muted-foreground">
              Short Film YouTube Override URL
            </label>
            <Input id="cms-film-url" value={filmUrl} onChange={(e) => setFilmUrl(e.target.value)} />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="cms-spk-text" className="text-xs font-semibold text-muted-foreground">
              Speaking Part 1 / 2 / 3 Questions
            </label>
            <Textarea id="cms-spk-text" rows={4} value={speakingText} onChange={(e) => setSpeakingText(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cms-wr-type" className="text-xs font-semibold text-muted-foreground">
              Writing Task Label
            </label>
            <Input id="cms-wr-type" value={writingType} onChange={(e) => setWritingType(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-wr-min" className="text-xs font-semibold text-muted-foreground">
              Minimum Words
            </label>
            <Input
              id="cms-wr-min"
              type="number"
              value={writingMinWords}
              onChange={(e) => setWritingMinWords(Number(e.target.value))}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label htmlFor="cms-wr-prompt" className="text-xs font-semibold text-muted-foreground">
              IELTS Writing Prompt
            </label>
            <Textarea id="cms-wr-prompt" rows={4} value={writingPrompt} onChange={(e) => setWritingPrompt(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="cms-vk" className="text-xs font-semibold text-muted-foreground">
              Video Gap-Fill Answer Key (comma-separated)
            </label>
            <Textarea id="cms-vk" rows={2} value={videoKeyCsv} onChange={(e) => setVideoKeyCsv(e.target.value)} placeholder="word1, word2, word3..." />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="cms-sk" className="text-xs font-semibold text-muted-foreground">
              Speaking Quiz Answer Key (comma-separated)
            </label>
            <Textarea id="cms-sk" rows={2} value={speakKeyCsv} onChange={(e) => setSpeakKeyCsv(e.target.value)} placeholder="phrase1, phrase2, a, b, c..." />
          </div>
        </div>
      </form>
    </div>
  );
}
