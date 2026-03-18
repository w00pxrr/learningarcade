import categoryMeta from "../../../data/categoryMeta.json";
import { gamesByCategory } from "../../../data/games";
import ClientCategoryPage from "./client";

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

export default function Page() {
  return <ClientCategoryPage />;
}
