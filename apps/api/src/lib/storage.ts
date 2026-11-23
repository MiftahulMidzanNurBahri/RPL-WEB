const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "item-images";

function storageConfig() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Supabase Storage environment variables are missing.");
  }

  return {
    baseUrl: SUPABASE_URL.replace(/\/$/, ""),
    apiKey: SUPABASE_SERVICE_ROLE_KEY,
    bucket: STORAGE_BUCKET,
  };
}

function encodeObjectPath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function uploadItemImage(
  buffer: Buffer,
  contentType: string,
  extension: string,
): Promise<string> {
  const config = storageConfig();
  const objectPath = `items/${crypto.randomUUID()}.${extension}`;

  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${config.bucket}/${encodeObjectPath(objectPath)}`,
    {
      method: "POST",
      headers: {
        apikey: config.apiKey,
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": contentType,
        "x-upsert": "false",
        "cache-control": "3600",
      },
      body: new Uint8Array(buffer),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Supabase image upload failed (${response.status}): ${detail}`,
    );
  }

  return objectPath;
}

export async function deleteItemImage(
  objectPath: string | null,
): Promise<void> {
  if (!objectPath || objectPath.startsWith("uploads/")) return;

  const config = storageConfig();

  const response = await fetch(
    `${config.baseUrl}/storage/v1/object/${config.bucket}`,
    {
      method: "DELETE",
      headers: {
        apikey: config.apiKey,
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prefixes: [objectPath] }),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Supabase image deletion failed (${response.status}): ${await response.text()}`,
    );
  }
}

export function getItemImagePublicUrl(
  objectPath: string | null,
): string | null {
  if (!objectPath) return null;

  // Kompatibilitas gambar lama yang masih tersimpan di folder uploads.
  if (objectPath.startsWith("uploads/")) {
    return `/${objectPath.replaceAll("\\", "/")}`;
  }

  // Jika sudah berupa URL lengkap, gunakan langsung.
  if (/^https?:\/\//i.test(objectPath)) return objectPath;

  const config = storageConfig();

  return `${config.baseUrl}/storage/v1/object/public/${config.bucket}/${encodeObjectPath(objectPath)}`;
}
