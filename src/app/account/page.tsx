"use client";

import dynamic from "next/dynamic";

const AccountPage = dynamic(() => import("../../views/Account"), {
  ssr: false,
  loading: () => <div>Loading...</div>,
});

export default function Page() {
  return <AccountPage />;
}
