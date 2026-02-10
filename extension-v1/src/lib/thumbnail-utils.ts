/**
 * Converts YouTube thumbnail URLs from hqdefault (4:3 with letterboxing)
 * to mqdefault (native 16:9) for cleaner card visuals.
 *
 * This helper ensures existing database records with old URLs
 * are automatically upgraded during rendering.
 */
export function getThumbnailUrl(url: string | undefined): string {
  if (!url) return "";

  // Replace hqdefault with mqdefault for 16:9 native aspect ratio
  return url.replace(/hqdefault\.jpg/, "mqdefault.jpg");
}
