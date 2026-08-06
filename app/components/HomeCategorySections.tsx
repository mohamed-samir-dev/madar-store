import HomeCategorySection from "./HomeCategorySection";
import type { Product } from "./products/types";
import { getAllProducts } from "../lib/productsCache";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

// Map category names to their page hrefs
const categoryHrefMap: Record<string, string> = {
  "الهواتف الذكية": "/smartphones",
  "ابل ايفون 17 برو ماكس": "/smartphones/iphone-17-pro-max",
  "أبل آيفون 17 برو ماكس": "/smartphones/iphone-17-pro-max",
  "ابل ايفون 17 برو": "/smartphones/iphone-17-pro",
  "أبل آيفون 17 برو": "/smartphones/iphone-17-pro",
  "ابل ايفون 17 اير": "/smartphones/iphone-17-air",
  "أبل آيفون 17 اير": "/smartphones/iphone-17-air",
  "ابل ايفون 17": "/smartphones/iphone-17",
  "أبل آيفون 17": "/smartphones/iphone-17",
  "ابل ايفون 16 برو ماكس": "/smartphones/iphone-16-pro-max",
  "ابل ايفون 16 برو": "/smartphones/iphone-16-pro",
  "ابل ايفون 16 بلس": "/smartphones/iphone-16-plus",
  "ابل ايفون 16": "/smartphones/iphone-16",
  "ابل ايفون 15 برو ماكس": "/smartphones/iphone-15-pro-max",
  "ابل ايفون 15 برو": "/smartphones/iphone-15-pro",
  "ابل ايفون 15 بلس": "/smartphones/iphone-15-plus",
  "ابل ايفون 15": "/smartphones/iphone-15",
  "ابل ايفون 14 برو ماكس": "/smartphones/iphone-14-pro-max",
  "ابل ايفون 14 برو": "/smartphones/iphone-14-pro",
  "سامسونج جالاكسي S26": "/smartphones/samsung-s26-ultra",
  "سامسونج جالاكسي S25": "/smartphones/samsung-s25-ultra",
  "سامسونج جالاكسي S24": "/smartphones/samsung-s24-ultra",
  "سامسونج جالاكسي S23": "/smartphones/samsung-s23-ultra",
  "سامسونج جلاكسي S23 الترا": "/smartphones/samsung-s23-ultra",
  "سامسونج جالاكسي S22": "/smartphones/samsung-s22-ultra",
  "ساعات ذكية": "/smart-watches/smart-watches",
  "الساعات الذكية": "/smart-watches/smart-watches",
  "ساعات ابل": "/apple-watches/se",
  "ساعات أبل": "/apple-watches/se",
  "سماعات ابل": "/audio/airpods-pro",
  "سماعات أبل": "/audio/airpods-pro",
  "أجهزة صوت و سماعات": "/audio/airpods-pro",
  "أجهزة صوت وسماعات": "/audio/airpods-pro",
  "أجهزة بلاي ستيشن": "/playstation/ps5",
  "بلاي ستيشن": "/playstation/ps5",
  "لابتوبات وشاشات": "/laptops/macbook-pro",
  "لابتوبات": "/laptops/macbook-pro",
  "الاجهزة اللوحية ايبادات": "/tablets/ipad-pro",
  "الأجهزة اللوحية": "/tablets/ipad-pro",
  "بطاريات متنقلة وكيابل": "/accessories/anker-batteries",
  "بطاريات متنقله": "/accessories/anker-batteries",
  "ملحقات": "/accessories/anker-batteries",
  "ألعاب الفيديو": "/games/ps5-games",
  "العاب": "/games/ps5-games",
};

function getCategoryHref(name: string): string {
  if (categoryHrefMap[name]) return categoryHrefMap[name];
  const lower = name.toLowerCase();
  const match = Object.entries(categoryHrefMap).find(([k]) => {
    const kl = k.toLowerCase();
    return lower.includes(kl) || kl.includes(lower);
  });
  return match?.[1] ?? "/store";
}

type BannerItem = { url: string; active: boolean };
type Setting = { category: string; subCategory: string; showInHome: boolean; order: number };

async function getHomeCategories(): Promise<{ name: string; order: number }[]> {
  try {
    const [catRes, settingsRes] = await Promise.all([
      fetch(`${BACKEND}/api/admin/sub-categories/public`, { next: { revalidate: 3600 } }),
      fetch(`${BACKEND}/api/admin/sub-categories/home-settings`, { next: { revalidate: 3600 } }),
    ]);
    const allCats: { name: string }[] = catRes.ok ? await catRes.json() : [];
    const settings: Setting[] = settingsRes.ok ? await settingsRes.json() : [];

    const visibleMap = new Map(
      settings.filter((s) => s.showInHome).map((s) => [s.category, s.order])
    );
    if (!visibleMap.size) return [];

    return allCats
      .filter((c) => visibleMap.has(c.name))
      .map((c) => ({ name: c.name, order: visibleMap.get(c.name) ?? 0 }))
      .sort((a, b) => a.order - b.order);
  } catch {
    return [];
  }
}

async function getCategoryBanners(category: string): Promise<string[]> {
  try {
    const res = await fetch(
      `${BACKEND}/api/admin/category-banners/${encodeURIComponent(category)}`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return [];
    const data: BannerItem[] = await res.json();
    return Array.isArray(data) ? data.filter((b) => b.active && b.url).map((b) => b.url) : [];
  } catch {
    return [];
  }
}

export default async function HomeCategorySections() {
  const categories = await getHomeCategories();
  if (!categories.length) return null;

  const [allProducts, ...bannersResults] = await Promise.all([
    getAllProducts() as Promise<Product[]>,
    ...categories.map(({ name }) => getCategoryBanners(name)),
  ]);

  const sectionsData = categories.map(({ name }, i) => ({
    name,
    banners: bannersResults[i] as string[],
    products: (allProducts as Product[]).filter((p) => p.category === name).slice(0, 4),
    href: getCategoryHref(name),
  }));

  const visible = sectionsData.filter((s) => s.banners.length > 0 || s.products.length > 0);
  if (!visible.length) return null;

  return (
    <section dir="rtl" className="w-full py-10 sm:py-14 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col">
        {visible.map((section, idx) => (
          <div key={section.name}>
            <HomeCategorySection
              categoryName={section.name}
              categoryHref={section.href}
              bannerImages={section.banners}
              products={section.products}
            />
            {idx < visible.length - 1 && (
              <div className="mt-14 sm:mt-20 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
