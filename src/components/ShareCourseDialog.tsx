import { useState } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";
import { Cancel01Icon, Copy01Icon, Facebook01Icon, Linkedin01Icon, Mail01Icon, NewTwitterIcon, Share08Icon, TelegramIcon, Tick02Icon, WhatsappIcon } from "@hugeicons/core-free-icons";
import type { Course } from "../data";
import { fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice } from "../store";
import { CourseThumb, Shell } from "./Overlays";

// Share sheet for a course: a preview of what gets shared, one-tap apps, and a link to copy.
export default function ShareCourseDialog({ course, onClose }: { course: Course; onClose: () => void }) {
  const url = window.location.href;
  const [copied, setCopied] = useState(false);
  const text = `${course.title} by ${course.instructor} on Thkee`;
  const e = encodeURIComponent;
  // WhatsApp first: it is the most used way to share links in Saudi Arabia.
  const targets: { name: string; icon: IconSvgElement; href: string; tone: string }[] = [
    { name: "WhatsApp", icon: WhatsappIcon, href: `https://wa.me/?text=${e(`${text} ${url}`)}`, tone: "bg-[#e8f8ee] text-[#16a34a] group-hover:bg-[#16a34a]" },
    { name: "X", icon: NewTwitterIcon, href: `https://twitter.com/intent/tweet?text=${e(text)}&url=${e(url)}`, tone: "bg-[#f1f5f9] text-[#0f172a] group-hover:bg-[#0f172a]" },
    { name: "LinkedIn", icon: Linkedin01Icon, href: `https://www.linkedin.com/sharing/share-offsite/?url=${e(url)}`, tone: "bg-[#e8f1fb] text-[#0a66c2] group-hover:bg-[#0a66c2]" },
    { name: "Facebook", icon: Facebook01Icon, href: `https://www.facebook.com/sharer/sharer.php?u=${e(url)}`, tone: "bg-[#ebf2ff] text-[#1877f2] group-hover:bg-[#1877f2]" },
    { name: "Telegram", icon: TelegramIcon, href: `https://t.me/share/url?url=${e(url)}&text=${e(text)}`, tone: "bg-[#e8f6fc] text-[#229ed9] group-hover:bg-[#229ed9]" },
    { name: "Email", icon: Mail01Icon, href: `mailto:?subject=${e(course.title)}&body=${e(`${text}\n${url}`)}`, tone: "bg-[#fff4e0] text-[#c2410c] group-hover:bg-[#ea580c]" },
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
    <Shell title="Share this course" onClose={onClose} width="max-w-[460px]" hideHeader>
      <div className="flex flex-col">
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <h2 className={`m-0 text-[17px] leading-[24px] text-[#0f172a] ${fontSemi}`}>Share this course</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1.5 flex size-9 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#0f172a]">
            <HugeiconsIcon icon={Cancel01Icon} size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* What people will see */}
        <div className="mx-5 mt-3 flex items-center gap-3 rounded-[14px] border border-[#e2e8f0] bg-[#f8fafc] p-2.5">
          <div className="w-[88px] shrink-0 overflow-hidden rounded-[10px]">
            <CourseThumb course={course} showTitle={false} className="aspect-video" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`m-0 line-clamp-2 text-[14px] leading-[19px] text-[#0f172a] ${fontSemi}`}>{course.title}</p>
            <p className={`m-0 mt-0.5 truncate text-[12px] leading-[16px] text-[#64748b] ${fontRegular}`}>
              {course.instructor} · <span className="text-[#f59e0b]">★</span> {course.rating.toFixed(1)}
            </p>
            <p className={`m-0 mt-1 text-[13px] leading-[16px] text-[#0f172a] ${fontSemi}`}>{formatPrice(course.price)}</p>
          </div>
        </div>

        {/* One tap to each app */}
        <p className={`m-0 mt-5 px-5 text-[12px] uppercase tracking-[0.08em] text-[#64748b] ${fontSemi}`}>Share to</p>
        <ul className="mt-3 grid grid-cols-6 gap-1 px-3">
          {targets.map((t) => (
            <li key={t.name}>
              <a href={t.href} target="_blank" rel="noopener noreferrer" className="group flex flex-col items-center gap-1.5 rounded-[12px] py-1.5 transition hover:bg-[#f8fafc] focus-visible:bg-[#f8fafc]">
                <span className={`flex size-11 items-center justify-center rounded-full transition duration-200 group-hover:-translate-y-0.5 group-hover:text-white ${t.tone}`}>
                  <HugeiconsIcon icon={t.icon} size={20} strokeWidth={1.8} />
                </span>
                <span className={`text-[11px] leading-[14px] text-[#475569] ${fontMedium}`}>{t.name}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Link to copy */}
        <div className="mt-5 border-t border-[#f1f5f9] px-5 pb-5 pt-4">
          <p id="share-link-label" className={`m-0 text-[12px] uppercase tracking-[0.08em] text-[#64748b] ${fontSemi}`}>
            Course link
          </p>
          <div className={`mt-2 flex h-11 items-center gap-2 rounded-[12px] border bg-white pl-3 pr-1 transition ${copied ? "border-[#0d5c4b]/40 shadow-[0_0_0_3px_rgba(13,92,75,0.1)]" : "border-[#e2e8f0]"}`}>
            <span aria-labelledby="share-link-label" className={`min-w-0 flex-1 select-all truncate text-[13px] text-[#334155] ${fontRegular}`}>
              {url.replace(/^https?:\/\//, "")}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-live="polite"
              className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[13px] transition ${copied ? "bg-[#0d5c4b] text-white" : "bg-[#0f172a] text-white hover:bg-[#1e293b]"} ${fontSemi}`}
            >
              <HugeiconsIcon icon={copied ? Tick02Icon : Copy01Icon} size={16} strokeWidth={2} />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          {canNativeShare && (
            <button
              type="button"
              onClick={() => navigator.share({ title: course.title, text, url }).catch(() => undefined)}
              className={`mt-3 flex w-full items-center justify-center gap-2 rounded-[10px] py-2 text-[13px] text-[#334155] transition hover:bg-[#f8fafc] sm:hidden ${fontMedium}`}
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
