import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * Object storage abstraction. Uses a local filesystem driver for dev/CI; in
 * production set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY and the Supabase
 * Storage driver is used instead (buckets created by infra/supabase/storage.sql).
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly root = process.env.LOCAL_STORAGE_DIR || join(process.cwd(), '.storage');
  private readonly useSupabase = !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

  /** Store bytes at bucket/path; returns the stored object path. */
  async put(bucket: string, path: string, bytes: Buffer, contentType: string): Promise<string> {
    if (this.useSupabase) return this.putSupabase(bucket, path, bytes, contentType);
    const full = join(this.root, bucket, path);
    await fs.mkdir(dirname(full), { recursive: true });
    await fs.writeFile(full, bytes);
    this.logger.debug(`stored ${bucket}/${path} (${bytes.length} bytes) locally`);
    return `${bucket}/${path}`;
  }

  /** A retrievable URL for an object. Local driver serves via the API /files route. */
  async url(objectPath: string): Promise<string> {
    if (this.useSupabase) {
      const base = process.env.SUPABASE_URL!.replace(/\/$/, '');
      return `${base}/storage/v1/object/sign/${objectPath}`;
    }
    return `/files/${objectPath}`;
  }

  /** Read an object back (local driver only — used by the /files route). */
  async read(objectPath: string): Promise<Buffer> {
    return fs.readFile(join(this.root, objectPath));
  }

  private async putSupabase(bucket: string, path: string, bytes: Buffer, contentType: string): Promise<string> {
    const base = process.env.SUPABASE_URL!.replace(/\/$/, '');
    const res = await fetch(`${base}/storage/v1/object/${bucket}/${path}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'content-type': contentType,
        'x-upsert': 'true',
      },
      body: new Uint8Array(bytes),
    });
    if (!res.ok) throw new Error(`Supabase storage upload failed: ${res.status} ${await res.text()}`);
    return `${bucket}/${path}`;
  }
}
