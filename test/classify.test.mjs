import assert from "node:assert/strict";
import test from "node:test";
import { classifyItem, selectDesignNews } from "../scripts/classify.mjs";

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
