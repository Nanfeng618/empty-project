import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applySourceLimits, selectDesignNews } from "./classify.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUTPUT = resolve(ROOT, "site/data/news.json");
const ENDPOINT = "https://aihot.virxact.com/api/public/items";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36 aihot-skill/0.2.0 design-ai-radar/0.1.0";
const MAX_PAGES = 5;

async function fetchPage(cursor) {
  const url = new URL(ENDPOINT);
  url.searchParams.set("mode", "all");
  url.searchParams.set("since", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  url.searchParams.set("take", "100");
  if (cursor) url.searchParams.set("cursor", cursor);

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`AI HOT request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchAll() {
  const items = [];
  let cursor;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const result = await fetchPage(cursor);
    items.push(...(result.items ?? []));
    if (!result.hasNext || !result.nextCursor) break;
    cursor = result.nextCursor;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }

  return items;
}

async function previousGeneratedAt() {
  try {
    const previous = JSON.parse(await readFile(OUTPUT, "utf8"));
    return previous.generatedAt ?? null;
  } catch {
    return null;
  }
}

const sourceItems = await fetchAll();
const items = applySourceLimits(selectDesignNews(sourceItems, 6));

if (items.length === 0) {
  throw new Error("No design-related items matched; existing site data was preserved.");
}

const generatedAt = new Date().toISOString();
const sourceCounts = Object.fromEntries(
  Object.entries(Object.groupBy(items, (item) => item.sourceType)).map(([sourceType, sourceItemsForType]) => [sourceType, sourceItemsForType.length])
);
const payload = {
  generatedAt,
  previousGeneratedAt: await previousGeneratedAt(),
  sourceWindowDays: 7,
  sourceCount: sourceItems.length,
  itemCount: items.length,
  sourceCounts,
  source: {
    name: "AI HOT",
    url: "https://aihot.virxact.com"
  },
  items
};

await mkdir(dirname(OUTPUT), { recursive: true });
await writeFile(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Updated ${items.length} design stories from ${sourceItems.length} AI stories: ${JSON.stringify(sourceCounts)}.`);
