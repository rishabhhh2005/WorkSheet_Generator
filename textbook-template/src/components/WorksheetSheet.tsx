import type { ReactNode } from "react";
import type { WorksheetResult } from "@/lib/worksheet.functions";

export interface SheetMeta {
  schoolName: string;
  title: string;
  teacher: string;
  className: number | string;
  subject: string;
  chapter: string;
  date: string;
}

export function WorksheetSheet({ meta, data }: { meta: SheetMeta; data: WorksheetResult }) {
  const sections = [
    {
      key: "mcq",
      label: "Section A",
      title: "Multiple Choice Questions",
      instruction: "Choose the correct option.",
      count: data.mcq.length,
      tone: "blue",
      content: (
        <ol className="question-list">
          {data.mcq.map((q) => (
            <li key={q.id} className="question-item">
              <p className="question-text">{q.question}</p>
              <div className="option-grid">
                {q.options?.map((opt, i) => (
                  <div key={i} className="option-row">
                    <span className="option-label">{String.fromCharCode(65 + i)}.</span>
                    <span className="option-text">{opt}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "fill_blank",
      label: "Section B",
      title: "Fill in the Blanks",
      instruction: "Fill in the blanks with appropriate words.",
      count: data.fill_blank.length,
      tone: "purple",
      content: (
        <ol className="question-list">
          {data.fill_blank.map((q) => (
            <li key={q.id} className="question-item">
              <p className="question-text">{q.question}</p>
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "true_false",
      label: "Section C",
      title: "True / False",
      instruction: "Write True or False against each statement.",
      count: data.true_false.length,
      tone: "teal",
      content: (
        <ol className="question-list">
          {data.true_false.map((q) => (
            <li key={q.id} className="question-item">
              <div className="tf-row">
                <p className="question-text">{q.question}</p>
                <span className="tf-answer">True / False</span>
              </div>
            </li>
          ))}
        </ol>
      ),
    },
    {
      key: "subjective",
      label: "Section D",
      title: "Subjective Questions",
      instruction: "Answer the following questions in detail.",
      count: data.subjective.length,
      tone: "indigo",
      content: (
        <ol className="question-list subjective-list">
          {data.subjective.map((q) => (
            <li key={q.id} className="question-item">
              <p className="question-text">{q.question}</p>
              <div className="answer-lines" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
            </li>
          ))}
        </ol>
      ),
    },
  ].filter((section) => section.count > 0);

  return (
    <div className="sheet mx-auto w-full max-w-[840px] print:max-w-none">
      <header className="sheet-header">
        <div>
          <p className="sheet-kicker">Academic Worksheet</p>
          <h1>{meta.schoolName || "School Name"}</h1>
          <h2>{meta.title || "Worksheet"}</h2>
        </div>
        <div className="sheet-badge">
          <span>Class</span>
          <strong>{meta.className || "-"}</strong>
        </div>
      </header>

      <div className="info-grid" aria-label="Worksheet details">
        <InfoBox label="Teacher" value={meta.teacher || "-"} />
        <InfoBox label="Subject" value={meta.subject || "-"} />
        <InfoBox label="Date" value={meta.date || "-"} />
        <InfoBox label="Chapter" value={meta.chapter || "-"} wide />
      </div>

      {/* student details removed */}

      <main className="worksheet-body">
        {sections.map((section) => (
          <Section
            key={section.key}
            label={section.label}
            title={section.title}
            instruction={section.instruction}
            count={section.count}
            tone={section.tone}
          >
            {section.content}
          </Section>
        ))}
      </main>

      <footer className="sheet-footer">
        <span>End of Worksheet</span>
        <span>Best wishes</span>
      </footer>

      <div className="print-page-footer" aria-hidden="true">
        <span>{meta.schoolName || "Worksheet"}</span>
        <span className="page-number" />
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string | number;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "info-box info-box-wide" : "info-box"}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function FormLine({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <div className={compact ? "form-line form-line-compact" : "form-line"}>
      <span>{label}</span>
      <i aria-hidden="true" />
    </div>
  );
}

function Section({
  label,
  title,
  instruction,
  count,
  tone,
  children,
}: {
  label: string;
  title: string;
  instruction: string;
  count: number;
  tone: string;
  children: ReactNode;
}) {
  return (
    <section className={`worksheet-section worksheet-section-${tone}`}>
      <div className="section-banner">
        <div>
          <span>{label}</span>
          <h3>{title}</h3>
        </div>
        <strong>{count} Qs</strong>
      </div>
      <p className="section-instruction">{instruction}</p>
      <div className="section-content">{children}</div>
    </section>
  );
}
