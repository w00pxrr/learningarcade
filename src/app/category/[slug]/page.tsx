import { Metadata } from "next";
import categoryMeta from "../../../data/categoryMeta.json";
import { gamesByCategory } from "../../../data/games";
import ClientCategoryPage from "./client";

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return categoryMeta.items
    .filter((item) => {
      if (["all", "favorites", "popular"].includes(item.value)) return true;
      return (gamesByCategory[item.value] ?? []).length > 0;
    })
    .map((item) => ({
      slug: item.value,
    }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = params.slug;
  const categoryItem = categoryMeta.items.find((item) => item.value === category);
  const label = categoryItem?.label ?? category ?? "Games";
  const gameCount = (gamesByCategory[category] ?? []).length;

  const title = `${label} Games - Play Free Online | LearningArcade`;
  const description = `Play ${gameCount}+ free ${(label ?? "games").toLowerCase()} games online on LearningArcade. Safe, school-friendly, and works on any device. No downloads required.`;
  const url = `https://learningarcade.vercel.app/category/${category}`;

  return {
    title,
    description,
    keywords: [
      `${label} games`,
      `free ${(label ?? "games").toLowerCase()} games`,
      `online ${(label ?? "games").toLowerCase()} games`,
      "unblocked games",
      "school games",
      "browser games",
      "HTML5 games",
    ].join(", "),
    openGraph: {
      title,
      description,
      url,
      siteName: "LearningArcade",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: "/img/Learning Arcade Background Removed.png",
          width: 1200,
          height: 630,
          alt: `${label} Games on LearningArcade`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/img/Learning Arcade Background Removed.png"],
    },
    robots: "index, follow",
    alternates: {
      canonical: url,
    },
  };
}

export default function Page() {
  return <ClientCategoryPage />;
}
