import { MetadataRoute } from "next";
import { gamesData } from "../data/games";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://learningarcade.qzz.io";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Category pages
  const categories = [
    "action",
    "adventure",
    "puzzle",
    "racing",
    "sports",
    "strategy",
    "simulation",
    "platformer",
    "runner",
    "idle",
    "tools",
    "horror",
    "retro",
    "flash",
  ];
  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/category/${category}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Game pages - each game gets its own entry
  const gamePages: MetadataRoute.Sitemap = gamesData.map((game) => ({
    url: `${baseUrl}/game/${game.id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...categoryPages, ...gamePages];
}
