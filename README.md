# 设计 AI 雷达

面向产品与视觉设计师的 AI 热点聚合网站。它从 AI HOT 的最近 7 天内容中抓取网站、X 和公众号资讯，通过设计关键词评分、分类、来源配额和去重，生成可直接部署的静态站点。

## 本地运行

```powershell
node scripts/fetch-news.mjs
node scripts/serve.mjs
```

浏览器打开 `http://localhost:4173`。

运行测试：

```powershell
node --test
```

## 自动更新

`.github/workflows/update-and-deploy.yml` 每天北京时间 `08:17`、`14:17`、`20:17` 自动：

1. 获取最近 7 天的全部 AI 资讯，最多读取 500 条。
2. 识别网站、X 和公众号来源，并筛选与设计工具、产品体验、图像视频、Agent 工作流和创意行业有关的条目。
3. 更新 `site/data/news.json` 并提交。
4. 发布到 GitHub Pages。

也可以在 GitHub Actions 页面手动运行。

## 部署

1. 将 `design-ai-radar` 目录推送到一个 GitHub 仓库的 `main` 分支。
2. 在仓库 `Settings > Pages > Build and deployment` 中将 Source 设为 `GitHub Actions`。
3. 首次手动运行 `Update and deploy Design AI Radar`，之后无需本机在线。

## 调整筛选规则

编辑 `scripts/classify.mjs` 中的关键词和权重。最低入选分数在 `scripts/fetch-news.mjs` 调用 `selectDesignNews` 时调整。

数据源：AI HOT。摘要用于快速判断，不应替代原文。
