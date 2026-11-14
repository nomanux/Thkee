              {/* Two views keep the result short: the summary first, the full answer review one click away. */}
              <div role="tablist" aria-label="Result views" className="flex gap-1 border-b border-slate-200">
                {[
                  { id: "overview" as const, label: "Overview" },
                  { id: "answers" as const, label: `Review answers${missedCount ? ` · ${missedCount} missed` : ""}` },
                ].map((t) => {
                  const on = tab === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      onClick={() => setTab(t.id)}
                      className={`relative -mb-px border-b-2 px-3 pb-3 pt-1 text-15 transition ${on ? `border-primary-700 text-slate-900 ${fontSemi}` : `border-transparent text-slate-500 hover:text-slate-900 ${fontMedium}`}`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>

              {tab === "overview" ? (
                <>
                  <OVERVIEW_GRID />
                  {missedCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab("answers")}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-5 py-4 text-left transition hover:border-primary-300 hover:bg-primary-50"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className={`text-15 text-slate-900 ${fontSemi}`}>See where you went wrong</span>
                        <span className={`text-sm text-slate-600 ${fontRegular}`}>
                          {missedCount} {missedCount === 1 ? "question" : "questions"} with the right answer and why.
                        </span>
                      </span>
                      <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} className="shrink-0 text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-primary-700" aria-hidden="true" />
                    </button>
                  )}
                </>
              ) : (
                result.answers && (
                  <section className="flex flex-col gap-5" aria-label="Answers">
                    {/* At a glance: one tile per question, coloured by outcome. Click to jump to it. */}
                    <div className="flex flex-col gap-3">
                      <ol className="grid grid-cols-8 gap-1.5 sm:grid-cols-15" aria-label="Every question">
                        {questionBank.map((qq, i) => {
                          const mine = result.answers![i]
                          const state = mine === null || mine === undefined ? "none" : mine === qq.answer ? "right" : "wrong"
                          return (
                            <li key={i}>
                              <a
                                href={`#quiz-review-${i}`}
                                onClick={(e) => {
                                  e.preventDefault()
                                  if (state === "right" && onlyMissed) setOnlyMissed(false)
                                  setTimeout(() => document.getElementById(`quiz-review-${i}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0)
                                }}
                                aria-label={`Question ${i + 1}: ${state === "right" ? "correct" : state === "wrong" ? "wrong" : "not answered"}`}
                                className={`flex h-9 items-center justify-center gap-0.5 rounded-lg text-13 tabular-nums transition ${fontSemi} ${
                                  state === "right"
                                    ? "bg-primary-700 text-white hover:bg-primary-800"
                                    : state === "wrong"
                                      ? "bg-secondary-100 text-secondary-900 ring-1 ring-inset ring-secondary-500 hover:bg-secondary-200"
                                      : "border border-dashed border-slate-300 text-slate-500 hover:border-slate-500"
                                }`}
                              >
                                {i + 1}
                              </a>
                            </li>
                          )
                        })}
                      </ol>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 ${fontRegular}`}>
                          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary-700" />Correct ({result.correct})</span>
                          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-secondary-100 ring-1 ring-inset ring-secondary-500" />Wrong ({wrongCount})</span>
                          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm border border-dashed border-slate-400" />Not answered ({skippedCount})</span>
                        </div>
                        <div className="flex rounded-lg border border-slate-200 p-0.5" role="group" aria-label="Show">
                          {[
                            { label: "Missed", on: onlyMissed },
                            { label: "All", on: !onlyMissed },
                          ].map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              aria-pressed={b.on}
                              onClick={() => setOnlyMissed(b.label === "Missed")}
                              className={`rounded-md px-3 py-1 text-13 transition ${b.on ? `bg-slate-900 text-white ${fontSemi}` : `text-slate-600 hover:text-slate-900 ${fontMedium}`}`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {review.length > 0 ? (
                      <ol className="flex flex-col gap-4">
                        {review.map(({ qq, i, mine }) => {
                          const none = mine === null || mine === undefined
                          const right = mine === qq.answer
                          return (
                            <li key={i} id={`quiz-review-${i}`} className="scroll-mt-24 rounded-xl border border-slate-200 p-5">
                              <div className="flex items-start gap-3">
                                <span
                                  aria-hidden="true"
                                  className={`flex size-7 shrink-0 items-center justify-center rounded-full ${right ? "bg-primary-700 text-white" : none ? "bg-slate-100 text-slate-500" : "bg-secondary-500 text-slate-900"}`}
                                >
                                  <HugeiconsIcon icon={right ? Tick02Icon : none ? MinusSignIcon : Cancel01Icon} size={15} strokeWidth={2.4} />
                                </span>
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                  <span className={`text-xs uppercase tracking-wider ${right ? "text-primary-700" : none ? "text-slate-500" : "text-secondary-800"} ${fontSemi}`}>
                                    Question {i + 1} · {right ? "Correct" : none ? "Not answered" : "Wrong"}
                                  </span>
                                  <p className={`m-0 text-base leading-6 text-slate-900 ${fontSemi}`}>{qq.q}</p>
                                </div>
                              </div>
                              <ul className="mt-4 flex flex-col gap-2 sm:pl-10">
                                {qq.options.map((opt, oi) => {
                                  const isRight = oi === qq.answer
                                  const isMine = oi === mine
                                  return (
                                    <li
                                      key={oi}
                                      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
                                        isRight ? "border-primary-700 bg-primary-50" : isMine ? "border-secondary-500 bg-secondary-50" : "border-slate-150 text-slate-500"
                                      }`}
                                    >
                                      <span
                                        aria-hidden="true"
                                        className={`flex size-6 shrink-0 items-center justify-center rounded-md text-xs ${fontSemi} ${
                                          isRight ? "bg-primary-700 text-white" : isMine ? "bg-secondary-500 text-slate-900" : "border border-slate-200 text-slate-500"
                                        }`}
                                      >
                                        {letters[oi]}
                                      </span>
                                      <span className={`min-w-0 flex-1 text-sm leading-5 ${isRight || isMine ? `text-slate-900 ${fontMedium}` : fontRegular}`}>{opt}</span>
                                      {isMine && (
                                        <span
                                          className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs ${fontSemi} ${isRight ? "bg-primary-700 text-white" : "bg-secondary-500 text-slate-900"}`}
                                        >
                                          <HugeiconsIcon icon={UserIcon} size={12} strokeWidth={2.2} aria-hidden="true" />
                                          Your answer
                                        </span>
                                      )}
                                      {isRight && !isMine && (
                                        <span className={`flex shrink-0 items-center gap-1 text-xs text-primary-700 ${fontSemi}`}>
                                          <HugeiconsIcon icon={Tick02Icon} size={14} strokeWidth={2.4} aria-hidden="true" />
                                          Right answer
                                        </span>
                                      )}
                                    </li>
                                  )
                                })}
                              </ul>
                              <div className="mt-3 flex gap-2.5 rounded-lg bg-slate-50 px-3 py-3 sm:ml-10">
                                <HugeiconsIcon icon={Idea01Icon} size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-secondary-700" aria-hidden="true" />
                                <p className={`m-0 text-sm leading-6 text-slate-600 ${fontRegular}`}>{qq.explain}</p>
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    ) : (
                      <p className={`m-0 rounded-xl bg-primary-50 px-4 py-3 text-sm text-primary-800 ${fontMedium}`}>You answered every question correctly.</p>
                    )}
                  </section>
                )
              )}

