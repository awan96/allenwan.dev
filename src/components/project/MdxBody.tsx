// src/components/project/MdxBody.tsx
// Renders a case study's MDX with the project kit.
//
// next-mdx-remote/rsc is on Next's server-external list, so it builds its
// elements with the React in node_modules (18), which the React that Next 16
// bundles refuses to render. So: compile with its serializer (keeping the
// guard that strips JS expressions out of the MDX), then run the result
// against the React this app renders with. The blog's renderer does the same.

import type { ComponentType } from "react";
import * as devRuntime from "react/jsx-dev-runtime";
import * as prodRuntime from "react/jsx-runtime";
import { serialize } from "next-mdx-remote/serialize";
import { mdxComponents } from "./mdx";

type MdxContent = ComponentType<{ components: typeof mdxComponents }>;

export default async function MdxBody({ source }: { source: string }) {
  const { compiledSource } = await serialize(source, {}, true);
  // The compiled body reads its JSX runtime from arguments[0]; the dev build
  // compiles to jsxDEV, so it needs the dev runtime.
  const runtime = process.env.NODE_ENV === "production" ? prodRuntime : devRuntime;
  const { default: Content } = new Function(compiledSource)(runtime) as { default: MdxContent };
  return <Content components={mdxComponents} />;
}
