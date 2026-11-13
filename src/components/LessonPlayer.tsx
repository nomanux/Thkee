import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowRight01Icon as ChevronRightIcon,
  CheckmarkCircle02Icon,
  DashboardSpeed02Icon,
  Flag02Icon,
  GoBackward10SecIcon,
  GoForward10SecIcon,
  HdIcon,
  InformationCircleIcon,
  MaximizeScreenIcon,
  MinimizeScreenIcon,
  NoteEditIcon,
  PauseIcon,
  PlayIcon,
  PlayCircleIcon,
  Settings02Icon,
  SidebarRightIcon,
  Tick02Icon,
  VolumeHighIcon,
  VolumeLowIcon,
  VolumeMute02Icon,
} from "@hugeicons/core-free-icons"
import type { Course } from "../data"
import { fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts"
import { CourseThumb } from "./Overlays"
import { buttonClass } from "./Button"

export const QUALITIES = ["Auto", "1080p", "720p", "480p", "360p"]
export const RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

type LessonLite = { key: string; title: string; kind: string; minutes: number }

const clock = (sec: number) =>
  `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`

function Icon({
  icon,
  size = 20,
  stroke = 1.8,
  className = "",
}: {
  icon: IconSvgElement
  size?: number
  stroke?: number
  className?: string
}) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={stroke} aria-hidden="true" className={`shrink-0 ${className}`} />
}

