import type { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";
import { getProductById } from "../../lib/productsCache";
import { getCompanyData } from "../../lib/companyCache";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";
const SITE_URL = "https://madar-electronics.com";

async function getCompany() {
  return getCompanyData();
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const [product, company] = await Promise.all([getProductById(id), getCompany()]);

  if (!product) {
    return { title: "المنتج غير موجود" };
  }

  const siteName = company.nameAr || "مدار للإلكترونيات";
  const title = product.name;

  const parts: string[] = [];
  if (product.brand) parts.push(product.brand);
  if (product.storage) parts.push(product.storage);
  if (product.color) parts.push(product.color);
  if (product.salePrice || product.price) {
    const price = product.salePrice || product.price;
    parts.push(`${price} ريال`);
  }
  if (product.installment?.available) parts.push("بالأقساط");

  const description = product.description
    ? product.description.slice(0, 160)
    : `اشتري ${title}${parts.length ? " - " + parts.join(" | ") : ""} من ${siteName} بأفضل سعر مع تقسيط مريح بدون فوائد وشحن سريع لجميع مناطق المملكة`;

  const rawImg = product.images?.[0] || product.image || "";
  const imageUrl = rawImg.startsWith("http") ? rawImg : rawImg ? `${BACKEND}${rawImg}` : "";

  return {
    title: `${title} - اشتري الآن بأفضل سعر وتقسيط مريح`,
    description,
    keywords: [
      product.name,
      product.brand || "",
      product.category || "",
      "أقساط", "شراء", siteName,
    ].filter(Boolean),
    openGraph: {
      type: "website",
      url: `${SITE_URL}/product/${id}`,
      title: `${title} | ${siteName}`,
      description,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: title }] : [],
      siteName,
      locale: "ar_SA",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${siteName}`,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
    alternates: {
      canonical: `${SITE_URL}/product/${id}`,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, company] = await Promise.all([getProductById(id), getCompany()]);

  const siteName = company.nameAr || "مدار";
  const price = product?.salePrice || product?.price || 0;
  const rawImg = product?.images?.[0] || product?.image || "";
  const imageUrl = rawImg.startsWith("http") ? rawImg : rawImg ? `${BACKEND}${rawImg}` : "";

  const jsonLd = product ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || product.name,
    image: imageUrl,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: {
      "@type": "Offer",
      url: `${SITE_URL}/product/${id}`,
      priceCurrency: "SAR",
      price: price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: siteName },
    },
  } : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient id={id} />
    </>
  );
}
