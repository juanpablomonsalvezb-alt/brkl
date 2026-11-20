import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// El hash es independiente del directorio absoluto y no incluye credenciales,
// bases de datos ni los propios snapshots. Conservador: cualquier cambio de
// cliente o shared exige regenerar el HTML para no mezclar versiones.
export function snapshotSourceHash(root = process.cwd()): string {
  const paths: string[] = ["client/index.html", "script/prerender.ts"];
  function collect(dir: string) {
    for (const entry of readdirSync(join(root, dir), { withFileTypes: true })) {
      const path = `${dir}/${entry.name}`;
      if (entry.isDirectory()) collect(path);
      else if (/\.(tsx?|mjs|css)$/.test(entry.name)) paths.push(path);
    }
  }
  collect("client/src");
  collect("shared");
  const hash = createHash("sha256");
  for (const path of paths.sort()) hash.update(path).update("\0").update(readFileSync(join(root, path))).update("\0");
  return hash.digest("hex");
}