function CtrlButton({
  label,
  onClick,
  children,
  active = false,
  className = "",
}: {
  label: string
  onClick: () => void
  children: ReactNode
  active?: boolean
  className?: string
}) {
  return (
    <div className={`group/tip relative ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`flex size-9 items-center justify-center rounded-full transition hover:bg-white/15 ${
          active ? "text-secondary-500" : "text-white"
        }`}
      >
        {children}
      </button>
      <span
        className={`pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900/95 px-2 py-1 text-xs text-white opacity-0 transition group-hover/tip:opacity-100 ${fontMedium}`}
      >
        {label}
      </span>
    </div>
  )
}

type Flash = { id: number; icon: IconSvgElement; label?: string }
type MenuView = "main" | "quality" | "speed"

export default function LessonPlayer({
  course,
  current,
  prev,
  next,
  time,
  duration,
  playing,
  rate,
  autoplay,
  sidebar,
  done,
  setTime,
  setPlaying,
  setRate,
  setAutoplay,
  onPrev,
  onNext,
  onNote,
  onToggleSidebar,
  onCompleteReading,
  notify,
  chapters = [],
  goal,
  overlay,
}: {
  course: Course
  current: LessonLite
  prev?: LessonLite
  next?: LessonLite
  time: number
  duration: number
  playing: boolean
  rate: number
  autoplay: boolean
  sidebar: boolean
  done: boolean
  setTime: (t: number | ((t: number) => number)) => void
  setPlaying: (p: boolean | ((p: boolean) => boolean)) => void
  setRate: (r: number) => void
  setAutoplay: (a: boolean | ((a: boolean) => boolean)) => void
  onPrev: () => void
  onNext: () => void
  onNote: () => void
  onToggleSidebar: () => void
  onCompleteReading: () => void
  notify: (msg: string) => void
  chapters?: { start: number; end: number; title: string }[]
  goal?: string
  overlay?: ReactNode
}) {
  const isVideo = current.kind === "video"
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const seekRef = useRef<HTMLDivElement>(null)
  const idleTimer = useRef<number | undefined>(undefined)

  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [quality, setQuality] = useState("Auto")
  const [menu, setMenu] = useState<MenuView | null>(null)
  const [idle, setIdle] = useState(false)
  const [isFull, setIsFull] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  const [flash, setFlash] = useState<Flash | null>(null)

  const pct = duration ? Math.min(100, (time / duration) * 100) : 0
  const buffered = Math.min(100, pct + 12)
  const level = muted ? 0 : volume
  const hasOverlay = !!overlay
  const showUi = !hasOverlay && (!isVideo || !playing || !idle || menu !== null || dragging)
  const chapterAt = (sec: number) => chapters.findIndex((c) => sec >= c.start && sec < c.end)
  const chapterNow = chapters.length ? Math.max(0, chapterAt(Math.min(time, duration - 0.01))) : -1
  const hoverChapter = hover !== null && chapters.length ? chapters.at(Math.max(0, chapterAt(hover * duration))) : undefined

  const ping = useCallback((icon: IconSvgElement, label?: string) => {
    setFlash({ id: Date.now(), icon, label })
  }, [])

  useEffect(() => {
    if (!flash) return
    const t = window.setTimeout(() => setFlash(null), 650)
    return () => window.clearTimeout(t)
  }, [flash])

  const wake = useCallback(() => {
    setIdle(false)
    window.clearTimeout(idleTimer.current)
    idleTimer.current = window.setTimeout(() => setIdle(true), 2600)
  }, [])

  useEffect(() => () => window.clearTimeout(idleTimer.current), [])

  useEffect(() => {
    const onChange = () => setIsFull(document.fullscreenElement === rootRef.current)
    document.addEventListener("fullscreenchange", onChange)
    return () => document.removeEventListener("fullscreenchange", onChange)
  }, [])

  useEffect(() => {
    if (!menu) return
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null)
    }
    document.addEventListener("mousedown", close)
    return () => document.removeEventListener("mousedown", close)
  }, [menu])

  useEffect(() => setMenu(null), [current.key])

  const togglePlay = useCallback(() => {
    if (!isVideo) return
    ping(playing ? PauseIcon : PlayIcon)
    setPlaying(!playing)
    wake()
  }, [isVideo, ping, playing, setPlaying, wake])

  const skip = useCallback(
    (by: number) => {
      if (!isVideo) return
      setTime((t) => Math.max(0, Math.min(duration, t + by)))
      ping(by < 0 ? GoBackward10SecIcon : GoForward10SecIcon, `${by > 0 ? "+" : ""}${by}s`)
      wake()
    },
    [duration, isVideo, ping, setTime, wake],
  )

  const toggleMute = useCallback(() => {
    ping(muted ? VolumeHighIcon : VolumeMute02Icon)
    setMuted(!muted)
    if (volume === 0) setVolume(1)
  }, [muted, ping, volume])

  const fullscreen = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.().catch(() => notify("Fullscreen isn’t available here"))
  }, [notify])

  useEffect(() => {
    if (!isVideo || hasOverlay) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(el.tagName))) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === " " || k === "k") (e.preventDefault(), togglePlay())
      else if (k === "arrowleft" || k === "j") (e.preventDefault(), skip(-10))
      else if (k === "arrowright" || k === "l") (e.preventDefault(), skip(10))
      else if (k === "m") toggleMute()
      else if (k === "f") fullscreen()
      else return
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [fullscreen, hasOverlay, isVideo, skip, toggleMute, togglePlay])

  const fractionAt = (clientX: number) => {
    const rect = seekRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  const onSeekDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isVideo) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    setTime(fractionAt(e.clientX) * duration)
  }
  const onSeekMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const f = fractionAt(e.clientX)
    setHover(f)
    if (dragging) setTime(f * duration)
  }
  const onSeekUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  const volumeIcon = level === 0 ? VolumeMute02Icon : level < 0.5 ? VolumeLowIcon : VolumeHighIcon

  const menuRow = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm text-white transition hover:bg-white/10"

  return (
    <div
      ref={rootRef}
      onMouseMove={wake}
      onMouseLeave={() => playing && setIdle(true)}
      className={`group/player relative w-full select-none overflow-hidden bg-slate-950 ${showUi ? "" : "cursor-none"}`}
    >
      <div className={`relative mx-auto aspect-video w-full ${isFull ? "h-full max-w-none" : "max-w-player"}`}>
        {isVideo ? (
          <>
            <CourseThumb
              course={course}
              showTitle={false}
              className="absolute inset-0 size-full [&>img:last-of-type]:object-cover [&>span]:hidden"
            />
            <button
              type="button"
              aria-label={playing ? "Pause" : "Play"}
              onClick={togglePlay}
              onDoubleClick={fullscreen}
              className={`absolute inset-0 bg-slate-900 transition-opacity duration-300 ${playing ? "opacity-0" : "opacity-40"}`}
            />

            {!playing && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Play lesson"
                className="absolute inset-0 m-auto flex size-20 items-center justify-center rounded-full bg-white/20 text-white ring-1 ring-white/30 backdrop-blur-md transition hover:scale-105 hover:bg-white/30"
              >
                <span className="flex size-16 items-center justify-center rounded-full bg-white text-slate-900">
                  <Icon icon={PlayIcon} size={28} className="ml-1 fill-current" />
                </span>
              </button>
            )}

            {flash && (
              <span
                key={flash.id}
                className="player-flash pointer-events-none absolute inset-0 m-auto flex size-18 flex-col items-center justify-center gap-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm"
              >
                <Icon icon={flash.icon} size={28} className={flash.icon === PlayIcon || flash.icon === PauseIcon ? "fill-current" : ""} />
                {flash.label && <span className={`text-11 tabular-nums ${fontSemi}`}>{flash.label}</span>}
              </span>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 to-primary-700 px-6 text-center text-white">
            <span className={`rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-wider ${fontSemi}`}>Reading</span>
            <p className={`max-w-xl text-22 leading-snug md:text-3xl ${fontHeading}`}>{current.title}</p>
            <p className={`max-w-lg text-sm text-white/75 ${fontRegular}`}>
              {`A ${current.minutes}-minute read that sums up the key ideas from this section, with examples you can reuse.`}
            </p>
            <button
              type="button"
              onClick={onCompleteReading}
              className={`${buttonClass("yellow", "lg")}`}
            >
              {done ? "Completed ✓ — Next lesson" : "Mark as complete"}
            </button>
          </div>
        )}

        {isVideo && goal && time < 8 && !overlay && (
          <span className={`fade-up pointer-events-none absolute left-3 top-3 z-10 flex max-w-11/12 items-center gap-2 rounded-full bg-slate-900/70 px-3.5 py-2 text-xs text-white backdrop-blur-md md:left-5 md:top-5 md:text-13 ${fontMedium}`}>
            <span className="size-2 shrink-0 rounded-full bg-secondary-500" />
            <span className="truncate">{goal}</span>
          </span>
        )}

        {overlay}

        {/* Prev / next */}
        {prev && (
          <button
            type="button"
            onClick={onPrev}
            aria-label={`Previous: ${prev.title}`}
            className={`group/prev absolute left-3 top-1/2 flex h-10 -translate-y-1/2 items-center rounded-full bg-black/40 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/70 ${
              showUi ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <span className="flex size-10 items-center justify-center">
              <Icon icon={ArrowLeft01Icon} size={20} stroke={2} />
            </span>
            <span className={`hidden max-w-64 truncate pr-4 text-sm group-hover/prev:block ${fontRegular}`}>{prev.title}</span>
          </button>
        )}
        {next && (
          <button
            type="button"
            onClick={onNext}
            aria-label={`Next: ${next.title}`}
            className={`group/next absolute right-3 top-1/2 flex h-10 -translate-y-1/2 flex-row-reverse items-center rounded-full bg-black/40 text-white ring-1 ring-white/15 backdrop-blur-md transition hover:bg-black/70 ${
              showUi ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <span className="flex size-10 items-center justify-center">
              <Icon icon={ArrowRight01Icon} size={20} stroke={2} />
            </span>
            <span className={`hidden max-w-64 truncate pl-4 text-sm group-hover/next:block ${fontRegular}`}>{next.title}</span>
          </button>
        )}

        {/* Bottom controls overlay */}
        {isVideo && (
          <div
            className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2 pt-14 transition-opacity duration-300 md:px-5 ${
              showUi ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            {chapterNow >= 0 && (
              <p className={`mb-1 flex items-center gap-1.5 text-xs text-white/80 ${fontMedium}`}>
                Chapter {chapterNow + 1} of {chapters.length}
                <span className="text-white/40" aria-hidden="true">/</span>
                <span className="text-white">{chapters.at(chapterNow)?.title}</span>
              </p>
            )}
            {/* Seek bar */}
            <div
              ref={seekRef}
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(time)}
              aria-valuetext={`${clock(time)} of ${clock(duration)}`}
              onPointerDown={onSeekDown}
              onPointerMove={onSeekMove}
              onPointerUp={onSeekUp}
              onPointerLeave={() => setHover(null)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") (e.preventDefault(), e.stopPropagation(), skip(-5))
                if (e.key === "ArrowRight") (e.preventDefault(), e.stopPropagation(), skip(5))
              }}
              className="group/seek relative flex h-4 cursor-pointer touch-none items-center outline-none"
            >
              <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/25 transition-all group-hover/seek:h-1.5 group-focus-visible/seek:h-1.5">
                <div className="absolute inset-y-0 left-0 bg-white/35" style={{ width: `${buffered}%` }} />
                {hover !== null && (
                  <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${hover * 100}%` }} />
                )}
                <div className="absolute inset-y-0 left-0 rounded-full bg-secondary-500" style={{ width: `${pct}%` }} />
                {chapters.slice(1).map((c) => (
                  <span key={c.start} className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-black/70" style={{ left: `${(c.start / duration) * 100}%` }} />
                ))}
              </div>
              <span
                className={`absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary-500 shadow-md ring-2 ring-white transition-transform ${
                  dragging ? "scale-110" : "scale-0 group-hover/seek:scale-100 group-focus-visible/seek:scale-100"
                }`}
                style={{ left: `${pct}%` }}
              />
              {hover !== null && (
                <span
                  className={`pointer-events-none absolute bottom-full mb-2 -translate-x-1/2 rounded-md bg-slate-900/95 px-2 py-1 text-xs tabular-nums text-white ${fontSemi}`}
                  style={{ left: `${hover * 100}%` }}
                >
                  {hoverChapter ? <span className="mr-1.5 text-white/70">{hoverChapter.title}</span> : null}
                  {clock(hover * duration)}
                </span>
              )}
            </div>

            {/* Buttons row */}
            <div className={`mt-1 flex items-center gap-0.5 text-white md:gap-1 ${fontRegular}`}>
              <CtrlButton label={playing ? "Pause (k)" : "Play (k)"} onClick={togglePlay}>
                <Icon icon={playing ? PauseIcon : PlayIcon} size={22} className="fill-current" />
              </CtrlButton>
              <CtrlButton label="Back 10s (j)" onClick={() => skip(-10)}>
                <Icon icon={GoBackward10SecIcon} />
              </CtrlButton>
              <CtrlButton label="Forward 10s (l)" onClick={() => skip(10)}>
                <Icon icon={GoForward10SecIcon} />
              </CtrlButton>

              <div className="group/vol flex items-center">
                <CtrlButton label={level === 0 ? "Unmute (m)" : "Mute (m)"} onClick={toggleMute}>
                  <Icon icon={volumeIcon} />
                </CtrlButton>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={level}
                  aria-label="Volume"
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    setVolume(v)
                    setMuted(v === 0)
                  }}
                  className="player-range w-0 cursor-pointer opacity-0 transition-all duration-200 focus:w-20 focus:opacity-100 group-hover/vol:ml-1 group-hover/vol:w-20 group-hover/vol:opacity-100"
                  style={{ "--fill": `${level * 100}%` } as CSSProperties}
                />
              </div>

              <span className={`ml-2 text-13 tabular-nums text-white/90 ${fontMedium}`}>
                {clock(time)}
                <span className="mx-1 text-white/50">/</span>
                <span className="text-white/70">{clock(duration)}</span>
              </span>

              <div className="ml-auto flex items-center gap-0.5 md:gap-1">
                <CtrlButton label="Add a note" onClick={onNote} className="hidden sm:block">
                  <Icon icon={NoteEditIcon} />
                </CtrlButton>

                <div ref={menuRef} className="relative">
                  <CtrlButton
                    label="Settings"
                    active={menu !== null}
                    onClick={() => setMenu((m) => (m ? null : "main"))}
                  >
                    <span className="relative">
                      <Icon icon={Settings02Icon} className={`transition-transform duration-300 ${menu ? "rotate-90" : ""}`} />
                      {quality !== "Auto" && quality !== "480p" && quality !== "360p" && (
                        <span className={`absolute -right-2 -top-1.5 rounded-sm bg-secondary-500 px-0.5 text-10 leading-tight text-slate-900 ${fontSemi}`}>HD</span>
                      )}
                    </span>
                  </CtrlButton>

                  {menu && (
                    <div className="pop-in absolute bottom-full right-0 mb-3 w-64 overflow-hidden rounded-xl bg-slate-900/95 p-1.5 shadow-popover ring-1 ring-white/10 backdrop-blur-xl">
                      {menu === "main" && (
                        <>
                          <button type="button" onClick={() => setMenu("quality")} className={menuRow}>
                            <Icon icon={HdIcon} size={18} className="text-white/70" />
                            <span className="flex-1">Quality</span>
                            <span className="text-13 text-white/60">{quality}</span>
                            <Icon icon={ChevronRightIcon} size={16} className="text-white/50" />
                          </button>
                          <button type="button" onClick={() => setMenu("speed")} className={menuRow}>
                            <Icon icon={DashboardSpeed02Icon} size={18} className="text-white/70" />
                            <span className="flex-1">Playback speed</span>
                            <span className="text-13 text-white/60">{rate === 1 ? "Normal" : `${rate}x`}</span>
                            <Icon icon={ChevronRightIcon} size={16} className="text-white/50" />
                          </button>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={autoplay}
                            onClick={() => setAutoplay((a) => !a)}
                            className={menuRow}
                          >
                            <Icon icon={PlayCircleIcon} size={18} className="text-white/70" />
                            <span className="flex-1">Autoplay next</span>
                            <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${autoplay ? "bg-secondary-500" : "bg-white/25"}`}>
                              <span className={`size-4 rounded-full bg-white shadow-sm transition ${autoplay ? "translate-x-4" : ""}`} />
                            </span>
                          </button>
                          <div className="my-1 h-px bg-white/10" />
                          <button
                            type="button"
                            onClick={() => (setMenu(null), notify(`${current.title} · ${current.minutes} min · ${quality}`))}
                            className={menuRow}
                          >
                            <Icon icon={InformationCircleIcon} size={18} className="text-white/70" />
                            Content information
                          </button>
                          <button
                            type="button"
                            onClick={() => (setMenu(null), notify("Thanks — our team will review this lesson"))}
                            className={menuRow}
                          >
                            <Icon icon={Flag02Icon} size={18} className="text-white/70" />
                            Report an issue
                          </button>
                        </>
                      )}

                      {menu !== "main" && (
                        <>
                          <button
                            type="button"
                            onClick={() => setMenu("main")}
                            className={`${menuRow} border-b border-white/10 rounded-b-none ${fontSemi}`}
                          >
                            <Icon icon={ArrowLeft01Icon} size={18} />
                            {menu === "quality" ? "Quality" : "Playback speed"}
                          </button>
                          <div className="mt-1 max-h-64 overflow-y-auto scrollbar-thin">
                            {(menu === "quality" ? QUALITIES : RATES).map((opt) => {
                              const selected = menu === "quality" ? quality === opt : rate === opt
                              const label = menu === "quality" ? String(opt) : opt === 1 ? "Normal" : `${opt}x`
                              return (
                                <button
                                  key={String(opt)}
                                  type="button"
                                  onClick={() => {
                                    if (menu === "quality") setQuality(String(opt))
                                    else setRate(Number(opt))
                                    setMenu("main")
                                  }}
                                  className={`${menuRow} ${selected ? fontSemi : ""}`}
                                >
                                  <span className="flex size-4.5 items-center justify-center">
                                    {selected && <Icon icon={Tick02Icon} size={18} stroke={2.2} className="text-secondary-500" />}
                                  </span>
                                  {label}
                                </button>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                <CtrlButton
                  label={sidebar ? "Hide course content" : "Show course content"}
                  onClick={onToggleSidebar}
                  active={!sidebar}
                  className="hidden lg:block"
                >
                  <Icon icon={SidebarRightIcon} />
                </CtrlButton>
                <CtrlButton label={isFull ? "Exit fullscreen (f)" : "Fullscreen (f)"} onClick={fullscreen}>
                  <Icon icon={isFull ? MinimizeScreenIcon : MaximizeScreenIcon} />
                </CtrlButton>
              </div>
            </div>
          </div>
        )}

        {/* Thin progress line when controls are hidden */}
        {isVideo && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-0.5 bg-white/20 transition-opacity duration-300 ${
              showUi ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="h-full bg-secondary-500" style={{ width: `${pct}%` }} />
          </div>
        )}

        {!isVideo && done && (
          <span className="absolute right-4 top-4 flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs text-white backdrop-blur-md">
            <Icon icon={CheckmarkCircle02Icon} size={14} /> Completed
          </span>
        )}
      </div>
    </div>
  )
}
