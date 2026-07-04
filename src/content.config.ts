import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const concepts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/concepts" }),
  schema: z.object({
    title_ja: z.string(),
    title_en: z.string(),
    domain: z.enum(["math", "stats", "ml", "physics", "electricity", "language"]),
    level: z.number().int().min(1).max(5),
    prerequisites: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    viz: z.array(z.enum(["static", "interactive", "manim"])).default([]),
    status: z.enum(["stub", "draft", "migrated", "polished"]).default("stub"),
    source: z.string().optional()
  })
});

export const collections = { concepts };
