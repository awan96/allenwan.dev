// Each case study's share image carries its own title (lib/shareImage.tsx).
import { getAllProjects, getProject } from "@/lib/projects";
import { SITE } from "@/site";
import { SHARE_SIZE, SHARE_TYPE, SITE_HOST, shareImage } from "@/lib/shareImage";

export const alt = `A case study by ${SITE.name}`;
export const size = SHARE_SIZE;
export const contentType = SHARE_TYPE;

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  return shareImage({
    eyebrow: `Case study · ${SITE_HOST}`,
    title: project?.title ?? SITE.name,
    subtitle: `${SITE.name} · ${SITE.role}`,
  });
}
