const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A stray package-lock.json in the home directory made Next infer
  // /Users/allenwan as the workspace root, which resolves files from the
  // wrong place. Pin the root to this project.
  turbopack: {
    root: __dirname,
  },
  // The résumé opens in the browser, and a saved copy keeps a name someone
  // can find in their downloads, not "resume.pdf".
  async headers() {
    return [
      {
        source: "/resume.pdf",
        headers: [{ key: "Content-Disposition", value: 'inline; filename="Allen Wan - Resume.pdf"' }],
      },
    ];
  },
};

module.exports = nextConfig;
