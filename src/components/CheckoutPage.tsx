import { useState, type ReactNode } from "react";
import { courses, type Course } from "../data";
import { fontBold, fontFor, fontHeading, fontMedium, fontRegular, fontSemi } from "../fonts";
import { openLearning, orderTotals, useApp } from "../store";

const sar = (n: number) => `${Math.round(n).toLocaleString()} SAR`;
const countries = ["Saudi Arabia", "United Arab Emirates", "Kuwait", "Qatar", "Bahrain", "Oman", "Egypt", "Jordan", "Pakistan", "Bangladesh", "United Kingdom", "United States"];
const savedCard = { brand: "Visa", last4: "1234", expiry: "02/27" };

const label = `text-[14px] text-[#1e293b] ${fontMedium}`;
const input = `h-[42px] w-full rounded-[6px] border border-[#e2e8f0] bg-white px-3.5 text-[14px] text-[#0f172a] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1e293b] ${fontRegular}`;

type Method = "card" | "paypal" | "saved";

function MadaBadge() {
  return (
    <span className="flex h-[20px] w-[30px] flex-col justify-center gap-[2px] rounded-[3px] bg-[#162f6a] px-[4px]" aria-label="mada">
      <span className="h-[2px] w-full bg-[#84bd00]" />
      <span className="h-[2px] w-full bg-[#00a3e0]" />
    </span>
  );
}

function VisaBadge() {
  return <span className={`flex h-[20px] items-center rounded-[3px] bg-[#1a4c9b] px-1.5 text-[10px] italic tracking-[0.5px] text-white ${fontBold}`}>VISA</span>;
}

function MastercardBadge() {
  return (
    <span className="relative flex h-[20px] w-[30px] items-center justify-center rounded-[3px] bg-[#111]" aria-label="Mastercard">
      <span className="absolute left-[6px] size-[11px] rounded-full bg-[#eb001b]" />
      <span className="absolute right-[6px] size-[11px] rounded-full bg-[#f79e1b] mix-blend-screen" />
    </span>
  );
}

function PaypalLogo() {
  return (
    <span className={`text-[17px] italic tracking-[-0.3px] ${fontBold}`}>
      <span className="text-[#003087]">Pay</span>
      <span className="text-[#009cde]">Pal</span>
    </span>
  );
}

function CardBrand({ number }: { number: string }) {
  const digits = number.replace(/\D/g, "");
  if (digits.startsWith("4")) return <VisaBadge />;
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return <MastercardBadge />;
  return (
    <span className="flex h-[20px] w-[30px] items-center rounded-[3px] bg-[#e2e8f0] px-1" aria-hidden="true">
      <span className="h-[5px] w-[10px] rounded-[1px] bg-[#cbd5e1]" />
    </span>
  );
}

