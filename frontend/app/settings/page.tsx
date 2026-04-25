"use client";

import dynamic from "next/dynamic";

const SettingsPage = dynamic(() => import("../../views/Settings"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  return <SettingsPage />;
}
