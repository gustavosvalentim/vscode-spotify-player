import * as esbuild from "esbuild";

await esbuild.build({
  define: {
    "process.env.CLIENT_ID": `"${process.env.CLIENT_ID}"`,
  },
  minify: true,
  bundle: true,
  entryPoints: ["src/**/*"],
  outdir: "out",
  platform: "node",
  packages: "external",
  sourcemap: true,
});
