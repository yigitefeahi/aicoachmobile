"use client";

import { splitLegacyQuestionBlock } from "@/lib/question-display";

type InterviewQuestionHeroProps = {
  questionText: string;
  /** Session line from API or URL params (role · level · sector …) — separate from the question body. */
  contextLabel?: string;
  /** Planner rationale — why this question was chosen. */
  questionRationale?: string;
};

/** Large question body; session row above so role/level info is never mixed with the ask. */
export function InterviewQuestionHero({
  questionText,
  contextLabel,
  questionRationale,
}: InterviewQuestionHeroProps) {
  const legacy = splitLegacyQuestionBlock(questionText);
  const ctx = (contextLabel && contextLabel.trim()) || legacy.context;
  const body = legacy.context ? legacy.body : questionText;
  const rationale = (questionRationale && questionRationale.trim()) || "";

  return (
    <div className="mb-8 rounded-[36px] border border-black/10 bg-white px-5 py-9 text-center shadow-[0_24px_70px_rgba(31,41,51,0.08)] sm:px-8 sm:py-11 md:px-12 md:py-14">
      {ctx ? (
        <div className="mx-auto mb-8 max-w-3xl border-b border-black/10 pb-8">
          <p className="step-label">Session</p>
          <p className="mx-auto mt-2 max-w-3xl text-sm leading-relaxed text-slate-400 md:text-base">{ctx}</p>
        </div>
      ) : null}

      <div className="mx-auto max-w-4xl">
        <p className="step-label">Question</p>
        <p className="mt-4 text-left text-2xl font-semibold leading-[1.45] tracking-[-0.025em] text-slate-50 sm:text-center sm:text-3xl sm:leading-[1.4] md:text-4xl md:leading-tight">
          {body}
        </p>
        {rationale ? (
          <details className="mx-auto mt-6 max-w-3xl rounded-2xl border border-black/10 bg-slate-50/80 px-4 py-3 text-left">
            <summary className="cursor-pointer text-sm font-medium text-slate-500">
              Why this question?
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{rationale}</p>
          </details>
        ) : null}
      </div>
    </div>
  );
}
