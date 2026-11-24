import { NextResponse } from "next/server";
import readingArticles from "@/data/seed/reading_articles.json";
import type { ReadingArticleData } from "@/lib/types";

const articlesMap = readingArticles as unknown as Record<string, ReadingArticleData>;

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const article = articlesMap[id];
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }
  return NextResponse.json(article);
}
