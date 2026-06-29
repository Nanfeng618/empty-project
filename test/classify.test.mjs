import assert from "node:assert/strict";
import test from "node:test";
import { applySourceLimits, classifyItem, detectSourceType, selectDesignNews } from "../scripts/classify.mjs";

test("classifies Figma news as design tools", () => {
  const result = classifyItem({ title: "Figma 发布 AI 原型与设计系统新功能", score: 90 });
  assert.equal(result.designCategory, "设计工具");
  assert.ok(result.relevanceScore >= 10);
  assert.ok(result.tags.includes("figma"));
});

test("filters unrelated general AI news", () => {
  const items = selectDesignNews([
    { id: "1", title: "芯片公司扩大数据中心投资", url: "https://example.com/1", score: 90 },
    { id: "2", title: "AI 图像生成工具加入海报设计功能", url: "https://example.com/2", score: 80 }
  ]);
  assert.deepEqual(items.map((item) => item.id), ["2"]);
});

test("deduplicates stories by source URL", () => {
  const items = selectDesignNews([
    { id: "1", title: "Figma AI 更新", url: "https://example.com/story" },
    { id: "2", title: "Figma AI 再次更新", url: "https://example.com/story" }
  ]);
  assert.equal(items.length, 1);
});

test("does not match ui and ux inside longer English words", () => {
  const result = classifyItem({
    title: "Building a guide for autonomous agents",
    summary: "A quick benchmark for infrastructure",
    score: 90
  });
  assert.ok(!result.tags.includes("ui"));
  assert.ok(!result.tags.includes("ux"));
});

test("treats generic agent news as too weak for the design feed", () => {
  const items = selectDesignNews([
    { id: "agent", title: "A new autonomous agent framework", url: "https://example.com/agent", score: 90 }
  ], 6);
  assert.equal(items.length, 0);
});

test("detects website, X, and WeChat source types", () => {
  assert.equal(detectSourceType("https://x.com/example/status/1"), "X");
  assert.equal(detectSourceType("https://twitter.com/example/status/1"), "X");
  assert.equal(detectSourceType("https://mp.weixin.qq.com/s/example"), "公众号");
  assert.equal(detectSourceType("https://example.com/article"), "网站");
  assert.equal(detectSourceType("not a url"), "网站");
});

test("limits noisy source types without removing other sources", () => {
  const items = [
    { id: "x1", sourceType: "X" },
    { id: "x2", sourceType: "X" },
    { id: "x3", sourceType: "X" },
    { id: "web", sourceType: "网站" },
    { id: "mp", sourceType: "公众号" }
  ];
  assert.deepEqual(
    applySourceLimits(items, { X: 2, 网站: 1, 公众号: 1 }).map((item) => item.id),
    ["x1", "x2", "web", "mp"]
  );
});
