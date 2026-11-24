export type UserRole = "student" | "assistant" | "teacher" | "admin";

export interface GroupRecord {
  id: string;
  name: string;
  open_days?: number[];
  created_at?: string;
}

export interface ProfileRecord {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  group_id: string | null;
  assistant_groups?: string[];
  level: string;
  pace: 24 | 48;
  open_days: number[];
  created_at?: string;
}

export interface PodcastLine {
  t: number;
  text: string;
}

export interface GrammarQuestion {
  t: "correct" | "verb" | "rewrite" | "combine" | "paraphrase" | string;
  q: string;
  start?: string;
  a: string[];
  why?: string;
}

export interface DayData {
  title: string;
  podcast?: {
    title?: string;
    audio?: string;
    url?: string;
    note?: string;
    end?: number;
    lines?: PodcastLine[];
  };
  article?: {
    title?: string;
    url?: string;
    task?: string;
    text?: string;
  };
  video?: {
    title?: string;
    url?: string;
    note?: string;
    segments?: string[];
  };
  speaking?: {
    title?: string;
    url?: string;
    task?: string;
    text?: string;
    maxMin?: number;
    segments?: string[];
  };
  writing?: {
    type?: string;
    prompt?: string;
    minWords?: number;
    image?: string;
    images?: string[];
    anyLength?: boolean;
    perPicture?: boolean;
    check?: boolean;
  };
  grammar?: GrammarQuestion[];
  film?: {
    url?: string;
    title?: string;
  };
}

export interface CourseDay {
  n: number;
  data: DayData;
  updated_at?: string;
}

export interface FilmItem {
  title: string;
  yt: string;
  words: [string, string][];
}

export interface CartoonItem {
  title?: string;
  words: [string, string][];
}

export interface AnswerKeyRecord {
  n: number;
  answers?: string[];
  speak_answers?: string[];
}

export interface ExamPassageObject {
  title?: string;
  intro?: string;
  html: string;
}

export interface ExamPart {
  n: number;
  from: number;
  to: number;
  title?: string;
  instruction?: string;
  passage?: string | ExamPassageObject;
  html: string;
  start?: number;
}

export interface PlacementBlock {
  type: string;
  text?: string;
  q?: string;
  n?: number;
  options?: string[];
  items?: Array<{ n: number; q?: string; options?: string[] }>;
}

export interface ExamSection {
  id: string;
  title: string;
  minutes?: number;
  audio?: string;
  audioSec?: number;
  intro?: string;
  parts?: ExamPart[];
  blocks?: PlacementBlock[];
}

export interface TestRecord {
  id: string;
  title: string;
  kind: "placement" | "listening" | "reading";
  day: number | null;
  required: boolean;
  reveal: boolean;
  data: {
    id?: string;
    title?: string;
    intro?: string;
    day?: number;
    kind?: string;
    sections: ExamSection[];
  };
}

export interface TestResultRecord {
  id: string;
  user_id: string;
  test_id: string;
  status: "in_progress" | "finished";
  answers: Record<string, string>;
  flagged?: number[];
  score: number;
  total: number;
  band: number | null;
  started_at?: string;
  finished_at?: string;
}

export interface SubmissionRecord {
  id?: string;
  user_id: string;
  n: number;
  status: "draft" | "submitted";
  podcast?: Record<string, string>;
  article?: string;
  answers?: Record<string, string> | string[];
  speak_answers?: Record<string, string> | string[];
  writing?: string | Record<string, string>;
  film_text?: string;
  cartoon_text?: string;
  reflection?: string;
  practice?: Record<string, unknown>;
  teacher_note?: string;
  submitted_at?: string | null;
  updated_at?: string;
}

export interface WritingModelPart {
  t?: string;
  text?: string;
  was?: string;
  now?: string;
  kind?: "grammar" | "vocabulary" | "linking" | "idea" | "task" | string;
  why?: string;
}

export interface WritingModelPiece {
  title?: string;
  original?: string;
  parts?: WritingModelPart[];
  t?: string;
  text?: string;
  was?: string;
  now?: string;
  kind?: "grammar" | "vocabulary" | "linking" | "idea" | "task" | string;
  why?: string;
}

export interface WritingCriterionItem {
  name?: string;
  title?: string;
  band?: number;
  score?: number;
  comment?: string;
  good?: string[];
  fix?: string[];
}

export interface WritingFeedbackRecord {
  id?: string;
  user_id: string;
  n: number;
  band?: number;
  model_level?: string;
  feedback?: {
    band?: number;
    overview?: string;
    summary?: string;
    criteria?: WritingCriterionItem[] | Record<string, { score?: number; comment?: string }>;
    corrections?: Array<{ was?: string; fix?: string; now?: string; why?: string }>;
    strengths?: string[];
    improvements?: string[];
    raw?: string;
  };
  model?: {
    pieces?: WritingModelPiece[];
    lessons?: Array<string | { point?: string; example?: string }>;
    text?: string;
  };
  created_at?: string;
}

export interface VocabItem {
  id: string;
  user_id?: string;
  word: string;
  pos?: string | null;
  ipa?: string | null;
  uz?: string | null;
  en?: string | null;
  example?: string | null;
  synonyms?: string[];
  collocations?: string[];
  day?: number | null;
  status: "new" | "learning" | "mastered";
  ease?: number;
  interval_days?: number;
  reps?: number;
  correct_count?: number;
  wrong_count?: number;
  due_at?: string;
  created_at?: string;
}

export interface RecordingRecord {
  id?: string;
  user_id: string;
  n: number;
  kind?: "speaking" | "film" | "cartoon";
  path: string;
  full_name: string;
  seconds: number;
  created_at?: string;
}

export interface RankingEntry {
  user_id?: string;
  full_name?: string;
  name?: string;
  group_id?: string | null;
  group_name?: string;
  days?: number;
  submitted_days?: number;
  accuracy?: number | string;
  tests?: number;
  tests_done?: number;
  points?: number;
  points_change?: number | string;
  rank?: number;
}

export interface ReadingTopicCatalog {
  key: string;
  name: string;
  icon: string;
  hue: number;
  arts: [string, string, string, string, string][];
}

export interface ReadingArticleLevel {
  text: string[];
  words: [string, string, string][];
  gaps: [string, string][];
  use: string[];
  define: [string, string][];
  form: [string, string, string, string][];
  grammar: [string, string[], number, string][];
  tfng: [string, string, string][];
  short: [string, string, string][];
  mcq: [string, string[], number, string][];
}

export interface ReadingArticleData {
  id: string;
  topic: string;
  A2: ReadingArticleLevel;
  B1: ReadingArticleLevel;
  B2: ReadingArticleLevel;
  C1: ReadingArticleLevel;
  C2: ReadingArticleLevel;
}

export interface ReadingRequestRecord {
  id: string;
  user_id: string;
  student_name: string;
  article_id: string;
  article_title: string;
  status: "pending" | "approved" | "declined";
  created_at: string;
}
