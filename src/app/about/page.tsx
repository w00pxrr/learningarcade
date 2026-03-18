"use client";

import dynamic from "next/dynamic";

const AboutPage = dynamic(() => import("../../views/About"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  return <AboutPage />;
}
