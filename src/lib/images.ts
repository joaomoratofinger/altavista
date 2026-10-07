const MAX_SIDE = 2000

/** Reduz fotos de celular/câmera (vários MB) para um tamanho adequado à web. */
export async function shrinkImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.85))
    // Só troca pelo redimensionado se realmente ficou menor.
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export function extensionFor(blob: Blob, file: File): string {
  if (blob.type === 'image/jpeg') return 'jpg'
  return (file.name.split('.').pop() ?? 'bin').toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
}
