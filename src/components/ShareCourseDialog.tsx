import { useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, Facebook01Icon, Linkedin01Icon, Mail01Icon, NewTwitterIcon, Share08Icon, TelegramIcon, Tick02Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import type { Course } from "../data";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice } from "../store";
import { CourseThumb, Shell } from "./Overlays";

// Share sheet for a course: a preview of what gets shared, one-tap apps, and a link to copy.
export default function ShareCourseDialog({ course, url = window.location.href, onClose }: { course: Course; url?: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = `${course.title} by ${course.instructor} on Thkee`;
  const e = encodeURIComponent;
  // WhatsApp first: it is the most used way to share links in Saudi Arabia.
  const targets: { name: string; icon: IconSvgElement; href: string; tone: string }[] = [
    { name: "WhatsApp", icon: WhatsappIcon, href: `https://wa.me/?text=${e(`${text} ${url}`)}`, tone: "bg-primary-200 text-green-600 group-hover:bg-green-600" },
    { name: "X", icon: NewTwitterIcon, href: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`, tone: "bg-slate-150 text-slate-900 group-hover:bg-slate-900" },
    { name: "LinkedIn", icon: Linkedin01Icon, href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, tone: "bg-slate-150 text-linkedin group-hover:bg-linkedin" },
    { name: "Facebook", icon: Facebook01Icon, href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`, tone: "bg-indigo-50 text-facebook group-hover:bg-facebook" },
    { name: "Telegram", icon: TelegramIcon, href: `https://t.me/share/url?url=${e(url)}&text=${e(text)}`, tone: "bg-blue-50 text-telegram group-hover:bg-telegram" },
    { name: "Email", icon: Mail01Icon, href: `mailto:?subject=${e(course.title)}&body=${e(`${text}\n${url}`)}`, tone: "bg-orange-50 text-orange-700 group-hover:bg-orange-600" },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Older browsers: copy through a temporary, off-screen text box.
      const field = document.createElement("textarea");
      field.value = url;
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;

  return (
    <Shell title="Share this course" onClose={onClose} width="max-w-115" hideHeader>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <h2 className={`m-0 text-17 leading-6 text-slate-900 ${fontSemi}`}>Share this course</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-150 hover:text-slate-900">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* What people will see */}
        <div className="mx-5 mt-3 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-25 p-2.5">
          <div className="w-22 shrink-0 overflow-hidden rounded-xl">
            <CourseThumb course={course} showTitle={false} className="aspect-video" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`m-0 line-clamp-2 text-sm leading-4.75 text-slate-900 ${fontSemi}`}>{course.title}</p>
            <p className={`m-0 mt-0.5 truncate text-xs leading-4 text-slate-500 ${fontRegular}`}>
              {course.instructor} · <span className="text-secondary-600">★</span> {course.rating.toFixed(1)}
            </p>
            <p className={`m-0 mt-1 text-13 leading-4 text-slate-900 ${fontSemi}`}>{formatPrice(course.price)}</p>
          </div>
        </div>

        {/* One tap to each app */}
        <p className={`m-0 mt-5 px-5 text-xs uppercase tracking-label text-slate-500 ${fontSemi}`}>Share to</p>
        <ul className="mt-3 grid grid-cols-6 gap-1 px-3">
          {targets.map((t) => (
            <li key={t.name}>
              <a href={t.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-1.5 rounded-xl py-1.5 transition hover:bg-slate-25 focus-visible:bg-slate-25">
                <span className={`flex size-11 items-center justify-center rounded-full transition duration-200 group-hover:-translate-y-0.5 group-hover:text-white ${t.tone}`}>
                  <HugeiconsIcon icon={t.icon} size={20} strokeWidth={1.8} />
                </span>
                <span className={`text-11 leading-3.5 text-slate-600 ${fontMedium}`}>{t.name}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Link to copy */}
        <div className="mt-5 border-t border-slate-150 px-5 pb-5 pt-4">
          <p id="share-link-label" className={`m-0 text-xs uppercase tracking-label text-slate-500 ${fontSemi}`}>
            Course link
          </p>
          <div className={`mt-2 flex h-11 items-center gap-2 rounded-xl border bg-white pl-3 pr-1 transition ${copied ? "border-primary-700/40 shadow-xs shadow-primary-700/15" : "border-slate-200"}`}>
            <span aria-labelledby="share-link-label" className={`min-w-0 flex-1 select-all truncate text-13 text-slate-700 ${fontRegular}`}>
              {url.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-live="polite"
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-13 transition ${copied ? "bg-primary-700 text-white" : "bg-slate-900 text-white hover:bg-slate-800"} ${fontSemi}`}
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={2} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {canNativeShare && (
            <button
              type="button"
              onClick={() => navigator.share({ title: course.title, text, url }).catch(() => undefined)}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-2 text-13 text-slate-700 transition hover:bg-slate-25 sm:hidden ${fontMedium}`}
            >
              <HugeiconsIcon icon={Share08Icon} size={16} strokeWidth={1.8} />
              More apps
            </button>
          )}
        </div>
      </div>
    </Shell>
  );
}
