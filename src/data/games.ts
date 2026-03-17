import gamesListRaw from "./games.json";
import { normalizeSearchText } from "../utils/search";

export type GamListSection = { title: string; type: "section" };
export type GamListItem =
  | GamListSection
  | {
      name: string;
      id?: string;
      href?: string;
      img?: string;
      src?: string;
      type?: string;
      categories?: string[];
      mobileFriendly?: boolean;
      desktopOnly?: boolean;
    };

export interface GameData {
  id: string;
  name: string;
  href: string;
  img: string;
  type: string;
  section: string;
  category: string;
  categories: string[];
  mobileFriendly: boolean;
  desktopOnly: boolean;
  index: number;
  searchName: string;
  searchTokens: string[];
}

function isSectionEntry(entry: GamListItem): entry is GamListSection {
  return "title" in entry && entry.title !== undefined;
}

function getAutoCategories(name: string, section: string): string[] {
  const lower = name.toLowerCase();
  const categories = new Set<string>();

  if (section === "Retro") categories.add("retro");
  if (section === "Flash") categories.add("flash");
  if (
    lower.includes("soccer") ||
    lower.includes("football") ||
    lower.includes("sports") ||
    lower.includes("basketball") ||
    lower.includes("baseball") ||
    lower.includes("hockey") ||
    lower.includes("tennis") ||
    lower.includes("golf") ||
    lower.includes("bowling") ||
    lower.includes("boxing") ||
    lower.includes("mma") ||
    lower.includes("wrestling") ||
    lower.includes("cricket") ||
    lower.includes("rugby") ||
    lower.includes("volleyball") ||
    lower.includes("skate") ||
    lower.includes("skating") ||
    lower.includes("ski") ||
    lower.includes("skiing") ||
    lower.includes("snowboard") ||
    lower.includes("surfing") ||
    lower.includes("olympic") ||
    lower.includes("fifa") ||
    lower.includes("nba") ||
    lower.includes("nfl") ||
    lower.includes("mlb")
  )
    categories.add("sports");
  if (
    lower.includes("horror") ||
    lower.includes("five nights") ||
    lower.includes("five nights at") ||
    lower.includes("fnae") ||
    lower.includes("fnaf")
  )
    categories.add("horror");
  if (
    lower.includes("racing") ||
    lower.includes("race") ||
    lower.includes("drift") ||
    lower.includes("drift boss") ||
    lower.includes("madalin") ||
    lower.includes("drive") ||
    lower.includes("kart") ||
    lower.includes("rally") ||
    lower.includes("speed") ||
    lower.includes("track") ||
    lower.includes("duck life")
  )
    categories.add("racing");
  if (
    lower.includes("puzzle") ||
    lower.includes("quiz") ||
    lower.includes("bloxorz") ||
    lower.includes("tetris") ||
    lower.includes("2048") ||
    lower.includes("wordle") ||
    lower.includes("impossible") ||
    lower.includes("logic") ||
    lower.includes("trivia") ||
    lower.includes("word") ||
    lower.includes("words") ||
    lower.includes("crossword") ||
    lower.includes("sudoku") ||
    lower.includes("jigsaw") ||
    lower.includes("block") ||
    lower.includes("match") ||
    lower.includes("match-3") ||
    lower.includes("memory") ||
    lower.includes("hidden") ||
    lower.includes("maze") ||
    lower.includes("labyrinth") ||
    lower.includes("escape") ||
    lower.includes("brain") ||
    lower.includes("riddle") ||
    lower.includes("tiles")
  )
    categories.add("puzzle");
  if (
    lower.includes("code editor") ||
    lower.includes("web retro") ||
    lower.includes("proxy browser") ||
    lower.includes("calculator") ||
    lower.includes("ruffle flash player") ||
    lower.includes("editor") ||
    lower.includes("ide") ||
    lower.includes("terminal") ||
    lower.includes("shell") ||
    lower.includes("emulator") ||
    lower.includes("utility") ||
    lower.includes("notes") ||
    lower.includes("planner") ||
    lower.includes("timer") ||
    lower.includes("stopwatch") ||
    lower.includes("recorder") ||
    lower.includes("sandbox") ||
    lower.includes("lab")
  )
    categories.add("tools");
  if (
    lower.includes("run") ||
    lower.includes("slope") ||
    lower.includes("tunnel rush") ||
    lower.includes("drift boss") ||
    lower.includes("subway surfers") ||
    lower.includes("tanuki sunset") ||
    lower.includes("tanuki") ||
    lower.includes("endless") ||
    lower.includes("runner") ||
    lower.includes("dash") ||
    lower.includes("jump") ||
    lower.includes("temple") ||
    lower.includes("tunnel") ||
    lower.includes("rush") ||
    lower.includes("sprint") ||
    lower.includes("parkour")
  )
    categories.add("runner");
  if (
    lower.includes("simulation") ||
    lower.includes("simulator") ||
    lower.includes("sim") ||
    lower.includes("tycoon") ||
    lower.includes("management") ||
    lower.includes("builder") ||
    lower.includes("factory") ||
    lower.includes("idle") ||
    lower.includes("clicker") ||
    lower.includes("ai creatures") ||
    lower.includes("grey box") ||
    lower.includes("greybox")
  )
    categories.add("simulation");
  if (
    lower.includes("mario") ||
    lower.includes("platformer") ||
    lower.includes("platform") ||
    lower.includes("side-scroller") ||
    lower.includes("side scroller")
  )
    categories.add("platformer");
  if (
    lower.includes("rpg") ||
    lower.includes("role-playing") ||
    lower.includes("role playing") ||
    lower.includes("jrpg")
  )
    categories.add("role-playing");
  if (
    lower.includes("strategy") ||
    lower.includes("tower defense") ||
    lower.includes("tactics") ||
    lower.includes("turn-based") ||
    lower.includes("chess")
  )
    categories.add("strategy");
  if (
    lower.includes("idle") ||
    lower.includes("incremental") ||
    lower.includes("clicker")
  )
    categories.add("idle");
  if (
    lower.includes("action-adventure") ||
    lower.includes("action adventure")
  ) {
    categories.add("action-adventure");
    categories.add("action");
    categories.add("adventure");
  }
  if (
    lower.includes("mario") ||
    lower.includes("sonic") ||
    lower.includes("geometry dash") ||
    lower.includes("tunnel") ||
    lower.includes("madalin") ||
    lower.includes("stickman") ||
    lower.includes("qwop") ||
    lower.includes("aim") ||
    lower.includes("snake") ||
    lower.includes("pacman") ||
    lower.includes("cat ninja") ||
    lower.includes("burrito bison") ||
    lower.includes("hole io") ||
    lower.includes("tube jumpers") ||
    lower.includes("agario") ||
    lower.includes("paper io") ||
    lower.includes("cell machine") ||
    lower.includes("evil glitch") ||
    lower.includes("game inside") ||
    lower.includes("grey box") ||
    lower.includes("ai creatures") ||
    lower.includes("fluid simulator") ||
    lower.includes("mountain maze") ||
    lower.includes("radius raid") ||
    lower.includes("rolling forests") ||
    lower.includes("stack") ||
    lower.includes("its raining boxes") ||
    lower.includes("sand game") ||
    lower.includes("offline paradise") ||
    lower.includes("spacebar clicker") ||
    lower.includes("cube field") ||
    lower.includes("cookie clicker") ||
    lower.includes("arcade") ||
    lower.includes("shooter") ||
    lower.includes("shootemup") ||
    lower.includes("shmup") ||
    lower.includes("beat em up") ||
    lower.includes("beat-em-up") ||
    lower.includes("hack and slash") ||
    lower.includes("brawler") ||
    lower.includes("fighting") ||
    lower.includes("roguelike") ||
    lower.includes("roguelite") ||
    lower.includes("stealth") ||
    lower.includes("battle") ||
    lower.includes("arena") ||
    lower.includes("top-down") ||
    lower.includes("twin-stick") ||
    lower.includes("physics") ||
    lower.includes("ragdoll")
  )
    categories.add("action");
  if (
    lower.includes("adventure") ||
    lower.includes("retro") ||
    lower.includes("celeste") ||
    lower.includes("portal") ||
    lower.includes("fireboy") ||
    lower.includes("watergirl") ||
    lower.includes("raft") ||
    lower.includes("worlds hardest") ||
    lower.includes("escaping") ||
    lower.includes("infiltrating") ||
    lower.includes("fleeing") ||
    lower.includes("breaking") ||
    lower.includes("stealing") ||
    lower.includes("bloons tower defense") ||
    lower.includes("learn to fly") ||
    lower.includes("papas") ||
    lower.includes("just one boss") ||
    lower.includes("40x escape") ||
    lower.includes("use boxmen") ||
    lower.includes("doom") ||
    lower.includes("johnny upgrade") ||
    lower.includes("ruffle") ||
    lower.includes("rpg") ||
    lower.includes("role-playing") ||
    lower.includes("quest") ||
    lower.includes("story") ||
    lower.includes("narrative") ||
    lower.includes("exploration") ||
    lower.includes("open world") ||
    lower.includes("metroidvania") ||
    lower.includes("point and click") ||
    lower.includes("visual novel") ||
    lower.includes("interactive") ||
    lower.includes("dungeon") ||
    lower.includes("crawler") ||
    lower.includes("survival-craft") ||
    lower.includes("crafting") ||
    lower.includes("sandbox")
  )
    categories.add("adventure");

  if (categories.size === 0) categories.add("action");
  return Array.from(categories);
}

