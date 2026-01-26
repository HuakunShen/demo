import tailwind from "bun-plugin-tailwind";

Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "dist",
  target: "bun",
});

Bun.build({
  entrypoints: ["public/index.tsx"],
  outdir: "dist/public",
  target: "browser",
  minify: true,
  plugins: [tailwind],
});

Bun.write("dist/public/index.html", `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>HKCC Dashboard</title>
    <link rel="stylesheet" href="./index.css" />
  </head>
  <body>
    <div id="elysia"></div>
    <script type="module" src="./index.js"></script>
  </body>
</html>
`)