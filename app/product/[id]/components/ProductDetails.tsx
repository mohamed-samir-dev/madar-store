"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { IoStar } from "react-icons/io5";
import type { Product } from "../../../components/products/types";

interface ProductDetailsProps {
  description?: string;
  specs?: Product["specs"];
  gallery?: Product["gallery"];
  specifications?: Product["specifications"];
  rating?: Product["rating"];
  reviews?: Product["reviews"];
}

const TABS = [
  { key: "overview", label: "نظرة عامة" },
  { key: "specs", label: "المواصفات" },
  { key: "reviews", label: "التقييمات" },
];

const SPEC_LABELS: Record<string, string> = {
  screen: "الشاشة",
  processor: "المعالج",
  ram: "الرام",
  storage: "التخزين",
  rearCamera: "الكاميرا الخلفية",
  frontCamera: "الكاميرا الأمامية",
  battery: "البطارية",
  batteryLife: "عمر البطارية",
  charging: "الشحن",
  os: "نظام التشغيل",
  extras: "مميزات إضافية",
};

export default function ProductDetails({ description, specs, gallery, specifications, rating, reviews }: ProductDetailsProps) {
  const [active, setActive] = useState("overview");

  return (
    <div className="mt-14">
      {/* Tab Bar */}
      <div className="flex border-b border-white/20 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`relative px-5 py-3 text-sm font-bold transition-colors ${
              active === tab.key ? "text-teal-300" : "text-white hover:text-teal-200"
            }`}
          >
            {tab.label}
            {active === tab.key && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-400 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
        >
          {/* Overview */}
          {active === "overview" && (
            <div className="space-y-6">
              {description && (
                <p className="text-sm text-white/80 leading-relaxed">{description}</p>
              )}
              {gallery && gallery.length > 0 && (
                <div className={`grid grid-cols-1 gap-4 ${
                  gallery.length === 1 ? "" : gallery.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-3"
                }`}>
                  {gallery.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="relative h-52 sm:h-64 rounded-2xl overflow-hidden group"
                    >
                      <Image
                        src={item.url}
                        alt={item.caption}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <p className="absolute bottom-4 right-4 left-4 text-white text-sm font-bold">{item.caption}</p>
                    </motion.div>
                  ))}
                </div>
              )}
              {specs && Object.values(specs).some(Boolean) && (
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <div className="bg-white/10 px-5 py-3 border-b border-white/10">
                    <h3 className="text-sm font-bold text-teal-300">المواصفات الرئيسية</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {Object.entries(specs)
                      .filter(([, v]) => v)
                      .map(([key, value], ii) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-5 py-3.5 border-b border-white/10 ${
                            ii % 2 === 0 ? "sm:border-l" : ""
                          }`}
                        >
                          <span className="text-xs text-white/70">{SPEC_LABELS[key] ?? key}</span>
                          <span className="text-xs font-semibold text-teal-300">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {!description && (!gallery || gallery.length === 0) && (!specs || !Object.values(specs).some(Boolean)) && (
                <p className="text-sm text-white/60">لا توجد نظرة عامة متاحة.</p>
              )}
            </div>
          )}

          {/* Specs */}
          {active === "specs" && (
            <div className="space-y-6">
              {specifications && specifications.length > 0 ? (
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  {specifications.map((group, gi) => (
                    <div key={gi}>
                      <div className="bg-white/10 px-5 py-3 border-b border-white/10">
                        <h3 className="text-sm font-bold text-teal-300">{group.groupName}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2">
                        {group.items.map((item, ii) => (
                          <div
                            key={ii}
                            className={`flex items-center justify-between px-5 py-3.5 border-b border-white/10 ${
                              ii % 2 === 0 ? "sm:border-l" : ""
                            }`}
                          >
                            <span className="text-xs text-white/70">{item.label}</span>
                            <span className="text-xs font-semibold text-teal-300">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : specs && Object.values(specs).some(Boolean) ? (
                <div className="rounded-2xl border border-white/10 overflow-hidden">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {Object.entries(specs)
                      .filter(([, v]) => v)
                      .map(([key, value], ii) => (
                        <div
                          key={key}
                          className={`flex items-center justify-between px-5 py-3.5 border-b border-white/10 ${
                            ii % 2 === 0 ? "sm:border-l" : ""
                          }`}
                        >
                          <span className="text-xs text-white/70">{SPEC_LABELS[key] ?? key}</span>
                          <span className="text-xs font-semibold text-teal-300">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/60">لا توجد مواصفات متاحة.</p>
              )}
            </div>
          )}

          {/* Reviews */}
          {active === "reviews" && (
            <div>
              {reviews && reviews.length > 0 ? (
                <>
                  {rating && (
                    <div className="flex items-center gap-2 bg-amber-500/10 px-3 py-1.5 rounded-full w-fit mb-6">
                      <IoStar size={14} className="text-amber-400" />
                      <span className="text-sm font-bold text-amber-700">{rating.average}</span>
                      <span className="text-[10px] text-amber-600">({rating.count})</span>
                    </div>
                  )}
                  <div className="space-y-4">
                    {reviews.map((review, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="bg-white/10 rounded-xl border border-white/20 p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-teal-300">{review.name[0]}</span>
                            </div>
                            <span className="text-sm font-bold text-white">{review.name}</span>
                          </div>
                          <span className="text-[10px] text-white/60">{review.date}</span>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <IoStar key={si} size={12} className={si < review.rate ? "text-amber-400" : "text-gray-200"} />
                          ))}
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed">{review.comment}</p>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/60">لا توجد تقييمات بعد.</p>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
