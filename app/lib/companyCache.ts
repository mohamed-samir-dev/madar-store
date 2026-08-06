import { unstable_cache } from "next/cache";

const BACKEND = process.env.BACKEND_URL || "http://localhost:5000";

export const COMPANY_TAG = "company";

export const getCompanyData = unstable_cache(
  async () => {
    const res = await fetch(`${BACKEND}/api/admin/company`);
    return res.ok ? res.json() : {};
  },
  ["company-data"],
  { tags: [COMPANY_TAG], revalidate: false }
);
