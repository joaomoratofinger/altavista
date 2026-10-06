import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import type {
  PropertyImage,
  PropertyPrivate,
  PropertyPublic,
  PropertyRecord,
} from '../types/property'

/**
 * Acesso do PAINEL aos imóveis. Diferente de `properties.ts` (site público),
 * aqui aparecem rascunhos e os dados privados do proprietário — as regras do
 * Firestore/Storage só permitem isso para admins autenticados.
 */

function requireDb() {
  if (!db || !storage) throw new Error('Firebase não configurado.')
  return { db, storage }
}

/** Firestore rejeita `undefined`; campos vazios simplesmente não são gravados. */
function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as T
}

/** Todos os imóveis (inclui rascunhos), mais recentes primeiro. */
export async function listAllProperties(): Promise<PropertyPublic[]> {
  const { db } = requireDb()
  const snap = await getDocs(collection(db, 'properties'))
  return snap.docs
    .map((d) => ({ ...(d.data() as Omit<PropertyPublic, 'id'>), id: d.id }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getPropertyRecord(id: string): Promise<PropertyRecord | null> {
  const { db } = requireDb()
  const [pub, priv] = await Promise.all([
    getDoc(doc(db, 'properties', id)),
    getDoc(doc(db, 'properties', id, 'private', 'owner')),
  ])
  if (!pub.exists()) return null
  return {
    ...(pub.data() as Omit<PropertyPublic, 'id'>),
    id: pub.id,
    private: (priv.data() as PropertyPrivate | undefined) ?? { ownerName: '' },
  }
}

/** Gera um id de documento sem gravar nada (usado no caminho das fotos). */
export function newPropertyId(): string {
  const { db } = requireDb()
  return doc(collection(db, 'properties')).id
}

/** Impede dois imóveis com o mesmo endereço (`/imovel/:slug`). */
async function assertSlugFree(slug: string, id: string) {
  const { db } = requireDb()
  const snap = await getDocs(query(collection(db, 'properties'), where('slug', '==', slug)))
  if (snap.docs.some((d) => d.id !== id)) {
    throw new Error(`Já existe outro imóvel com o endereço "${slug}". Altere o campo "Endereço da página".`)
  }
}

/** Grava público + privado numa única operação atômica. */
export async function saveProperty(record: PropertyRecord): Promise<void> {
  const { db } = requireDb()
  await assertSlugFree(record.slug, record.id)

  const { id, private: priv, ...pub } = record
  const batch = writeBatch(db)
  batch.set(doc(db, 'properties', id), stripUndefined({
    ...pub,
    images: pub.images.map((img) => stripUndefined(img)),
  }))
  batch.set(doc(db, 'properties', id, 'private', 'owner'), stripUndefined(priv))
  await batch.commit()
}

/** Apaga o imóvel, os dados privados e as fotos no Storage. */
export async function deleteProperty(
  record: Pick<PropertyPublic, 'id' | 'images'>,
): Promise<void> {
  const { db } = requireDb()
  await deleteDoc(doc(db, 'properties', record.id, 'private', 'owner'))
  await deleteDoc(doc(db, 'properties', record.id))
  await deleteStoredImages(record.images)
}

/** Remove arquivos do Storage; ignora os que já não existem. */
export async function deleteStoredImages(images: PropertyImage[]): Promise<void> {
  const { storage } = requireDb()
  await Promise.all(
    images
      .filter((img) => img.path)
      .map((img) =>
        deleteObject(ref(storage, img.path)).catch((e: { code?: string }) => {
          if (e.code !== 'storage/object-not-found') throw e
        }),
      ),
  )
}

const MAX_SIDE = 2000

/** Reduz fotos de celular/câmera (vários MB) para um tamanho adequado à web. */
async function shrink(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close()
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, 'image/jpeg', 0.85),
    )
    // Só troca pelo redimensionado se realmente ficou menor.
    return blob && blob.size < file.size ? blob : file
  } catch {
    return file
  }
}

export async function uploadPropertyImage(
  propertyId: string,
  file: File,
  alt?: string,
): Promise<PropertyImage> {
  const { storage } = requireDb()
  const blob = await shrink(file)
  const ext = blob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() ?? 'img').toLowerCase()
  const path = `properties/${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, blob, {
    contentType: blob.type || file.type,
    cacheControl: 'public,max-age=31536000',
  })
  return stripUndefined({ url: await getDownloadURL(fileRef), path, alt })
}
