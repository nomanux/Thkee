  const pct = result ? Math.round((result.correct / result.total) * 100) : 0
  const minutesEstimate = Math.max(1, Math.round(questions * 0.5))
  const verdict =
    pct >= 80
      ? { title: "Great work", body: "You have a strong grip on this chapter." }
      : pct >= 50
        ? { title: "Good effort", body: "Review the questions you missed, then try again." }
        : { title: "Keep practising", body: "Go back over the lessons in this chapter and retake the quiz." }
  const stats = result
    ? [
        { label: "Correct", value: result.correct, icon: CheckmarkCircle02Icon, tone: "text-primary-700" },
        { label: "Incorrect", value: result.total - result.correct, icon: CancelCircleIcon, tone: "text-red-600" },
        { label: "Questions", value: result.total, icon: HelpCircleIcon, tone: "text-slate-600" },
        { label: result.minutes === 1 ? "Minute" : "Minutes", value: result.minutes, icon: Clock01Icon, tone: "text-slate-600" },
      ]
    : []
  // Ring for the score: circumference of r=52 is about 326.7.
  const ring = 326.7

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      {/* Same light toolbar as the article reader, so every lesson type feels like one product. */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5 md:px-8">
        <span className={`flex items-center gap-1.5 text-13 text-slate-600 ${fontMedium}`}>
          <HugeiconsIcon icon={HelpCircleIcon} size={16} strokeWidth={1.8} className="text-primary-700" aria-hidden="true" />
          Quiz · {questions} questions
        </span>
        {result && <span className={`text-13 text-primary-700 ${fontRegular}`}>Completed</span>}
      </div>

      <div className="px-4 py-6 md:px-8 md:py-10">
        <div className="fade-up mx-auto max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {result ? (
            <div className="flex flex-col gap-8 p-6 md:p-10">
              <div className="flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
                <div className="relative flex size-32 shrink-0 items-center justify-center">
                  <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-slate-150)" strokeWidth="10" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={pct >= 50 ? "var(--color-primary-700)" : "var(--color-secondary-500)"}
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${(pct / 100) * ring} ${ring}`}
                      className="transition-all duration-700"
                    />
                  </svg>
                  <span className={`text-3xl tabular-nums text-slate-900 ${fontHeading}`}>{pct}%</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Your result</span>
                  <h2 className={`m-0 text-2xl text-slate-900 md:text-28 ${fontHeading}`}>{verdict.title}</h2>
                  <p className={`m-0 text-base leading-6 text-slate-600 ${fontRegular}`}>
                    You answered {result.correct} of {result.total} questions correctly. {verdict.body}
                  </p>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.label} className="flex flex-col gap-1 bg-white px-4 py-4">
                    <dt className={`flex items-center gap-1.5 text-13 text-slate-500 ${fontRegular}`}>
                      <HugeiconsIcon icon={s.icon} size={15} strokeWidth={1.8} className={s.tone} aria-hidden="true" />
                      {s.label}
                    </dt>
                    <dd className={`m-0 text-2xl tabular-nums text-slate-900 ${fontSemi}`}>{s.value}</dd>
                  </div>
                ))}
              </dl>

              <div className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 pt-6">
                <button type="button" onClick={onStart} className={buttonClass("secondary", "lg")}>
                  <HugeiconsIcon icon={ArrowReloadHorizontalIcon} size={17} strokeWidth={1.8} aria-hidden="true" />
                  Retake quiz
                </button>
                {onNext && (
                  <button type="button" onClick={onNext} className={`${buttonClass("primary", "lg")} group/nx`}>
                    Next lesson
                    <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={2} className="transition-transform group-hover/nx:translate-x-0.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-5">
              <div className="flex flex-col gap-6 p-6 md:col-span-3 md:p-10">
                <div className="flex flex-col gap-2">
                  <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Check your understanding</span>
                  <h2 dir="auto" className={`m-0 text-start text-2xl leading-tight text-slate-900 md:text-3xl ${fontHeading}`}>
                    {title}
                  </h2>
                  <p className={`m-0 text-base leading-6.5 text-slate-600 ${fontRegular}`}>
                    Answer each question, then see the right answer and a short explanation before you move on.
                  </p>
                </div>

                <ul className="flex flex-wrap gap-2">
                  {[
                    { icon: HelpCircleIcon, label: `${questions} questions` },
                    { icon: Clock01Icon, label: `About ${minutesEstimate} min` },
                    { icon: RepeatIcon, label: "Retake any time" },
                  ].map((f) => (
                    <li key={f.label} className={`flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-13 text-slate-700 ${fontMedium}`}>
                      <HugeiconsIcon icon={f.icon} size={15} strokeWidth={1.8} className="text-primary-700" aria-hidden="true" />
                      {f.label}
                    </li>
                  ))}
                </ul>

                {instructions && (instructions.html || instructions.text.trim()) && (
                  <div className="border-t border-slate-200 pt-5">
                    <p className={`m-0 text-xs uppercase tracking-wider text-slate-500 ${fontSemi}`}>Before you start</p>
                    <NoteBody note={instructions} className="mt-2 text-sm leading-6" tone="text-slate-700" />
                  </div>
                )}

                <div>
                  <button type="button" onClick={onStart} className={`${buttonClass("primary", "lg")} group/st`}>
                    Start quiz
                    <HugeiconsIcon icon={ArrowRight01Icon} size={17} strokeWidth={2} className="transition-transform group-hover/st:translate-x-0.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="hidden items-center justify-center border-l border-slate-200 bg-linear-135 from-primary-50 to-primary-200 md:col-span-2 md:flex">
                <img src="/illustrations/quiz-intro.svg" alt="" aria-hidden="true" className="w-full max-w-80" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
