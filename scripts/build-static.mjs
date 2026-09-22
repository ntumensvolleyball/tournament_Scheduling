import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "dist");
const allowed = new Set([".html", ".css", ".js", ".png", ".jpg", ".jpeg", ".svg", ".webp", ".ico", ".woff", ".woff2"]);

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

async function copy(relative) {
    const target = join(output, relative);
    await mkdir(dirname(target), { recursive: true });
    await cp(join(root, relative), target);
}

async function copyDirectory(relative) {
    for (const entry of await readdir(join(root, relative), { withFileTypes: true })) {
        const path = join(relative, entry.name);
        if (entry.isDirectory()) await copyDirectory(path);
        else if (entry.isFile() && allowed.has(extname(entry.name))) await copy(path);
    }
}

for (const file of ["index.html", "public.html", "login.html", "admin.html", "404.html", "_headers"]) await copy(file);
for (const directory of ["src/pages", "src/utility", "src/assets"]) await copyDirectory(directory);
await copy("src/config.js");
console.log("Static site ready in dist/. Backups, tests, SQL, and reference files were excluded.");
