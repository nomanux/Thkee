import { useRef, useState, type ReactNode } from "react";
import { courses } from "../data";
import { fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, openPurchaseHistory, refundAmount, useApp } from "../store";
import { CourseThumb } from "./Overlays";

const reasons = ["The course isn't what I expected", "The content quality is poor", "The instructor is hard to understand", "I bought it by mistake", "I found a better course", "Other"];

const fontSubheading = "font-['Instrument_Sans:Medium'] font-medium";
const fieldBase = `w-full rounded-[8px] border bg-white px-4 text-[16px] outline-none transition focus:border-[#faa104] md:text-[14px] ${fontRegular}`;

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className={`m-0 text-[20px] leading-[28px] text-[#0f172a] ${fontSubheading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
      {children}
    </h2>
  );
}

function RefundOption({ checked, onSelect, title, note }: { checked: boolean; onSelect: () => void; title: string; note: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 p-4 transition ${checked ? "bg-[#fff9f0]" : "bg-white hover:bg-[#f8fafc]"}`}>
      <input type="radio" name="refund-method" checked={checked} onChange={onSelect} className="peer sr-only" />
      <span className={`mt-[3px] flex size-4 shrink-0 items-center justify-center rounded-full border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#0d5c4b] ${checked ? "border-[#1e293b] bg-[#1e293b]" : "border-[#cbd5e1] bg-white"}`}>{checked && <span className="size-1.5 rounded-full bg-white" />}</span>
      <span className="flex flex-col gap-2 text-[14px] leading-[22px]">
        <span className={`text-[#1e293b] ${fontMedium}`}>{title}</span>
        <span className={`text-[#64748b] ${fontRegular}`}>{note}</span>
      </span>
    </label>
  );
}

