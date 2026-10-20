import type { Metadata } from "next";
import { notFound } from "next/navigation";
import FontPicker from "@/components/font-picker/FontPicker";

export const metadata: Metadata = { title: "Font Picker", robots: { index: false } };

// Try font pairings on the real pages before one goes into app/layout.tsx:
// a site page in a frame, its headlines, body and labels swapped live. Not
// linked from anywhere: visit /font-picker directly. A dev tool only:
// production 404s it, like /sprite-editor.
export default function FontPickerPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <FontPicker />;
}
