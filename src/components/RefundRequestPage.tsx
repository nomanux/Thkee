import { useRef, useState, type ReactNode } from "react";
import { courses } from "../data";
import { fontFor, fontMedium, fontRegular, fontSemi } from "../fonts";
import { formatPrice, openPurchaseHistory, refundAmount, useApp } from "../store";
import { CourseThumb } from "./Overlays";
import { buttonClass } from "./Button"

const reasons = ["The course isn't what I expected", "The content quality is poor", "The instructor is hard to understand", "I bought it by mistake", "I found a better course", "Other"];

const fontSubheading = "font-instrument-medium font-medium";
const fieldBase = "field";

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className={`m-0 text-xl leading-7 text-slate-900 ${fontSubheading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
      {children}
    </h2>
  );
}

export function RefundOption({ checked, onSelect, title, note }: { checked: boolean; onSelect: () => void; title: string; note: string }) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 p-4 transition ${checked ? "bg-secondary-50" : "bg-white hover:bg-slate-25"}`}>
      <input type="radio" name="refund-method" checked={checked} onChange={onSelect} className="peer sr-only" />
      <span className={`mt-0.75 flex size-4 shrink-0 items-center justify-center rounded-full border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary-700 ${checked ? "border-slate-800 bg-slate-800" : "border-slate-300 bg-white"}`}>{checked && <span className="size-1.5 rounded-full bg-white" />}</span>
      <span className="flex flex-col gap-2 text-sm leading-5.5">
        <span className={`text-slate-800 ${fontMedium}`}>{title}</span>
        <span className={`text-slate-500 ${fontRegular}`}>{note}</span>
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
      <main className="w-full bg-white px-4 pb-12 pt-42.5">
        <div className={`mx-auto flex w-full max-w-140 flex-col gap-5 text-sm leading-6 text-slate-600 ${fontRegular}`}>
          <h1 className={`m-0 text-32 leading-10 tracking-tight text-slate-900 ${fontSubheading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
            Thank you
          </h1>
          <p>
            You have successfully submitted your refund request with ID <span className={fontMedium}>#{orderId}</span>. You will receive an email providing more details about your request. You can also check the status of your refund in your{" "}
            <a href="#/purchase-history?tab=refunds" className="text-secondary-600 transition hover:underline">
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
      <main className="flex w-full flex-col items-center gap-4 bg-white px-4 pb-24 pt-38 text-center">
        <p className={`text-sm text-slate-500 ${fontRegular}`}>{requested ? "A refund has already been requested for this course." : "This purchase can't be refunded."}</p>
        <button type="button" onClick={openPurchaseHistory} className={`${buttonClass("yellow", "lg")}`}>
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
    <main className="w-full bg-white px-4 pb-12 pt-28">
      <div className="mx-auto flex w-full max-w-125 flex-col">
        <h1 className={`m-0 text-32 leading-10 tracking-tight text-slate-900 ${fontSubheading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
          Request a refund
        </h1>
        <p className={`mt-6 text-sm leading-6 text-slate-500 ${fontRegular}`}>
          Please refer to our full{" "}
          <button type="button" onClick={() => setOverlay({ type: "info", page: "Refund Policy" })} className="text-secondary-600 transition hover:underline">
            refund policy
          </button>{" "}
          for further details and make sure the course that is refunded is appropriate.
        </p>

        <section className="mt-10 flex flex-col gap-6">
          <SectionTitle>Transaction Detail</SectionTitle>
          <dl className="flex justify-between gap-4 text-xs leading-4.5">
            <div className="flex flex-col gap-3">
              <dt className={`text-slate-400 ${fontRegular}`}>Purchased on</dt>
              <dd className={`text-slate-900 ${fontRegular}`}>{new Date(order.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</dd>
            </div>
            <div className="flex flex-col gap-3">
              <dt className={`text-slate-400 ${fontRegular}`}>Order ID</dt>
              <dd className={`text-slate-900 ${fontMedium}`}>#{order.id}</dd>
            </div>
          </dl>
        </section>
        <div className="mt-4 flex items-center gap-3 rounded-md border border-slate-200 p-2">
          <CourseThumb course={course} showTitle={false} className="h-16 w-20 shrink-0 self-start rounded-lg [&>span]:hidden" />
          <div className="flex min-w-0 flex-col gap-2 py-1 text-sm leading-5.5">
            <p dir="auto" className={`text-slate-800 ${fontFor(course.title, fontSemi)}`}>
              {course.title}
            </p>
            <p className={`text-slate-600 ${fontRegular}`}>{formatPrice(amount)}</p>
            <p className={`text-slate-600 ${fontRegular}`}>Payment method: {order.paidWith}</p>
          </div>
        </div>

        <section className="mt-9 flex flex-col gap-4">
          <SectionTitle>Refund Method</SectionTitle>
          <p className={`text-sm leading-6 text-slate-500 ${fontRegular}`}>Set your refund method on the Thkee marketplace.</p>
          <div className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200">
            <RefundOption checked={toCredit} onSelect={() => setToCredit(true)} title={`${formatPrice(amount)} in Thkee Credit`} note="Thkee Credit will show up in your account immediately." />
            {canRefundToOriginal && <RefundOption checked={!toCredit} onSelect={() => setToCredit(false)} title={`${formatPrice(amount)} to ${order.paidWith}`} note="Most refunds will be posted to your account within 3 - 7 days." />}
          </div>
        </section>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="refund-reason" className={`text-sm leading-5 text-slate-900 ${fontMedium}`}>
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
              className={`${fieldBase} ${reason ? "" : "text-slate-400"} ${showError && !reason ? "border-red-500" : ""}`}
            >
              <option value="" disabled>
                Choose your reason
              </option>
              {reasons.map((r) => (
                <option key={r} value={r} className="text-slate-900">
                  {r}
                </option>
              ))}
            </select>
          </div>
          {showError && !reason && (
            <p id="refund-reason-error" className={`text-xs leading-4.5 text-red-600 ${fontRegular}`}>
              Please choose a refund reason.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <label htmlFor="refund-description" className={`text-sm leading-5 text-slate-900 ${fontMedium}`}>
            Description
          </label>
          <textarea id="refund-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Please provide additional details." className={`${fieldBase} h-30`} />
        </div>

        <button type="button" onClick={submit} className={`mt-8 h-11 w-full rounded-lg bg-secondary-500 text-base text-slate-800 transition hover:bg-secondary-600 sm:w-38.25 ${fontMedium}`}>
          Submit
        </button>
      </div>
    </main>
  );
}
