import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function padDay(n: number): string {
  return String(n).padStart(2, "0");
}

export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  return (text.trim().match(/\S+/g) || []).length;
}

export function extractYouTubeId(url: string | null | undefined): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([A-Za-z0-9_-]{11})/
  );
  return match ? match[1] : "";
}

export function resolveAssetUrl(path: string | null | undefined): string {
  if (!path) return "";
  const normalized = path
    .trim()
    .replace(/https?:\/\/english-homework-fm\.netlify\.app/gi, "https://ace-english-fm.netlify.app");
  if (/^https?:\/\//i.test(normalized)) return normalized;
  const clean = normalized.replace(/^\/+/, "");
  return `https://ace-english-fm.netlify.app/${clean}`;
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${String(sec).padStart(2, "0")}s`;
  return `${sec}s`;
}

export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function calculateIeltsBand(score: number, total = 40): number {
  const scaled = total === 40 ? score : Math.round((score / Math.max(1, total)) * 40);
  if (scaled >= 39) return 9.0;
  if (scaled >= 37) return 8.5;
  if (scaled >= 35) return 8.0;
  if (scaled >= 32) return 7.5;
  if (scaled >= 30) return 7.0;
  if (scaled >= 26) return 6.5;
  if (scaled >= 23) return 6.0;
  if (scaled >= 18) return 5.5;
  if (scaled >= 16) return 5.0;
  if (scaled >= 13) return 4.5;
  if (scaled >= 10) return 4.0;
  if (scaled >= 6) return 3.5;
  return 3.0;
}

export function normalizeAnswer(val: string | null | undefined): string {
  return String(val ?? "")
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ");
}

export const TEST_DAYS = [6, 12, 18, 24] as const;

export function isTestDay(n: number): boolean {
  return (TEST_DAYS as readonly number[]).includes(n);
}
