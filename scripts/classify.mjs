const RULES = [
  {
    category: "设计工具",
    keywords: [
      ["figma", 8], ["sketch", 7], ["adobe", 5], ["photoshop", 7],
      ["illustrator", 7], ["canva", 7], ["framer", 7], ["webflow", 6],
      ["设计工具", 7], ["设计系统", 7], ["design system", 7], ["原型", 5]
    ]
  },
  {
    category: "图像与视频",
    keywords: [
      ["图像生成", 7], ["文生图", 7], ["image generation", 7], ["生图", 6],
      ["视频生成", 7], ["文生视频", 7], ["midjourney", 8], ["stable diffusion", 8],
      ["flux", 5], ["sora", 5], ["可灵", 5], ["即梦", 5], ["海报", 6],
      ["runway", 5], ["配图", 6], ["视觉", 4], ["视频", 3], ["图像", 3],
      ["摄影", 3], ["3d", 3]
    ]
  },
  {
    category: "产品与体验",
    keywords: [
      ["ui/ux", 8], ["ui", 5], ["ux", 5], ["用户体验", 8], ["交互设计", 8],
      ["产品设计", 8], ["界面设计", 8], ["design", 4], ["designer", 5],
      ["设计师", 6], ["设计", 4], ["界面", 4], ["交互", 4], ["产品经理", 3]
    ]
  },
  {
    category: "工作流与 Agent",
    keywords: [
      ["agent", 1], ["智能体", 1], ["工作流", 4], ["workflow", 4],
      ["vibe coding", 3], ["vibe design", 8], ["提示词", 3], ["prompt", 3],
      ["自动化", 3], ["automation", 3], ["codex", 2], ["claude code", 2],
      ["mcp", 1], ["skill", 1], ["原型生成", 7]
    ]
  },
  {
    category: "行业观察",
    keywords: [
      ["创意行业", 6], ["设计行业", 7], ["广告", 4], ["创意", 4],
      ["版权", 3], ["品牌", 3], ["营销", 3], ["内容创作", 4],
      ["creator", 4], ["creative", 4]
    ]
  }
];

const CATEGORY_REASON = {
  "设计工具": "直接影响设计工具链与交付方式",
  "图像与视频": "可用于视觉探索、素材生产或动态内容",
  "产品与体验": "与产品体验、交互判断和界面设计相关",
  "工作流与 Agent": "可能改变需求分析、设计审查或自动化流程",
  "行业观察": "值得关注其对设计业务与创意行业的影响"
};

const CATEGORY_PRIORITY = {
  "设计工具": 5,
  "产品与体验": 4,
  "图像与视频": 3,
  "工作流与 Agent": 1,
  "行业观察": 0
};

function containsKeyword(text, keyword) {
  const normalized = keyword.toLowerCase();
  if (!/^[a-z0-9 /.-]+$/.test(normalized)) return text.includes(normalized);
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
}

export function classifyItem(item) {
  const text = `${item.title ?? ""} ${item.title_en ?? ""} ${item.summary ?? ""}`.toLowerCase();
  const matches = [];
  const scores = new Map();

  for (const rule of RULES) {
    let score = 0;
    for (const [keyword, weight] of rule.keywords) {
      if (containsKeyword(text, keyword)) {
        score += weight;
        matches.push({ keyword, weight, category: rule.category });
      }
    }
    scores.set(rule.category, score);
  }

  const [category, keywordScore] = [...scores.entries()].sort((a, b) => b[1] - a[1])[0];
  const sourceScore = Math.min(2, Math.round((Number(item.score) || 0) / 40));
  const relevanceScore = keywordScore + sourceScore;
  const tags = [...new Set(matches.sort((a, b) => b.weight - a.weight).map((match) => match.keyword))].slice(0, 4);

  return {
    ...item,
    designCategory: category,
    relevanceScore,
    editorialScore: relevanceScore + CATEGORY_PRIORITY[category],
    tags,
    whyItMatters: CATEGORY_REASON[category]
  };
}

export function selectDesignNews(items, minimumScore = 5) {
  const seenUrls = new Set();

  return items
    .map(classifyItem)
    .filter((item) => item.relevanceScore >= minimumScore)
    .filter((item) => {
      const key = item.url || item.id;
      if (!key || seenUrls.has(key)) return false;
      seenUrls.add(key);
      return true;
    })
    .sort((a, b) => {
      const relevance = b.editorialScore - a.editorialScore;
      if (relevance !== 0) return relevance;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    });
}

export const DESIGN_CATEGORIES = RULES.map((rule) => rule.category);
