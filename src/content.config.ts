import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
    // Optional: omit it and the build estimates it from word count.
    time: z.number().int().positive().optional(),
    featured: z.boolean().default(false),
    image: z.string().optional(),
    timestamp: z.coerce.date(),
  }),
});

export const collections = { blog };
