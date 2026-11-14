// The course outline as a path: one stop per chapter, the current chapter opened with its lessons,
// and the certificate as the last stop. Replaces the classic "Course content" checklist.
function PathRail({
  sections,
  flat,
  done,
  current,
  playing,
  onOpen,
  onCertificate,
}: {
  sections: { title: string }[];
  flat: FlatLesson[];
  done: string[];
  current: FlatLesson;
  playing: boolean;
  onOpen: (lesson: FlatLesson) => void;
  onCertificate: () => void;
}) {
  const [open, setOpen] = useState<number | null>(current.section);
  useEffect(() => setOpen(current.section), [current.section]);

  const chapterLessons = sections.map((_, si) => flat.filter((l) => l.section === si));
  const chapterDone = chapterLessons.map((items) => items.length > 0 && items.every((l) => done.includes(l.key)));
  const chaptersFinished = chapterDone.filter(Boolean).length;
  const allDone = done.length >= flat.length;
  const cleanTitle = (t: string) => t.replace(/^\d+\.\s*/, "");
  const minutesOf = (items: FlatLesson[]) => {
    const m = items.reduce((sum, l) => sum + (l.kind === "video" || l.kind === "article" ? l.minutes : 0), 0);
    return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-1 border-b border-slate-200 px-5 pb-4 pt-5">
        <span className={`text-xs uppercase tracking-wider text-slate-500 ${fontSemi}`}>Your path</span>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className={`m-0 text-lg text-slate-900 ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            {chaptersFinished} of {sections.length} chapters
          </h2>
          <span className={`text-13 tabular-nums text-slate-500 ${fontRegular}`}>
            {done.length}/{flat.length} lessons
          </span>
        </div>
      </div>

      <ol className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {sections.map((s, si) => {
          const items = chapterLessons[si];
          const finished = chapterDone[si];
          const isCurrent = current.section === si;
          const expanded = open === si;
          const count = items.filter((l) => done.includes(l.key)).length;
          return (
            <li key={si} className="relative pb-2">
              {/* Connector to the next stop: solid once this chapter is finished, dashed while it is still ahead. */}
              <span
                aria-hidden="true"
                className={`absolute bottom-0 left-3.5 top-9 border-l-2 ${finished ? "border-primary-700" : "border-dashed border-slate-300"}`}
              />
              <button
                type="button"
                onClick={() => setOpen(expanded ? null : si)}
                aria-expanded={expanded}
                className="group relative flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-11 tabular-nums ${fontSemi} ${
                    finished
                      ? "bg-primary-700 text-white"
                      : isCurrent
                        ? "bg-white text-secondary-800 ring-2 ring-secondary-500"
                        : "bg-white text-slate-500 ring-1 ring-slate-300"
                  }`}
                >
                  {finished ? (
                    <Svg className="size-3.5" stroke={3}>
                      <path d="M5 12l5 5 9-10" />
                    </Svg>
                  ) : (
                    si + 1
                  )}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span
                    dir="auto"
                    className={`text-start text-sm leading-snug transition-colors group-hover:text-primary-800 ${isCurrent ? `text-slate-900 ${fontSemi}` : `text-slate-700 ${fontMedium}`}`}
                  >
                    {cleanTitle(s.title)}
                  </span>
                  <span className={`text-xs tabular-nums text-slate-500 ${fontRegular}`}>
                    {finished ? "Finished" : `${count}/${items.length} lessons`} · {minutesOf(items)}
                  </span>
                </span>
                <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition group-hover:bg-slate-100">
                  <Svg className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} stroke={2.2}>
                    <path d="M6 9l6 6 6-6" />
                  </Svg>
                </span>
              </button>

              {expanded && (
                <ul
                  className={`fade-up relative ml-9 mt-1 flex flex-col gap-0.5 rounded-xl p-1.5 ${isCurrent ? "bg-secondary-50 ring-1 ring-inset ring-secondary-200" : "bg-slate-25 ring-1 ring-inset ring-slate-150"}`}
                >
                  {items.map((l) => {
                    const isDone = done.includes(l.key);
                    const isNow = l.key === current.key;
                    return (
                      <li key={l.key}>
                        <button
                          type="button"
                          onClick={() => onOpen(l)}
                          aria-current={isNow ? "step" : undefined}
                          className={`flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition ${isNow ? "bg-white shadow-sm" : "hover:bg-white/70"}`}
                        >
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 flex size-4.5 shrink-0 items-center justify-center rounded-full ${
                              isDone ? "bg-primary-100 text-primary-700" : isNow ? "bg-secondary-500 text-slate-900" : "text-slate-500"
                            }`}
                          >
                            {isDone ? (
                              <Svg className="size-3" stroke={3}>
                                <path d="M5 12l5 5 9-10" />
                              </Svg>
                            ) : isNow ? (
                              <Svg className="size-2.5" stroke={0}>
                                <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
                              </Svg>
                            ) : (
                              <KindIcon kind={l.kind} className="size-3.5" />
                            )}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span
                              dir="auto"
                              className={`text-start text-13 leading-snug ${isNow ? `text-slate-900 ${fontSemi}` : isDone ? `text-slate-600 ${fontRegular}` : `text-slate-800 ${fontRegular}`}`}
                            >
                              {l.title}
                            </span>
                            <span className={`text-xs text-slate-500 ${fontRegular}`}>
                              {isNow ? (
                                <span className={`text-secondary-800 ${fontSemi}`}>{playing ? "Playing now" : "You are here"}</span>
                              ) : (
                                `${kindLabel[l.kind]} · ${lessonLength(l)}`
                              )}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}

        <li className="relative">
          <button type="button" onClick={onCertificate} className="group flex w-full items-start gap-3 rounded-xl px-1 py-1.5 text-left">
            <span
              aria-hidden="true"
              className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg ${allDone ? "bg-secondary-500 text-slate-900" : "bg-slate-100 text-slate-500"}`}
            >
              <Svg className="size-3.5" stroke={2}>
                <circle cx="12" cy="9" r="6" />
                <path d="M8.5 14L7 21l5-3 5 3-1.5-7" />
              </Svg>
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className={`text-sm text-slate-900 transition-colors group-hover:text-primary-800 ${fontSemi}`}>Certificate</span>
              <span className={`text-xs text-slate-500 ${fontRegular}`}>
                {allDone ? "Ready to download" : `Unlocks after ${flat.length - done.length} more lessons`}
              </span>
            </span>
          </button>
        </li>
      </ol>
    </div>
  );
}