function MethodRow({ checked, onSelect, title, right }: { checked: boolean; onSelect: () => void; title: string; right: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex h-[42px] w-full items-center gap-3 rounded-[6px] border px-3.5 text-left transition ${checked ? "border-[#f5c869] bg-[#fffaf0]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}
    >
      <span className={`flex size-[16px] shrink-0 items-center justify-center rounded-full border-2 ${checked ? "border-[#1e293b]" : "border-[#cbd5e1]"}`}>{checked && <span className="size-[7px] rounded-full bg-[#1e293b]" />}</span>
      <span className={`flex-1 text-[14px] text-[#1e293b] ${fontRegular}`}>{title}</span>
      {right}
    </button>
  );
}

function Success({ purchased }: { purchased: Course[] }) {
  const { openSearch } = useApp();
  return (
    <div className="fade-up mx-auto flex max-w-[560px] flex-col items-center gap-4 rounded-[16px] border border-[#eef2f6] bg-white px-6 py-12 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-[#dcfce7] text-[30px] text-[#16a34a]">✓</span>
      <h1 className={`m-0 text-[26px] text-[#0f172a] ${fontHeading}`}>Payment successful</h1>
      <p className={`text-[15px] text-[#475569] ${fontRegular}`}>You’re now enrolled in {purchased.length === 1 ? "this course" : `these ${purchased.length} courses`}. A receipt has been sent to your email.</p>
      <ul className="flex w-full flex-col gap-2 text-left">
        {purchased.map((c) => (
          <li key={c.id}>
            <button type="button" onClick={() => openLearning(c.id)} className="flex w-full items-center justify-between gap-3 rounded-[8px] bg-[#f8fafc] px-4 py-3 hover:bg-[#f1f5f9]">
              <span dir="auto" className={`truncate text-left text-[14px] text-[#0f172a] ${fontFor(c.title, fontMedium, "font-medium")}`}>
                {c.title}
              </span>
              <span className={`shrink-0 text-[13px] text-[#0d5c4b] ${fontSemi}`}>Start learning →</span>
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => openSearch({})} className={`mt-2 h-[42px] rounded-[8px] border border-[#1e293b] px-5 text-[14px] text-[#1e293b] transition hover:bg-[#1e293b] hover:text-white ${fontMedium}`}>
        Browse more courses
      </button>
    </div>
  );
}

export default function CheckoutPage() {
  const { cart, promo, setPromo, credit, completePurchase, setOverlay, openSearch, notify } = useApp();
  const [country, setCountry] = useState("Saudi Arabia");
  const [method, setMethod] = useState<Method>("card");
  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvv: "" });
  const [savedCvv, setSavedCvv] = useState("");
  const [remember, setRemember] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [paying, setPaying] = useState(false);
  const [purchased, setPurchased] = useState<Course[] | null>(null);

  const { subtotal, saleDiscount, salePercent, promoDiscount, creditUsed, total } = orderTotals(cart, promo, credit);

  const pay = () => {
    setPaying(true);
    setTimeout(() => {
      const ids = completePurchase();
      setPurchased(courses.filter((c) => ids.includes(c.id)));
      setPaying(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
      notify("Payment successful — you're enrolled! 🎉");
    }, 900);
  };

  const setNumber = (v: string) =>
    setCard((c) => ({
      ...c,
      number: v
        .replace(/\D/g, "")
        .slice(0, 16)
        .replace(/(\d{4})(?=\d)/g, "$1 "),
    }));
  const setExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    setCard((c) => ({ ...c, expiry: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }));
  };

  return (
    <main className="w-full bg-[#f8fafc] px-4 pb-20 pt-[112px] md:px-8">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-8">
        {purchased ? (
          <Success purchased={purchased} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <h1 className={`m-0 text-[30px] tracking-[-0.6px] text-[#0f172a] md:text-[32px] ${fontHeading}`} style={{ fontVariationSettings: '"wdth" 100' }}>
                Checkout
              </h1>
              <button type="button" onClick={() => (window.location.hash = "#/cart")} className={`flex h-[36px] items-center gap-2 rounded-[6px] border border-[#1e293b] px-3 text-[14px] text-[#1e293b] transition hover:bg-[#1e293b] hover:text-white ${fontMedium}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M11 6l-6 6 6 6" />
                </svg>
                Back
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-[16px] border border-[#eef2f6] bg-white px-6 py-16 text-center">
                <p className={`text-[20px] text-[#0f172a] ${fontHeading}`}>There’s nothing to check out</p>
                <p className={`text-[15px] text-[#64748b] ${fontRegular}`}>Add a course to your cart first.</p>
                <button type="button" onClick={() => openSearch({})} className={`mt-2 h-[42px] rounded-[8px] bg-[#ffb20d] px-6 text-[14px] text-[#1e293b] hover:bg-[#faa104] ${fontSemi}`}>
                  Browse courses
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_384px] lg:gap-[60px]">
                <section className="overflow-hidden rounded-[12px] border border-[#eef2f6] bg-white">
                  <div className="flex flex-col gap-5 p-6">
                    <h2 className={`m-0 text-[20px] text-[#0f172a] ${fontHeading}`}>Your details</h2>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 xl:grid-cols-[228px_minmax(0,1fr)]">
                      <div className="flex flex-col gap-2">
                        <p className={`text-[16px] text-[#1e293b] ${fontMedium}`}>Tax Information</p>
                        <p className={`text-[12px] leading-[18px] text-[#94a3b8] ${fontRegular}`}>Thkee is required by law to collect applicable transaction taxes for purchases made in certain tax jurisdictions.</p>
                      </div>
                      <label className="flex flex-col gap-2">
                        <span className={label}>
                          Choose country<span className="text-[#ef4444]">*</span>
                        </span>
                        <span className="relative">
                          <select value={country} onChange={(e) => setCountry(e.target.value)} className={`${input} appearance-none pr-10 shadow-[0_1px_3px_rgba(15,23,42,0.08)]`}>
                            {countries.map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                          <svg className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[#1e293b]" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t-4 border-[#f1f5f9] p-6 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 xl:grid-cols-[228px_minmax(0,1fr)]">
                    <p className={`text-[16px] text-[#1e293b] ${fontMedium}`}>Payment Options</p>
                    <div className="flex flex-col gap-4" role="radiogroup" aria-label="Accepted payments">
                      <span className={label}>Accepted payments</span>

                      <MethodRow
                        checked={method === "card"}
                        onSelect={() => setMethod("card")}
                        title="Card Payment"
                        right={
                          <span className={`flex items-center gap-2 text-[12px] text-[#94a3b8] ${fontRegular}`}>
                            Powered By <MadaBadge />
                          </span>
                        }
                      />
                      {method === "card" && (
                        <div className="fade-up -mt-1 grid grid-cols-1 gap-x-6 gap-y-4 rounded-[8px] bg-[#f8fafc] p-4 sm:grid-cols-2">
                          <label className="flex flex-col gap-2">
                            <span className={label}>Card Name</span>
                            <input value={card.name} onChange={(e) => setCard((c) => ({ ...c, name: e.target.value }))} placeholder="Enter your card name" autoComplete="cc-name" className={input} />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className={label}>Card Number</span>
                            <span className="relative">
                              <input value={card.number} onChange={(e) => setNumber(e.target.value)} placeholder="**** **** **** 0000" inputMode="numeric" autoComplete="cc-number" className={`${input} pr-12`} />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                                <CardBrand number={card.number} />
                              </span>
                            </span>
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className={label}>Expiry Date</span>
                            <input value={card.expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="mm / yy" inputMode="numeric" autoComplete="cc-exp" className={input} />
                          </label>
                          <label className="flex flex-col gap-2">
                            <span className={label}>CVV Code</span>
                            <input value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} placeholder="***" type="password" inputMode="numeric" autoComplete="cc-csc" className={input} />
                          </label>
                          <label className={`flex cursor-pointer items-center gap-2 text-[14px] text-[#334155] sm:col-span-2 ${fontRegular}`}>
                            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-[#1e293b]" />
                            Remember this card
                          </label>
                        </div>
                      )}

                      <MethodRow checked={method === "paypal"} onSelect={() => setMethod("paypal")} title="Paypal" right={<PaypalLogo />} />
                      {method === "paypal" && (
                        <p className={`fade-up -mt-1 rounded-[8px] bg-[#f8fafc] p-4 text-[14px] text-[#475569] ${fontRegular}`}>You’ll be taken to PayPal to finish paying, then brought back to Thkee.</p>
                      )}

                      <MethodRow checked={method === "saved"} onSelect={() => setMethod("saved")} title={`${savedCard.brand} **** ${savedCard.last4}`} right={<VisaBadge />} />
                      {method === "saved" && (
                        <div className="fade-up -mt-1 flex flex-col gap-4 rounded-[8px] bg-[#f8fafc] p-4">
                          <p className={`text-[16px] text-[#1e293b] ${fontSemi}`}>
                            {savedCard.brand} **** {savedCard.last4}
                          </p>
                          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                            <label className="flex flex-col gap-2">
                              <span className={label}>Expiry Date</span>
                              <input value={savedCard.expiry} readOnly className={`${input} border-transparent text-[#475569]`} />
                            </label>
                            <label className="flex flex-col gap-2">
                              <span className={label}>CVV Code</span>
                              <input value={savedCvv} onChange={(e) => setSavedCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} type="password" inputMode="numeric" autoComplete="cc-csc" placeholder="***" className={`${input} border-[#1e293b]`} />
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <aside className="overflow-hidden rounded-[12px] border border-[#eef2f6] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.05)] lg:sticky lg:top-[96px]">
                  <div className="flex flex-col gap-4 px-5 pb-5 pt-6">
                    <h2 className={`m-0 text-[20px] text-[#0f172a] ${fontHeading}`}>Order summary</h2>
                    <div className="flex items-center justify-between gap-3">
                      <p className={`text-[14px] text-[#1e293b] ${fontRegular}`}>
                        You have purchased {cart.length} {cart.length === 1 ? "course" : "courses"}
                      </p>
                      <button type="button" onClick={() => setShowItems((v) => !v)} className={`text-[13px] text-[#94a3b8] underline underline-offset-2 hover:text-[#1e293b] ${fontRegular}`}>
                        {showItems ? "Collapse All" : "View All"}
                      </button>
                    </div>
                    {showItems && (
                      <ol className="fade-up flex flex-col gap-3">
                        {cart.map((c, i) => (
                          <li key={c.id} className={`flex items-start justify-between gap-4 text-[13px] text-[#1e293b] ${fontRegular}`}>
                            <span dir="auto" className={`min-w-0 text-left ${fontFor(c.title, "", "font-normal")}`}>
                              {i + 1}. {c.title}
                            </span>
                            <span className="shrink-0">{c.price === 0 ? "Free" : sar(c.price)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>

                  <div className={`flex flex-col gap-0.5 border-t border-dashed border-[#e2e8f0] px-3 py-4 text-[14px] ${fontRegular}`}>
                    <div className="flex items-center justify-between px-2 py-2 text-[16px] text-[#1e293b]">
                      <span>Subtotal</span>
                      <span>{sar(subtotal)}</span>
                    </div>
                    {saleDiscount > 0 && (
                      <div className="flex items-center justify-between px-2 py-2 text-[#94a3b8]">
                        <span>Discount ({salePercent}%)</span>
                        <span>-{sar(saleDiscount)}</span>
                      </div>
                    )}
                    {promo && (
                      <div className="flex items-center justify-between px-2 py-2 text-[#94a3b8]">
                        <span className="flex items-center gap-2">
                          Promo Code
                          <button type="button" onClick={() => setPromo(null)} className={`text-[12px] italic text-[#dc2626] underline underline-offset-2 ${fontMedium}`}>
                            remove
                          </button>
                        </span>
                        <span>-{sar(promoDiscount)}</span>
                      </div>
                    )}
                    {creditUsed > 0 && (
                      <div className="flex items-center justify-between rounded-[6px] bg-[#f1f5f9] px-2 py-2.5 text-[#475569]">
                        <span>Credit Applied</span>
                        <span className="text-[#94a3b8]">-{sar(creditUsed)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 border-t border-dashed border-[#e2e8f0] px-5 pb-6 pt-4">
                    <div className={`flex items-center justify-between pb-4 text-[16px] text-[#1e293b] ${fontRegular}`}>
                      <span>Total</span>
                      <span className={fontBold}>{total === 0 ? "Free" : sar(total)}</span>
                    </div>
                    <button type="button" onClick={pay} disabled={paying} className={`h-[44px] rounded-[6px] bg-[#ffb20d] text-[15px] text-[#1e293b] transition hover:bg-[#faa104] disabled:opacity-70 ${fontMedium}`}>
                      {paying ? "Processing…" : "Complete Payment"}
                    </button>
                    <p className={`text-[14px] leading-[22px] text-[#94a3b8] ${fontRegular}`}>
                      By completing your purchase you agree to these{" "}
                      <button type="button" onClick={() => setOverlay({ type: "info", page: "Terms of Service" })} className="text-[#1e293b] underline underline-offset-2">
                        Terms &amp; Conditions
                      </button>
                    </p>
                  </div>
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
