"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function FingerprintInit() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (document.cookie.includes("_fp=")) return;
    import("@fingerprintjs/fingerprintjs").then((FingerprintJS) => {
      FingerprintJS.load().then((fp) =>
        fp.get().then(({ visitorId }) => {
          document.cookie = `_fp=${visitorId};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
        })
      );
    });
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/blocked") || pathname.startsWith("/x-panel")) return;

    const check = async () => {
      try {
        const r = await fetch("/api/secret/blocked-check", { cache: "no-store" });
        if (r.ok) {
          const { blocked } = await r.json();
          if (blocked) router.replace("/blocked");
        }
      } catch {}
    };

    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, [pathname, router]);

  return null;
}
