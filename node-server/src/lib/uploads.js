import fs from 'fs/promises';

export function getUploadsDir() {
  if (process.env.RAILWAY_STATIC_URL) {
    return '/tmp/uploads';
  }
  if (process.env.PORT && !process.env.RAILWAY_STATIC_URL) {
    return '/tmp/uploads';
  }
  return './server/uploads';
}

export async function ensureUploadsDir() {
  const dir = getUploadsDir();
  await fs.mkdir(dir, { recursive: true });
  // Ensure messages subdir exists used by chat attachments in FE services
  await fs.mkdir(`${dir}/messages`, { recursive: true });
  return dir;
}


