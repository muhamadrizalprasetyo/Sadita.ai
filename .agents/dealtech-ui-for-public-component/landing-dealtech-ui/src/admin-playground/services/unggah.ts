export const TIPE_GAMBAR = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const MAKS_UKURAN_GAMBAR = 5 * 1024 * 1024;

export function periksaGambar(file: File): string | null {
  if (!(TIPE_GAMBAR as readonly string[]).includes(file.type)) {
    return 'Gambar harus berformat JPG, PNG, atau WebP.';
  }
  if (file.size > MAKS_UKURAN_GAMBAR) {
    return 'Ukuran gambar melebihi 5 MB. Perkecil dulu gambarnya, lalu unggah lagi.';
  }
  return null;
}

export async function unggahGambar(file: File, signal?: AbortSignal): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (signal?.aborted) throw new DOMException('Dibatalkan', 'AbortError');
  return URL.createObjectURL(file);
}
