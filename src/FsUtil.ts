import * as fs from 'fs';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

export const readFile = promisify(fs.readFile);
export const writeFile = promisify(fs.writeFile);
export const rename = promisify(fs.rename);
export const unlink = promisify(fs.unlink);
export const exists = promisify(fs.exists);

export async function writeFileAtomic(
  path: fs.PathLike, data: string | NodeJS.ArrayBufferView, options: fs.WriteFileOptions): Promise<void> {

  const tempFile = path + "-temp-" + randomBytes(6).toString('hex');;

  try {
    await writeFile(tempFile, data, options);

    await rename(tempFile, path)
  } finally {
    if (await exists(tempFile)) {
      await unlink(tempFile);
    }
  }
}
