import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

const byNewest = (a: Post, b: Post) =>
  b.data.timestamp.getTime() - a.data.timestamp.getTime();

export async function getPosts(): Promise<Post[]> {
  const posts = await getCollection("blog");
  return posts.sort(byNewest);
}

export const postUrl = (post: Post) => `/blog/${post.id}/`;

/** Frontmatter wins; otherwise estimate from word count at 200 wpm. */
export function readTime(post: Post): number {
  if (post.data.time) return post.data.time;
  const words = (post.body ?? "").trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}
