"use client";

import dynamic from "next/dynamic";

const SearchPage = dynamic(() => import("../../views/Search"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  return <SearchPage />;
}
