export * from "../lib/utils.js"

export function createPageUrl(name) {
  const slug = String(name).trim();
  if (!slug) return "/";
  const path = slug.startsWith("/") ? slug : `/${slug}`;
  return path;
}
