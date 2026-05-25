import { createServerFn } from "@tanstack/react-start";
import { QUESTION_BANK, type Question, type QuestionType } from "@/data/questionBank";

export interface WorksheetRequest {
  className: number;
  subject: string;
  chapter: string;
  counts: {
    mcq: number;
    fill_blank: number;
    true_false: number;
    subjective: number;
  };
}

export interface WorksheetResult {
  mcq: Question[];
  fill_blank: Question[];
  true_false: Question[];
  subjective: Question[];
}

function findBank(className: number, subject: string) {
  return QUESTION_BANK.find(
    (b) => b.class === className && b.subject.toLowerCase() === subject.toLowerCase()
  );
}

function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

// ---------- Server fns ----------

export const getClasses = createServerFn({ method: "GET" }).handler(async () => {
  const classes = Array.from(new Set(QUESTION_BANK.map((b) => b.class))).sort((a, b) => a - b);
  return { classes };
});

export const getSubjects = createServerFn({ method: "GET" })
  .inputValidator((data: { className: number }) => data)
  .handler(async ({ data }) => {
    const subjects = Array.from(
      new Set(QUESTION_BANK.filter((b) => b.class === data.className).map((b) => b.subject))
    );
    return { subjects };
  });

export const getChapters = createServerFn({ method: "GET" })
  .inputValidator((data: { className: number; subject: string }) => data)
  .handler(async ({ data }) => {
    const bank = findBank(data.className, data.subject);
    return { chapters: bank ? bank.chapters.map((c) => c.name) : [] };
  });

export const generateWorksheet = createServerFn({ method: "POST" })
  .inputValidator((data: WorksheetRequest) => data)
  .handler(async ({ data }): Promise<WorksheetResult> => {
    const bank = findBank(data.className, data.subject);
    if (!bank) throw new Error("No question bank for the selected class and subject.");
    const chapter = bank.chapters.find((c) => c.name === data.chapter);
    if (!chapter) throw new Error("Chapter not found.");

    const byType: Record<QuestionType, Question[]> = {
      mcq: [], fill_blank: [], true_false: [], subjective: [],
    };
    for (const q of chapter.questions) byType[q.type].push(q);

    const validate = (type: QuestionType, requested: number, label: string) => {
      if (requested > byType[type].length) {
        throw new Error(
          `Only ${byType[type].length} ${label} available in "${data.chapter}". You requested ${requested}.`
        );
      }
    };
    validate("mcq", data.counts.mcq, "MCQs");
    validate("fill_blank", data.counts.fill_blank, "Fill in the Blanks");
    validate("true_false", data.counts.true_false, "True/False");
    validate("subjective", data.counts.subjective, "Subjective questions");

    return {
      mcq: pickRandom(byType.mcq, data.counts.mcq),
      fill_blank: pickRandom(byType.fill_blank, data.counts.fill_blank),
      true_false: pickRandom(byType.true_false, data.counts.true_false),
      subjective: pickRandom(byType.subjective, data.counts.subjective),
    };
  });