function resolveCategories(entry: GamListItem, section: string): string[] {
  if (!("name" in entry) || !entry.name) return ["action"];
  if (Array.isArray(entry.categories) && entry.categories.length > 0) {
    return entry.categories;
  }
  return getAutoCategories(entry.name, section);
}

const gamsList = gamesListRaw as GamListItem[];

export const sectionOrder: string[] = [];
export const gamesData: GameData[] = [];
export const gamesById: Record<string, GameData> = {};
export const gamesByCategory: Record<string, GameData[]> = {};

let currentSection = "";
for (let j = 0; j < gamsList.length; j++) {
  const gam = gamsList[j];
  if (isSectionEntry(gam)) {
    currentSection = gam.title;
    sectionOrder.push(gam.title);
    continue;
  }
  if (!("name" in gam) || !gam.name) continue;

  const imgName = gam.name.toLowerCase().replace(/\s/g, "");
  const gameId = gam.id ?? imgName;
  const searchName = normalizeSearchText(gam.name);
  const searchTokens = searchName ? searchName.split(" ").filter(Boolean) : [];
  const categories = resolveCategories(gam, currentSection || "Other");
  const desktopOnly =
    typeof gam.desktopOnly === "boolean"
      ? gam.desktopOnly
      : (currentSection || "Other") === "Flash";
  const mobileFriendly =
    typeof gam.mobileFriendly === "boolean" ? gam.mobileFriendly : !desktopOnly;
  gamesData.push({
    id: gameId,
    name: gam.name,
    href: gam.href ?? "games/" + imgName + ".html",
    img: gam.img ?? (gam.src ? "img/" + gam.src : "img/" + imgName + ".jpeg"),
    type: gam.type ?? "",
    section: currentSection || "Other",
    categories,
    category: categories[0] || "action",
    mobileFriendly,
    desktopOnly,
    index: gamesData.length,
    searchName,
    searchTokens,
  });
}

for (const game of gamesData) {
  gamesById[game.id] = game;
  for (const category of game.categories) {
    if (!gamesByCategory[category]) gamesByCategory[category] = [];
    gamesByCategory[category].push(game);
  }
}
