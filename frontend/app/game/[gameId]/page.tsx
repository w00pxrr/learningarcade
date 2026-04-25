import { Metadata } from "next";
import { gamesData, gamesById } from "../../../data/games";
import ClientGamePage from "./client";
// Ensure proper module resolution for client component

interface Props {
  params: Promise<{ gameId: string }>;
}

export async function generateStaticParams() {
  return gamesData.map((game) => ({
    gameId: game.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { gameId } = await params;
  const game = gamesById[gameId];

  if (!game) {
    return {
      title: "Game Not Found | LearningArcade",
      description: "The requested game could not be found.",
    };
  }

  const title = `${game.name} - Play Free Online | LearningArcade`;
  const description = `Play ${game.name} online for free on LearningArcade. ${game.categories.join(", ")} game. Safe, school-friendly, and works on any device.`;
  const url = `https://learningarcade.qzz.io/game/${game.id}`;
  const imageUrl = `https://learningarcade.qzz.io${game.img}`;

  return {
    title,
    description,
    keywords: [
      game.name,
      "online game",
      "free game",
      "unblocked game",
      "school game",
      ...game.categories,
      "browser game",
      "HTML5 game",
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
          url: imageUrl,
          width: 512,
          height: 512,
          alt: `${game.name} game thumbnail`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    robots: "index, follow",
    alternates: {
      canonical: url,
    },
    other: {
      "game:category": game.category,
      "game:mobile_friendly": game.mobileFriendly ? "true" : "false",
    },
  };
}

export default async function GamePage({ params }: Props) {
  const { gameId } = await params;
  return <ClientGamePage gameId={gameId} />;
}
