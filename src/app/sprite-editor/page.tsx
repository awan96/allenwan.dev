import { notFound } from "next/navigation";
import Nav from "@/components/Nav";
import SpriteEditor from "@/components/sprite-editor/SpriteEditor";

export const metadata = { title: "Sprite Editor" };

// Standalone sprite workbench for every pixel library on the site (game
// icons, game art, site sprites). Not linked from the site nav on purpose —
// visit /sprite-editor directly. A dev tool only: production 404s it.
export default function SpriteEditorPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <Nav />
      <SpriteEditor />
    </>
  );
}
