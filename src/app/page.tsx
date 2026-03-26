import { Metadata } from "next";
import HomePage from "../views/Home";

export const metadata: Metadata = {
  title: "LearningArcade | Free Online Games for School",
  description:
    "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more. Works on any device - no downloads required.",
  keywords: [
    "online games",
    "free games",
    "unblocked games",
    "school games",
    "browser games",
    "HTML5 games",
    "educational games",
    "action games",
    "puzzle games",
    "racing games",
    "sports games",
    "strategy games",
    "simulation games",
    "platformer games",
    "arcade games",
    "flash games",
    "retro games",
    "games for school",
    "games for kids",
    "safe games",
  ].join(", "),
  openGraph: {
    title: "LearningArcade | Free Online Games for School",
    description:
      "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more. Works on any device.",
    url: "https://learningarcade.vercel.app/",
    siteName: "LearningArcade",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/img/Learning Arcade Background Removed.png",
        width: 1200,
        height: 630,
        alt: "LearningArcade - Free Online Games",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LearningArcade | Free Online Games for School",
    description:
      "Play free online games on LearningArcade. Safe, school-friendly unblocked games including action, puzzle, racing, sports, and more.",
    images: ["/img/Learning Arcade Background Removed.png"],
  },
  robots: "index, follow",
  alternates: {
    canonical: "https://learningarcade.vercel.app",
  },
};

export default function Page() {
  return <HomePage />;
}
