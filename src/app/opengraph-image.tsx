// The share image for every page without one of its own (lib/shareImage.tsx).
import { SITE } from "@/site";
import { SHARE_SIZE, SHARE_TYPE, SITE_HOST, shareImage } from "@/lib/shareImage";

export const alt = `${SITE.name} · ${SITE.role}`;
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;

export default function Image() {
  return shareImage({ eyebrow: SITE_HOST, title: SITE.name, subtitle: SITE.role });
}
