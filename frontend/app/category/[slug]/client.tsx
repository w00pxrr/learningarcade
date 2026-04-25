"use client";

import dynamic from "next/dynamic";

const CategoryPage = dynamic(() => import("../../../views/Category"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function ClientCategoryPage() {
  return <CategoryPage />;
}
