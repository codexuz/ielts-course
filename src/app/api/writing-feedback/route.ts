import { NextResponse } from "next/server";
import { countWords } from "@/lib/utils";
import type { WritingModelPiece } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      text: string;
      prompt?: string;
      minWords?: number;
      day?: number;
    };

    const rawText = (body.text || "").trim();
    const wc = countWords(rawText);
    const minWords = body.minWords || 150;

    if (wc < 15) {
      return NextResponse.json(
        { error: "Please write at least 15 words before requesting IELTS feedback." },
        { status: 400 }
      );
    }

    const sentences = rawText.split(/(?<=[.!?])\s+/).filter(Boolean);
    const avgLen = wc / Math.max(1, sentences.length);
    const hasLinkers = /\b(however|moreover|furthermore|consequently|although|despite|nevertheless|therefore|in addition|on the other hand)\b/i.test(
      rawText
    );
    const hasLongWords = (rawText.match(/\b[a-z]{9,}\b/gi) || []).length;

    const tr = Math.min(8.5, Math.max(5.0, wc >= minWords ? 7.0 : wc >= minWords * 0.7 ? 6.0 : 5.5));
    const cc = Math.min(8.5, hasLinkers ? 7.0 : 6.0);
    const lr = Math.min(8.5, hasLongWords >= 8 ? 7.5 : hasLongWords >= 4 ? 6.5 : 6.0);
    const gra = Math.min(8.5, avgLen >= 14 && avgLen <= 26 ? 7.0 : 6.0);
    const overall = Math.round(((tr + cc + lr + gra) / 4) * 2) / 2;

    // Build an interactive "Better Version" upgrade diff highlighting specific improvements
    const pieces: WritingModelPiece[] = [];
    const replacements: Array<{
      re: RegExp;
      now: string;
      kind: "vocabulary" | "grammar" | "linking";
      why: string;
    }> = [
      {
        re: /\bvery important\b/i,
        now: "crucial",
        kind: "vocabulary",
        why: "Replace 'very + adjective' with a stronger, more precise Band 7+ academic adjective.",
      },
      {
        re: /\bvery big\b/i,
        now: "substantial",
        kind: "vocabulary",
        why: "'Substantial' elevates lexical precision in academic writing.",
      },
      {
        re: /\ba lot of\b/i,
        now: "a considerable number of",
        kind: "vocabulary",
        why: "'A lot of' is informal; use formal quantifiers in IELTS Task 2.",
      },
      {
        re: /\bbut\b/i,
        now: "however,",
        kind: "linking",
        why: "Using 'however' strengthens formal contrast and coherence.",
      },
      {
        re: /\bI think\b/i,
        now: "From my perspective,",
        kind: "linking",
        why: "Varied stance markers improve both Cohesion and Lexical Resource.",
      },
      {
        re: /\bmore easier\b/i,
        now: "far more straightforward",
        kind: "grammar",
        why: "Avoid double comparatives ('more easier'); use 'much easier' or 'far more straightforward'.",
      },
      {
        re: /\bgood\b/i,
        now: "beneficial",
        kind: "vocabulary",
        why: "More specific academic vocabulary lifts Lexical Resource.",
      },
      {
        re: /\bbad\b/i,
        now: "detrimental",
        kind: "vocabulary",
        why: "Formal academic register for negative effects.",
      },
    ];

    let remaining = rawText;
    let appliedCount = 0;
    for (const rule of replacements) {
      if (appliedCount >= 4) break;
      const m = remaining.match(rule.re);
      if (m && m.index !== undefined) {
        if (m.index > 0) {
          pieces.push({ text: remaining.slice(0, m.index) });
        }
        pieces.push({
          was: m[0],
          now: rule.now,
          kind: rule.kind,
          why: rule.why,
        });
        remaining = remaining.slice(m.index + m[0].length);
        appliedCount++;
      }
    }
    if (remaining) {
      pieces.push({ text: remaining });
    }
    if (appliedCount === 0 && sentences.length > 0) {
      pieces.length = 0;
      pieces.push({
        was: sentences[0],
        now: `In contemporary discourse, ${sentences[0].charAt(0).toLowerCase()}${sentences[0].slice(1)}`,
        kind: "linking",
        why: "Framing your opening claim with an academic lead-in sharpens task framing.",
      });
      if (sentences.length > 1) {
        pieces.push({ text: " " + sentences.slice(1).join(" ") });
      }
    }

    return NextResponse.json({
      band: overall,
      feedback: {
        band: overall,
        summary:
          wc >= minWords
            ? `Your response meets the target length (${wc} words) with clear progression. Focus on tightening academic collocations and varying complex clause structures to push toward Band ${Math.min(9, overall + 0.5).toFixed(1)}.`
            : `Your response currently has ${wc} words (target: ${minWords}+ words). Develop your supporting examples further to lift Task Response.`,
        criteria: {
          "Task Response": {
            score: tr,
            comment:
              wc >= minWords
                ? "Addresses the prompt directly with adequate development."
                : `Below the ${minWords}-word target; expand explanations with concrete evidence.`,
          },
          "Coherence & Cohesion": {
            score: cc,
            comment: hasLinkers
              ? "Effective use of formal cohesive devices between ideas."
              : "Add formal contrast/result linkers (e.g., 'Consequently', 'Nevertheless') to guide the reader.",
          },
          "Lexical Resource": {
            score: lr,
            comment:
              hasLongWords >= 6
                ? "Good range of less common topic vocabulary."
                : "Replace general words ('good', 'big', 'a lot of') with topic-specific collocations.",
          },
          "Grammatical Range": {
            score: gra,
            comment:
              avgLen >= 14
                ? "Balanced mix of simple and complex sentence structures."
                : "Combine shorter clauses using relative pronouns and subordinate clauses.",
          },
        },
        strengths: [
          `Clear paragraph focus across ${sentences.length} sentence${sentences.length === 1 ? "" : "s"}.`,
          hasLinkers ? "Uses formal academic transition markers." : "Direct, readable argumentation.",
        ],
        improvements: [
          wc < minWords ? `Aim for at least ${minWords} words to fully satisfy IELTS length criteria.` : "Include one counter-argument or nuanced concession for Band 7.5+.",
          "Review the highlighted upgrades in 'A better version' below to refine register.",
        ],
      },
      model: { pieces },
    });
  } catch {
    return NextResponse.json({ error: "Failed to analyze writing" }, { status: 500 });
  }
}
