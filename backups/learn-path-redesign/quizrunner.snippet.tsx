// Pass mark for a quiz lesson. Below this the lesson stays open on the path and the learner is asked to retake it.
export const PASS_MARK = 0.7

type QuizDraft = { index: number; picked: (number | null)[]; submitted: boolean[]; elapsed: number }

export function readQuizDraft(key?: string): QuizDraft | null {
  if (!key) return null
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as QuizDraft) : null
  } catch {
    return null
  }
}

export function clearQuizDraft(key?: string) {
  if (!key) return
  try {
    localStorage.removeItem(key)
  } catch {}
}

export function QuizRunner({
  onFinish,
  onExit,
  draftKey,
}: {
  onFinish: (result: QuizResult) => void
  onExit: () => void
  // Where unfinished answers are saved, so "Save and exit" can resume later.
  draftKey?: string
}) {
  const questions = questionBank
  const draft = useMemo(() => {
    const d = readQuizDraft(draftKey)
    return d && d.picked?.length === questions.length ? d : null
  }, [draftKey, questions.length])
  const [index, setIndex] = useState(draft?.index ?? 0)
  const [picked, setPicked] = useState<(number | null)[]>(() => draft?.picked ?? questions.map(() => null))
  const [submitted, setSubmitted] = useState<boolean[]>(() => draft?.submitted ?? questions.map(() => false))
  const [hint, setHint] = useState(false)
  const started = useRef(Date.now() - (draft?.elapsed ?? 0))
  const topRef = useRef<HTMLDivElement>(null)

  const q = questions[index]
  const choice = picked[index]
  const isSubmitted = submitted[index]
  const isCorrect = choice === q.answer
  const answered = submitted.filter(Boolean).length
  // Next question still to answer, going forward and wrapping round, so skipped ones come back at the end.
  const nextOpen = (from: number) => {
    for (let step = 1; step <= questions.length; step++) {
      const i = (from + step) % questions.length
      if (!submitted[i] && i !== from) return i
    }
    return null
  }
  const upcoming = nextOpen(index)
  const allDone = answered === questions.length

  // Keep a draft so leaving never loses answers.
  useEffect(() => {
    if (!draftKey) return
    try {
      localStorage.setItem(draftKey, JSON.stringify({ index, picked, submitted, elapsed: Date.now() - started.current }))
    } catch {}
  }, [draftKey, index, picked, submitted])

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start" })
    setHint(false)
  }, [index])

  const finish = () => {
    const correct = questions.filter((qq, i) => submitted[i] && picked[i] === qq.answer).length
    clearQuizDraft(draftKey)
    onFinish({
      correct,
      total: questions.length,
      minutes: Math.max(1, Math.round((Date.now() - started.current) / 60000)),
      answers: picked,
    })
  }

  const check = () => {
    if (choice === null) return setHint(true)
    setSubmitted((s) => s.map((v, i) => (i === index ? true : v)))
  }

  const advance = () => {
    if (allDone) return finish()
    const n = nextOpen(index)
    if (n !== null) setIndex(n)
  }

  const pick = (i: number) => {
    if (isSubmitted) return
    setHint(false)
    setPicked((p) => p.map((v, j) => (j === index ? i : v)))
  }

  // Keyboard: A to D (or 1 to 4) picks an answer, Enter checks or moves on.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      const pos = "abcd".indexOf(k) >= 0 ? "abcd".indexOf(k) : "1234".indexOf(k)
      if (pos >= 0 && pos < q.options.length) {
        e.preventDefault()
        pick(pos)
      } else if (e.key === "Enter" && !(t && t.tagName === "BUTTON")) {
        e.preventDefault()
        if (isSubmitted) advance()
        else check()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  })

  const kbd = `rounded-md border px-1.5 py-px text-11 leading-4 ${fontMedium}`

  return (
    <div ref={topRef} className="flex min-h-dvh-minus-64 scroll-mt-18 flex-col bg-slate-50 md:min-h-dvh-minus-72">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 pb-10 pt-6 md:pt-10">
        {/* Top row: leave (answers are kept), one segment per question, and the count. */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onExit}
            className={`flex shrink-0 items-center gap-1.5 rounded-lg py-1 pr-2 text-13 text-slate-600 transition hover:text-slate-900 ${fontMedium}`}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} strokeWidth={2} aria-hidden="true" />
            Save and exit
          </button>
          <ol className="flex min-w-0 flex-1 gap-1" aria-label="Questions">
            {questions.map((qq, i) => {
              const done = submitted[i]
              const right = done && picked[i] === qq.answer
              const now = i === index
              return (
                <li key={i} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Question ${i + 1}${done ? (right ? ", correct" : ", not correct") : ""}`}
                    aria-current={now ? "step" : undefined}
                    className={`block h-1.5 w-full rounded-full transition ${
                      done ? (right ? "bg-primary-700" : "bg-secondary-500") : now ? "bg-white ring-2 ring-primary-700" : "bg-slate-200 hover:bg-slate-300"
                    }`}
                  />
                </li>
              )
            })}
          </ol>
          <span className={`shrink-0 text-13 tabular-nums text-slate-600 ${fontMedium}`}>
            {index + 1} of {questions.length}
          </span>
        </div>

        <div key={index} className="fade-up flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-2">
            <span className={`text-xs uppercase tracking-wider text-primary-700 ${fontSemi}`}>Pick one answer</span>
            <h2 className={`m-0 text-xl leading-snug text-slate-900 md:text-2xl ${fontSemi}`}>{q.q}</h2>
          </div>

          <div role="radiogroup" aria-label="Answer options" className="flex flex-col gap-2.5">
            {q.options.map((opt, i) => {
              const selected = choice === i
              const showRight = isSubmitted && i === q.answer
              const showMine = isSubmitted && selected && !isCorrect
              const dim = isSubmitted && !showRight && !showMine
              return (
                <button
                  key={opt}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isSubmitted}
                  onClick={() => pick(i)}
                  className={`group flex w-full items-center gap-3.5 rounded-xl border px-4 py-3.5 text-left transition disabled:cursor-default ${
                    showRight
                      ? "border-primary-700 bg-primary-50"
                      : showMine
                        ? "border-secondary-500 bg-secondary-50"
                        : selected
                          ? "border-primary-700 bg-primary-50 ring-1 ring-primary-700"
                          : "border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-25"
                  } ${dim ? "opacity-55" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex size-7 shrink-0 items-center justify-center rounded-lg text-13 transition ${fontSemi} ${
                      showRight
                        ? "bg-primary-700 text-white"
                        : showMine
                          ? "bg-secondary-500 text-slate-900"
                          : selected
                            ? "bg-primary-700 text-white"
                            : "border border-slate-300 text-slate-600 group-hover:border-slate-500"
                    }`}
                  >
                    {letters[i]}
                  </span>
                  <span className={`min-w-0 flex-1 text-15 leading-6 ${selected || showRight ? `text-slate-900 ${fontMedium}` : `text-slate-700 ${fontRegular}`}`}>{opt}</span>
                  {showRight && (
                    <span className={`flex shrink-0 items-center gap-1 text-13 text-primary-700 ${fontSemi}`}>
                      <HugeiconsIcon icon={Tick02Icon} size={16} strokeWidth={2.2} aria-hidden="true" />
                      Right answer
                    </span>
                  )}
                  {showMine && <span className={`shrink-0 text-13 text-secondary-800 ${fontSemi}`}>Your answer</span>}
                </button>
              )
            })}
          </div>

          {isSubmitted && (
            <div className={`fade-up flex gap-3 rounded-xl px-4 py-4 ${isCorrect ? "bg-primary-50" : "bg-secondary-50"}`} role="status">
              <span
                aria-hidden="true"
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${isCorrect ? "bg-primary-700 text-white" : "bg-secondary-100 text-secondary-800"}`}
              >
                <HugeiconsIcon icon={isCorrect ? Tick02Icon : Idea01Icon} size={17} strokeWidth={2} />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <p className={`m-0 text-15 text-slate-900 ${fontSemi}`}>
                  {isCorrect ? "Correct" : `Not quite. The answer is ${letters[q.answer]}.`}
                </p>
                <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>{q.explain}</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-150 pt-5">
            <div className="min-h-5">
              {!isSubmitted && upcoming !== null && (
                <button type="button" onClick={() => setIndex(upcoming)} className={`text-sm text-slate-600 underline-offset-2 transition hover:text-slate-900 hover:underline ${fontMedium}`}>
                  Skip for now
                </button>
              )}
              {hint && <span className={`ml-3 text-sm text-secondary-800 ${fontMedium}`}>Pick an answer first</span>}
            </div>
            <button
              type="button"
              onClick={isSubmitted ? advance : check}
              className={`${buttonClass("primary", "lg")} group/go`}
            >
              {isSubmitted ? (allDone ? "See results" : "Continue") : "Check answer"}
              <span className={`${kbd} border-white/30 text-white/80`}>Enter</span>
            </button>
          </div>
        </div>

        <p className={`text-center text-xs text-slate-500 ${fontRegular}`}>
          Tip: press <span className={`${kbd} border-slate-300 text-slate-600`}>A</span> to <span className={`${kbd} border-slate-300 text-slate-600`}>D</span> to pick an answer. Your answers are saved as you go.
        </p>
      </div>
    </div>
  )
}
