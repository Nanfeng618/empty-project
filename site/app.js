const state = { items: [], category: "全部", sourceType: "全部", query: "" };
const categories = ["全部", "设计工具", "产品与体验", "图像与视频", "工作流与 Agent", "行业观察"];
const sourceTypes = ["全部", "网站", "X", "公众号"];

const elements = {
  grid: document.querySelector("#news-grid"),
  filters: document.querySelector("#filters"),
  sourceFilters: document.querySelector("#source-filters"),
  search: document.querySelector("#search-input"),
  empty: document.querySelector("#empty-state"),
  clear: document.querySelector("#clear-filters"),
  template: document.querySelector("#news-card-template")
};

function relativeTime(value) {
  if (!value) return "时间待确认";
  const date = new Date(value);
  const hours = Math.max(0, Math.floor((Date.now() - date.getTime()) / 3_600_000));
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} 天前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(date);
}

function formatUpdateTime(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

function filteredItems() {
  const query = state.query.trim().toLowerCase();
  return state.items.filter((item) => {
    const categoryMatch = state.category === "全部" || item.designCategory === state.category;
    const sourceMatch = state.sourceType === "全部" || item.sourceType === state.sourceType;
    const haystack = `${item.title} ${item.summary ?? ""} ${item.source ?? ""} ${item.sourceType ?? ""} ${(item.tags ?? []).join(" ")}`.toLowerCase();
    return categoryMatch && sourceMatch && (!query || haystack.includes(query));
  });
}

function createFilterButton(label, count, active, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = active ? "active" : "";
  button.innerHTML = `<span>${label}</span><small>${String(count).padStart(2, "0")}</small>`;
  button.addEventListener("click", onClick);
  return button;
}

function renderFilters() {
  elements.filters.replaceChildren(...categories.map((category) => {
    const count = category === "全部" ? state.items.length : state.items.filter((item) => item.designCategory === category).length;
    return createFilterButton(category, count, category === state.category, () => {
      state.category = category;
      renderFilters();
      renderNews();
    });
  }));
}

function renderSourceFilters() {
  elements.sourceFilters.replaceChildren(...sourceTypes.map((sourceType) => {
    const count = sourceType === "全部" ? state.items.length : state.items.filter((item) => item.sourceType === sourceType).length;
    return createFilterButton(sourceType, count, sourceType === state.sourceType, () => {
      state.sourceType = sourceType;
      renderSourceFilters();
      renderNews();
    });
  }));
}

function createCard(item, index) {
  const card = elements.template.content.firstElementChild.cloneNode(true);
  card.style.setProperty("--delay", `${Math.min(index, 10) * 45}ms`);
  card.querySelector(".card-category").textContent = `${item.designCategory} · ${item.sourceType || "网站"}`;
  card.querySelector("time").textContent = relativeTime(item.publishedAt);
  card.querySelector("h3").textContent = item.title;
  card.querySelector(".card-summary").textContent = item.summary || "暂无摘要，请查看原文。";
  card.querySelector(".why").textContent = item.whyItMatters;
  card.querySelector(".source").textContent = item.source || "来源待确认";
  card.querySelector("a").href = item.url;
  return card;
}

function renderNews() {
  const items = filteredItems();
  elements.grid.replaceChildren(...items.map(createCard));
  elements.empty.hidden = items.length > 0;
}

function renderSpotlight(item) {
  if (!item) return;
  document.querySelector("#spotlight-category").textContent = `${item.designCategory} · 编辑推荐`;
  document.querySelector("#spotlight-title").textContent = item.title;
  document.querySelector("#spotlight-summary").textContent = item.summary || item.whyItMatters;
  const link = document.querySelector("#spotlight-link");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noreferrer";
  link.innerHTML = "阅读原文 <span>↗</span>";
}

async function init() {
  try {
    const response = await fetch("./data/news.json", { cache: "no-store" });
    if (!response.ok) throw new Error("资讯数据载入失败");
    const data = await response.json();
    state.items = data.items ?? [];
    document.querySelector("#story-count").textContent = String(state.items.length).padStart(2, "0");
    document.querySelector("#update-time").textContent = formatUpdateTime(data.generatedAt);
    document.querySelector("#edition").textContent = `${new Intl.DateTimeFormat("zh-CN", { month: "2-digit", day: "2-digit" }).format(new Date(data.generatedAt))} 更新`;
    const spotlight = state.items.find((item) => item.designCategory === "设计工具") || state.items[0];
    renderSpotlight(spotlight);
    renderFilters();
    renderSourceFilters();
    renderNews();
  } catch (error) {
    document.querySelector("#spotlight-title").textContent = "情报暂时离线";
    document.querySelector("#spotlight-summary").textContent = error.message;
    elements.empty.hidden = false;
  }
}

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderNews();
});

elements.clear.addEventListener("click", () => {
  state.category = "全部";
  state.sourceType = "全部";
  state.query = "";
  elements.search.value = "";
  renderFilters();
  renderSourceFilters();
  renderNews();
});

init();
