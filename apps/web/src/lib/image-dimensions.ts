/** Read intrinsic pixel size from an image file (returns null for non-images or on failure). */
export async function imageDimensionsFromFile(
  file: File,
): Promise<{ width: number; height: number } | null> {
  if (!file.type.startsWith("image/")) return null;
  try {
    const bitmap = await createImageBitmap(file);
    const dims = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    if (dims.width > 0 && dims.height > 0) return dims;
  } catch {
    /* ignore */
  }
  return null;
}
