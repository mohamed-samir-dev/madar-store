"use client";
import React, { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Smartphone, Package, Palette, CircleDollarSign, HandCoins, Calculator, CalendarDays, Wallet, CalendarClock } from "lucide-react";

interface OrderItem { name: string; price: number; quantity: number; color?: string; storage?: string; }
interface Order {
  orderId: string; createdAt: string; customer: string; whatsapp: string; address: string;
  nationalId?: string; total: number; downPayment: number; months: number; monthlyPayment: number;
  installmentType: string; items: OrderItem[];
}
interface Company { header?: string; footer?: string; nameEn?: string; nameAr?: string; stamp?: string; }

export default function PrintOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [company, setCompany] = useState<Company>({});
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/orders/${id}`).then((r) => r.json()),
      fetch("/api/admin/company").then((r) => r.json()).catch(() => ({})),
    ]).then(([o, c]) => { setOrder(o); setCompany(c); });
  }, [id]);

  useEffect(() => {
    if (!order) return;
    const imgs = document.querySelectorAll<HTMLImageElement>("img");
    const pending = Array.from(imgs).filter((img) => !img.complete);
    const printNow = () => window.print();
    if (pending.length === 0) { printNow(); return; }
    let loaded = 0;
    pending.forEach((img) => {
      const done = () => { if (++loaded === pending.length) printNow(); };
      img.addEventListener("load", done, { once: true });
      img.addEventListener("error", done, { once: true });
    });
  }, [order]);

  if (!order) return <div style={{ textAlign: "center", padding: 40 }}>جاري التحميل...</div>;

  const C1 = "#1B6F76", C2 = "#161717", C4 = "#00ADBA";

  const rows: [string, string, React.ReactNode][] = [
    ["نوع الجهاز",          order.items[0]?.name ?? "—",                                                                                          <Smartphone key="نوع الجهاز" size={19} color={C4} />],
    ["موديل الجهاز",        order.items[0]?.name ?? "—",                                                                                          <Package key="موديل الجهاز" size={19} color={C4} />],
    ["السعة / اللون",       [order.items[0]?.storage, order.items[0]?.color].filter(Boolean).join(" / ") || "—",                                                                                                                   <Palette key="السعة / اللون" size={19} color={C4} />],
    ["سعر الجهاز الإجمالي", `${order.total.toLocaleString("ar-SA")} ريال`,                                                                        <CircleDollarSign key="سعر الجهاز الإجمالي" size={19} color={C4} />],
    ["الدفعة المقدمة",      `${order.downPayment.toLocaleString("ar-SA")} ريال`,                                                                   <HandCoins key="الدفعة المقدمة" size={19} color={C4} />],
    ["المبلغ المتبقي",      `${(order.total - order.downPayment).toLocaleString("ar-SA")} ريال`,                                                   <Calculator key="المبلغ المتبقي" size={19} color={C4} />],
    ["عدد الأقساط",         `${order.months} شهر`,                                                                                                <CalendarDays key="عدد الأقساط" size={19} color={C4} />],
    ["قيمة القسط الشهري",   `${order.monthlyPayment.toLocaleString("ar-SA")} ريال`,                                                               <Wallet key="قيمة القسط الشهري" size={19} color={C4} />],
    ["تاريخ أول قسط",       new Date(new Date(order.createdAt).setMonth(new Date(order.createdAt).getMonth() + 1)).toLocaleDateString("ar-SA"),    <CalendarClock key="تاريخ أول قسط" size={19} color={C4} />],
  ];

  return (
    <>
      <style>{`
        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { width: 210mm; height: 297mm; overflow: hidden; }
        }
        @media screen {
          body { background: #f0f0f0; display: flex; justify-content: center; }
        }
      `}</style>
      <div ref={contentRef} style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", padding: "6px 12px", width: "210mm", height: "297mm", overflow: "hidden", position: "relative", direction: "rtl" }}>

        {company.header && <img src={company.header} alt="header" style={{ width: "100%", marginBottom: 4 }} />}

        {/* عنوان العقد */}
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#0a2540", letterSpacing: 2 }}>عقد اتفاق بالتقسيط</div>
          <div style={{ fontSize: 13, color: "#0d3d52", marginTop: 2, fontWeight: 600 }}>
            بين مؤسسة مدار للأجهزة الإلكترونية <span style={{ color: C4, fontWeight: 800 }}>(المقرض)</span>
            {" "}&nbsp;والعميل <span style={{ color: C4, fontWeight: 800 }}>(المستفيد)</span>
          </div>
        </div>

        {/* صندوقا البيانات + صورة الاتفاق */}
        <div style={{ display: "flex", alignItems: "stretch", gap: 8, marginBottom: 6, position: "relative" }}>

          {/* بيانات العميل */}
          <div style={{ flex: 1, border: `1px solid #b2dfe3`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg, #0d4f57, #0a3d44)`, color: "white", textAlign: "center", padding: "7px 0", fontWeight: 800, fontSize: 15 }}>بيانات العميل</div>
            <div style={{ padding: "6px 14px 8px", fontSize: 12, color: C2, lineHeight: 1.9, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>الاسم الرباعي: </span>{order.customer}</div>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>رقم الهوية الوطنية: </span>{order.nationalId || "_______________"}</div>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>رقم الجوال: </span>{order.whatsapp}</div>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>العنوان: </span>{order.address}</div>
            </div>
          </div>

          {/* صورة فوق المربعين */}
          <div style={{ position: "absolute", left: "50%", top: "60%", transform: "translate(-50%, -50%)", zIndex: 3, pointerEvents: "none" }}>
            <img src="/printo.webp" alt="اتفاق" style={{ width: 110, height: 110, objectFit: "contain", opacity: 0.95 }} />
          </div>

          {/* بيانات المؤسسة */}
          <div style={{ flex: 1, border: `1px solid #b2dfe3`, borderRadius: 10, overflow: "hidden" }}>
            <div style={{ background: `linear-gradient(135deg, #0d4f57, #0a3d44)`, color: "white", textAlign: "center", padding: "7px 0", fontWeight: 800, fontSize: 15 }}>بيانات المؤسسة</div>
            <div style={{ padding: "6px 45px 8px 14px", fontSize: 12, color: C2, lineHeight: 1.9, display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>اسم المؤسسة: </span>مؤسسة مدار للأجهزة الإلكترونية</div>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>سجل تجاري رقم: </span>1010569266</div>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>العنوان: </span>المملكة العربية السعودية</div>
              <div style={{ wordBreak: "break-word" }}><span style={{ color: C1, fontWeight: 700 }}>رقم الجوال: </span>0599171457</div>
            </div>
          </div>
        </div>

        {/* وصف الاتفاق */}
        <div style={{ fontSize: 11, color: "#0a2540", fontWeight: 500, lineHeight: 1.6, marginTop: 4, marginBottom: 4, textAlign: "center", padding: "0 60px" }}>
          تم الاتفاق بين الطرفين على أن تقوم المؤسسة ببيع الجهاز الموضح أدناه للعميل نظام التقسيط وفقاً للشروط والأحكام التالية:
        </div>

        {/* قسمين بخط رأسي فاصل */}
        <div style={{ display: "flex", gap: 0, alignItems: "stretch", marginTop: 4 }}>

          {/* تفاصيل العقد - يمين */}
          <div style={{ width: "50%", flexShrink: 0, padding: "0 4px 0 8px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
              <div style={{ fontWeight: 900, fontSize: 13, color: "white", background: `linear-gradient(135deg, #0d4f57, #0a3d44)`, borderRadius: 20, padding: "4px 18px" }}>تفاصيل العقد</div>
            </div>
            <div style={{ fontSize: 12, color: C2, lineHeight: 1.7 }}>
              {rows.map(([label, val, icon], i) => (
                <div key={label} style={{ display: "flex", justifyContent: i < 2 ? "flex-start" : "space-between", alignItems: "center", gap: i < 2 ? 6 : 0, borderBottom: `1px dashed #d0eef0`, paddingBottom: 1, marginBottom: 2 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, color: C1, fontWeight: 700, whiteSpace: "nowrap", fontSize: i < 2 ? 11 : "inherit" }}>
                    <span style={{ display: "inline-flex", transform: "scale(1.0)", transformOrigin: "center" }}>{icon}</span>
                    {label}:
                  </span>
                  <span style={{ fontSize: i < 2 ? 12 : "inherit", whiteSpace: i < 2 ? "nowrap" : "normal", overflow: i < 2 ? "hidden" : "visible", textOverflow: i < 2 ? "ellipsis" : "clip", wordBreak: i < 2 ? "normal" : "break-word" }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* خط رأسي */}
          <div style={{ width: 1, background: C4, alignSelf: "stretch" }} />

          {/* شروط وأحكام العقد - شمال */}
          <div style={{ flex: 1, padding: "0 0 0 12px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
              <div style={{ fontWeight: 900, fontSize: 13, color: "white", background: `linear-gradient(135deg, #0d4f57, #0a3d44)`, borderRadius: 20, padding: "4px 18px" }}>شروط وأحكام العقد</div>
            </div>
            <div style={{ fontSize: 11, color: C2, lineHeight: 1.65 }}>
              {[
                "يقر العميل باستلام الجهاز بحالة جيدة ويكون مسؤولاً عنه بالكامل.",
                "يلتزم العميل بسداد الأقساط الشهرية في مواعيدها المحددة.",
                "في حال تأخر السداد سيتم تطبيق غرامة تأخير حسب سياسة المؤسسة.",
                "يبقى الجهاز ملكاً للمؤسسة حتى يتم سداد كامل المبلغ المتفق عليه.",
                "لا يحق للعميل إلغاء أو إيقاف الخطة إلا بموافقة خطية من المؤسسة.",
                "يقر العميل بصحة البيانات المقدمة ويكون مسؤولاً عن أي خطأ فيها.",
                "يتم التواصل مع العميل عبر الوسائل المتاحة (اتصال - رسائل نصية - واتساب).",
                "يخضع هذا العقد للأنظمة والقوانين المعمول بها في المملكة العربية السعودية.",
                "أي نزاع ينشأ عن هذا العقد يتم حله وديًا، وفي حال تعذر ذلك يُحال للجهات المختصة.",
                "أقر العميل بقراءة العقد وفهمه والموافقة على جميع بنوده.",
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "flex-start", borderBottom: `1px dashed #d0eef0`, paddingBottom: 1, marginBottom: 2 }}>
                  <span style={{ color: C4, fontWeight: 800, minWidth: 16, fontSize: 11, flexShrink: 0, lineHeight: 1.5 }}>{["١","٢","٣","٤","٥","٦","٧","٨","٩","١٠"][i]}.</span>
                  <span style={{ fontSize: 11, lineHeight: 1.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* نص الموافقة */}
        <div style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#0a2540", lineHeight: 1.5, marginTop: 8, marginBottom: 5 }}>
          بناءً على ما سبق، يُقرّ الطرفان بالموافقة على جميع ما ورد في هذا العقد، والتزام كل طرف بما يترتب عليه من حقوق وواجبات.
        </div>

        {/* التوقيعات */}
        <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 5, marginTop: 8, paddingRight: -20 }}>

          {/* توقيع العميل */}
          <div style={{ fontSize: 12, color: C2, textAlign: "right", display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontWeight: 900, fontSize: 13, color: C1 }}>توقيع العميل</div>
            <div><span style={{ color: C1, fontWeight: 700 }}>الاسم: </span>{order.customer}</div>
            <div><span style={{ color: C1, fontWeight: 700 }}>التاريخ: </span>....../....../.....20م</div>
            <div><span style={{ color: C1, fontWeight: 700 }}>التوقيع: </span>................................</div>
          </div>

          {/* توقيع المؤسسة */}
          <div style={{ fontSize: 12, color: C2, textAlign: "right", display: "flex", flexDirection: "column", gap: 4, position: "relative" }}>
            {company.stamp && (
              <img src={company.stamp} alt="ختم" style={{ position: "absolute", top: -40, left: -130, height: 200, width: 200, objectFit: "contain", opacity: 0.9, zIndex: 2 }} />
            )}
            <div style={{ fontWeight: 900, fontSize: 13, color: C1 }}>توقيع المؤسسة</div>
            <div><span style={{ color: C1, fontWeight: 700 }}>الاسم: </span>مؤسسة مدار للأجهزة الإلكترونية</div>
            <div><span style={{ color: C1, fontWeight: 700 }}>التاريخ: </span>{new Date(order.createdAt).toLocaleDateString("ar-SA")}</div>
            {!company.stamp && <span style={{ display: "inline-block", width: 100, height: 100, border: `1px dashed ${C4}`, borderRadius: "50%" }} />}
          </div>
        </div>

        {company.footer && (
          <div style={{ marginTop: 16 }}>
            <div style={{ borderTop: `2px solid ${C4}`, marginBottom: 8 }} />
            <img src={company.footer} alt="footer" style={{ width: "100%" }} />
          </div>
        )}
      </div>
    </>
  );
}