export default function RefundRequestPage({ orderId, courseId }: { orderId: string; courseId: string }) {
  const { orders, refunds, requestRefund, setOverlay } = useApp();
  const [toCredit, setToCredit] = useState(true);
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [showError, setShowError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const reasonRef = useRef<HTMLSelectElement>(null);

  const order = orders.find((o) => o.id === orderId);
  const course = courses.find((c) => c.id === courseId);
  const amount = order ? refundAmount(order, courseId) : 0;
  const requested = refunds.some((r) => r.orderId === orderId && r.courseId === courseId);

  if (submitted) {
    return (
      <main className="w-full bg-white px-4 pb-12 pt-[170px]">
        <div className={`mx-auto flex w-full max-w-[560px] flex-col gap-5 text-[14px] leading-[24px] text-[#475569] ${fontRegular}`}>
          <h1 className={`m-0 text-[32px] leading-[40px] tracking-[-0.5px] text-[#0f172a] ${fontSubheading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            Thank you
          </h1>
          <p>
            You have successfully submitted your refund request with ID <span className={fontMedium}>#{orderId}</span>. You will receive an email providing more details about your request. You can also check the status of your refund in your{" "}
            <a href="#/purchase-history?tab=refunds" className="text-[#faa104] transition hover:underline">
              purchase history
            </a>
            .
          </p>
          <p>If you are receiving a refund in Thkee Credit, the funds will be available for use in your Thkee account immediately.</p>
          <p>If you are receiving a refund back to your original payment method, most refunds will be posted to your financial account within 5 to 10 business days, though it may take longer, depending on your payment method or location.</p>
        </div>
      </main>
    );
  }

  if (!order || !course || amount === 0 || requested) {
    return (
      <main className="flex w-full flex-col items-center gap-4 bg-white px-4 pb-24 pt-[152px] text-center">
        <p className={`text-[14px] text-[#64748b] ${fontRegular}`}>{requested ? "A refund has already been requested for this course." : "This purchase can't be refunded."}</p>
        <button type="button" onClick={openPurchaseHistory} className={`h-[44px] rounded-[8px] bg-[#ffb20d] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#faa104] ${fontMedium}`}>
          Back to purchase history
        </button>
      </main>
    );
  }

  // Orders paid with Thkee Credit or Thkee Point can only go back to credit.
  const canRefundToOriginal = !order.paidWith.startsWith("Thkee");
  const submit = () => {
    if (!reason) {
      setShowError(true);
      reasonRef.current?.focus();
      return;
    }
    requestRefund(order.id, course.id, { refundTo: toCredit ? "Thkee Credit" : order.paidWith, reason, description: description.trim() });
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <main className="w-full bg-white px-4 pb-12 pt-[112px]">
      <div className="mx-auto flex w-full max-w-[500px] flex-col">
        <h1 className={`m-0 text-[32px] leading-[40px] tracking-[-0.5px] text-[#0f172a] ${fontSubheading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          Request a refund
        </h1>
        <p className={`mt-6 text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>
          Please refer to our full{" "}
          <button type="button" onClick={() => setOverlay({ type: "info", page: "Refund Policy" })} className="text-[#faa104] transition hover:underline">
            refund policy
          </button>{" "}
          for further details and make sure the course that is refunded is appropriate.
        </p>

        <section className="mt-10 flex flex-col gap-6">
          <SectionTitle>Transaction Detail</SectionTitle>
          <dl className="flex justify-between gap-4 text-[12px] leading-[18px]">
            <div className="flex flex-col gap-3">
              <dt className={`text-[#94a3b8] ${fontRegular}`}>Purchased on</dt>
              <dd className={`text-[#0f172a] ${fontRegular}`}>{new Date(order.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
            </div>
            <div className="flex flex-col gap-3">
              <dt className={`text-[#94a3b8] ${fontRegular}`}>Order ID</dt>
              <dd className={`text-[#0f172a] ${fontMedium}`}>#{order.id}</dd>
            </div>
          </dl>
        </section>
        <div className="mt-4 flex items-center gap-3 rounded-[6px] border border-[#e2e8f0] p-2">
          <CourseThumb course={course} showTitle={false} className="h-[64px] w-[80px] shrink-0 self-start rounded-[8px] [&>span]:hidden" />
          <div className="flex min-w-0 flex-col gap-2 py-1 text-[14px] leading-[22px]">
            <p dir="auto" className={`text-[#1e293b] ${fontFor(course.title, fontSemi)}`}>
              {course.title}
            </p>
            <p className={`text-[#475569] ${fontRegular}`}>{formatPrice(amount)}</p>
            <p className={`text-[#475569] ${fontRegular}`}>Payment method: {order.paidWith}</p>
          </div>
        </div>

        <section className="mt-9 flex flex-col gap-4">
          <SectionTitle>Refund Method</SectionTitle>
          <p className={`text-[14px] leading-[24px] text-[#64748b] ${fontRegular}`}>Set your refund method on the Thkee marketplace.</p>
          <div className="flex flex-col divide-y divide-[#e2e8f0] overflow-hidden rounded-[6px] border border-[#e2e8f0]">
            <RefundOption checked={toCredit} onSelect={() => setToCredit(true)} title={`${formatPrice(amount)} in Thkee Credit`} note="Thkee Credit will show up in your account immediately." />
            {canRefundToOriginal && <RefundOption checked={!toCredit} onSelect={() => setToCredit(false)} title={`${formatPrice(amount)} to ${order.paidWith}`} note="Most refunds will be posted to your account within 3 - 7 days." />}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="refund-reason" className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>
            Refund Reason
          </label>
          <div className="relative">
            <select
              ref={reasonRef}
              id="refund-reason"
              value={reason}
              aria-invalid={showError && !reason}
              aria-describedby={showError && !reason ? "refund-reason-error" : undefined}
              onChange={(e) => setReason(e.target.value)}
              className={`${fieldBase} h-[42px] appearance-none pr-10 ${reason ? "text-[#0f172a]" : "text-[#94a3b8]"} ${showError && !reason ? "border-[#ef4444]" : "border-[#e2e8f0]"}`}
            >
              <option value="" disabled>
                Choose your reason
              </option>
              {reasons.map((r) => (
                <option key={r} value={r} className="text-[#0f172a]">
                  {r}
                </option>
              ))}
            </select>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-[#475569]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </div>
          {showError && !reason && (
            <p id="refund-reason-error" className={`text-[12px] leading-[18px] text-[#dc2626] ${fontRegular}`}>
              Please choose a refund reason.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="refund-description" className={`text-[14px] leading-[20px] text-[#0f172a] ${fontMedium}`}>
            Description
          </label>
          <textarea id="refund-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please provide additional details." className={`${fieldBase} h-[150px] resize-y border-[#e2e8f0] py-3 text-[#0f172a] leading-[22px] placeholder:text-[#94a3b8]`} />
        </div>

        <button type="button" onClick={submit} className={`mt-8 h-[44px] w-full rounded-[8px] bg-[#ffb20d] text-[16px] text-[#1e293b] transition hover:bg-[#faa104] sm:w-[153px] ${fontMedium}`}>
          Submit
        </button>
      </div>
    </main>
  );
}
