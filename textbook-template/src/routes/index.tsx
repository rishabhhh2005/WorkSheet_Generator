import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import {
  getClasses,
  getSubjects,
  getChapters,
  generateWorksheet,
  type WorksheetResult,
} from "@/lib/worksheet.functions";
import { WorksheetSheet, type SheetMeta } from "@/components/WorksheetSheet";

export const Route = createFileRoute("/")({
  component: WorkSheetApp,
  head: () => ({
    meta: [
      { title: "WorkSheet — Generate printable worksheets in seconds" },
      {
        name: "description",
        content:
          "WorkSheet is a focused tool for teachers to instantly generate clean, printable worksheets from a curated question bank for classes 6 to 10.",
      },
    ],
  }),
});

const todayISO = () => new Date().toISOString().slice(0, 10);

function WorkSheetApp() {
  const fetchClasses = useServerFn(getClasses);
  const fetchSubjects = useServerFn(getSubjects);
  const fetchChapters = useServerFn(getChapters);
  const fetchWorksheet = useServerFn(generateWorksheet);

  const [classes, setClasses] = useState<number[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [chapters, setChapters] = useState<string[]>([]);

  const [form, setForm] = useState({
    schoolName: "",
    title: "Unit Test Worksheet",
    teacher: "",
    className: "" as number | "",
    subject: "",
    chapter: "",
    date: todayISO(),
    mcq: 5,
    fill_blank: 3,
    true_false: 3,
    subjective: 2,
  });

  const [result, setResult] = useState<WorksheetResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    fetchClasses()
      .then((r) => setClasses(r.classes))
      .catch(() => {});
  }, [fetchClasses]);

  useEffect(() => {
    if (form.className === "") {
      setSubjects([]);
      setForm((f) => ({ ...f, subject: "", chapter: "" }));
      return;
    }
    fetchSubjects({ data: { className: Number(form.className) } })
      .then((r) => setSubjects(r.subjects))
      .catch(() => setSubjects([]));
    setForm((f) => ({ ...f, subject: "", chapter: "" }));
    setChapters([]);
  }, [form.className, fetchSubjects]);

  useEffect(() => {
    if (form.className === "" || !form.subject) {
      setChapters([]);
      return;
    }
    fetchChapters({ data: { className: Number(form.className), subject: form.subject } })
      .then((r) => setChapters(r.chapters))
      .catch(() => setChapters([]));
    setForm((f) => ({ ...f, chapter: "" }));
  }, [form.subject, form.className, fetchChapters]);

  const meta: SheetMeta = useMemo(
    () => ({
      schoolName: form.schoolName,
      title: form.title,
      teacher: form.teacher,
      className: form.className,
      subject: form.subject,
      chapter: form.chapter,
      date: form.date,
    }),
    [form],
  );

  const validate = (): string | null => {
    if (!form.schoolName.trim()) return "School name is required.";
    if (!form.title.trim()) return "Worksheet title is required.";
    if (!form.teacher.trim()) return "Teacher name is required.";
    if (form.className === "") return "Select a class.";
    if (!form.subject) return "Select a subject.";
    if (!form.chapter) return "Select a chapter.";
    const total = form.mcq + form.fill_blank + form.true_false + form.subjective;
    if (total <= 0) return "Add at least one question to the worksheet.";
    return null;
  };

  const generateWorksheetData = async () => {
    const v = validate();
    if (v) throw new Error(v);

    return fetchWorksheet({
      data: {
        className: Number(form.className),
        subject: form.subject,
        chapter: form.chapter,
        counts: {
          mcq: form.mcq,
          fill_blank: form.fill_blank,
          true_false: form.true_false,
          subjective: form.subjective,
        },
      },
    });
  };

  const waitForPrintLayout = async () => {
    if ("fonts" in document) {
      await document.fonts.ready;
    }

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  };

  const handlePreview = async () => {
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    try {
      const data = await generateWorksheetData();
      setResult(data);
      setToast("Worksheet generated.");
      setTimeout(() => setToast(null), 2200);
      requestAnimationFrame(() => {
        document.getElementById("preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setError(null);
    setLoading(true);
    try {
      let data = result;
      if (!data) {
        data = await generateWorksheetData();
        flushSync(() => setResult(data));
      }

      await waitForPrintLayout();
      window.print();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      schoolName: "",
      title: "Unit Test Worksheet",
      teacher: "",
      className: "",
      subject: "",
      chapter: "",
      date: todayISO(),
      mcq: 5,
      fill_blank: 3,
      true_false: 3,
      subjective: 2,
    });
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* HERO */}
      <section className="no-print">
        <div className="mx-auto max-w-5xl px-6 pt-20 pb-10">
          <div className="rounded-2xl border border-hairline bg-card/40 px-8 py-16 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              WorkSheet · for teachers
            </p>
            <h1 className="mt-6 font-display text-5xl leading-tight tracking-tight sm:text-6xl">
              Printable worksheets,
              <br />
              generated in seconds.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              A PowerFul Tool Generated By Alpha Academy (All rights reserved).
            </p>
            <a
              href="#builder"
              className="mt-8 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Build a worksheet
              <span aria-hidden>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* BUILDER */}
      <section id="builder" className="no-print">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 lg:grid-cols-[420px_1fr]">
          {/* Form */}
          <div className="rounded-xl border border-hairline bg-card p-6">
            <h2 className="font-display text-2xl">Configure</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Fill in the details, then preview or print.
            </p>

            <div className="mt-6 space-y-4">
              <Field label="School name">
                <Input
                  value={form.schoolName}
                  onChange={(v) => setForm({ ...form, schoolName: v })}
                  placeholder="Alpha Academy"
                />
              </Field>
              <Field label="Worksheet title">
                <Input value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
              </Field>
              <Field label="Teacher name">
                <Input
                  value={form.teacher}
                  onChange={(v) => setForm({ ...form, teacher: v })}
                  placeholder="Ms. Sharma"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Class">
                  <Select
                    value={String(form.className)}
                    onChange={(v) => setForm({ ...form, className: v === "" ? "" : Number(v) })}
                  >
                    <option value="">Select</option>
                    {classes.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Date">
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(v) => setForm({ ...form, date: v })}
                  />
                </Field>
              </div>

              <Field label="Subject">
                <Select
                  value={form.subject}
                  onChange={(v) => setForm({ ...form, subject: v })}
                  disabled={!subjects.length}
                >
                  <option value="">
                    {subjects.length ? "Select subject" : "Select a class first"}
                  </option>
                  {subjects.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Chapter">
                <Select
                  value={form.chapter}
                  onChange={(v) => setForm({ ...form, chapter: v })}
                  disabled={!chapters.length}
                >
                  <option value="">
                    {chapters.length ? "Select chapter" : "Select a subject first"}
                  </option>
                  {chapters.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="mt-2 rounded-lg border border-hairline bg-background/40 p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  Question counts
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Counter
                    label="MCQ"
                    value={form.mcq}
                    onChange={(n) => setForm({ ...form, mcq: n })}
                  />
                  <Counter
                    label="Fill blanks"
                    value={form.fill_blank}
                    onChange={(n) => setForm({ ...form, fill_blank: n })}
                  />
                  <Counter
                    label="True / False"
                    value={form.true_false}
                    onChange={(n) => setForm({ ...form, true_false: n })}
                  />
                  <Counter
                    label="Subjective"
                    value={form.subjective}
                    onChange={(n) => setForm({ ...form, subjective: n })}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive-foreground">
                  {error}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={handlePreview}
                  disabled={loading}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {loading ? "Generating…" : "Preview Worksheet"}
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center rounded-md border border-hairline bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Download PDF
                </button>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center justify-center rounded-md border border-hairline px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Download uses your browser's print dialog — choose "Save as PDF" for a print-perfect
                copy.
              </p>
            </div>
          </div>

          {/* Preview */}
          <div
            id="preview"
            className="min-h-[600px] rounded-xl border border-hairline bg-card/30 p-4"
          >
            {result ? (
              <div className="overflow-visible rounded-lg">
                <WorksheetSheet meta={meta} data={result} />
              </div>
            ) : (
              <EmptyPreview />
            )}
          </div>
        </div>
      </section>

      {/* Print-only area */}
      {result && (
        <div className="print-area hidden">
          <WorksheetSheet meta={meta} data={result} />
        </div>
      )}

      {toast && (
        <div className="no-print fixed bottom-6 left-1/2 -translate-x-1/2 rounded-md border border-hairline bg-card px-4 py-2 text-sm shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

/* ---------------- presentational helpers ---------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-hairline bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-1 focus:ring-ring"
    />
  );
}

function Select({
  value,
  onChange,
  children,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-hairline bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-1 focus:ring-ring disabled:opacity-50"
    >
      {children}
    </select>
  );
}

function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="flex items-center rounded-md border border-hairline bg-input">
        <button
          type="button"
          onClick={() => onChange(Math.max(0, value - 1))}
          className="px-3 py-2 text-muted-foreground hover:text-foreground"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value || "0", 10)))}
          className="w-full bg-transparent text-center text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="px-3 py-2 text-muted-foreground hover:text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}

function EmptyPreview() {
  return (
    <div className="flex h-full min-h-[600px] items-center justify-center">
      <div className="max-w-sm text-center">
        <div className="mx-auto h-16 w-12 rounded-sm border border-hairline bg-background/60" />
        <p className="mt-6 font-display text-2xl">Your worksheet will appear here</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Configure the worksheet on the left, then click{" "}
          <span className="text-foreground">Preview Worksheet</span> to render the printable layout.
        </p>
      </div>
    </div>
  );
}
