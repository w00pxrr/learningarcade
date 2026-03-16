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
    };

export interface GameData {
  id: string;
  name: string;
  href: string;
  img: string;
  type: string;
  section: string;
  category: string;
  index: number;
  searchName: string;
  searchTokens: string[];
}

function isSectionEntry(entry: GamListItem): entry is GamListSection {
  return "title" in entry && entry.title !== undefined;
}

export function getCategory(name: string): string {
  const lower = name.toLowerCase();
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
    return "sports";
  if (
    lower.includes("horror") ||
    lower.includes("five nights") ||
    lower.includes("five nights at") ||
    lower.includes("fnae") ||
    lower.includes("fnaf")
  )
    return "horror";
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
    return "racing";
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
    return "puzzle";
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
    return "tools";
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
    return "runner";
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
    return "simulation";
  if (
    lower.includes("mario") ||
    lower.includes("platformer") ||
    lower.includes("platform") ||
    lower.includes("side-scroller") ||
    lower.includes("side scroller")
  )
    return "platformer";
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
    return "action";
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
    return "adventure";
  return "action";
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
  gamesData.push({
    id: gameId,
    name: gam.name,
    href: gam.href ?? "games/" + imgName + ".html",
    img: gam.img ?? (gam.src ? "img/" + gam.src : "img/" + imgName + ".jpeg"),
    type: gam.type ?? "",
    section: currentSection || "Other",
    category: getCategory(gam.name),
    index: gamesData.length,
    searchName,
    searchTokens,
  });
}

for (const game of gamesData) {
  gamesById[game.id] = game;
  if (!gamesByCategory[game.category]) gamesByCategory[game.category] = [];
  gamesByCategory[game.category].push(game);
}
