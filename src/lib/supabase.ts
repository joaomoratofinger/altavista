import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** Sem as chaves no `.env`, o site abre mas formulários e painel avisam. */
export const isConfigured = Boolean(url && key)

export const supabase = createClient(url ?? 'http://localhost:54321', key ?? 'not-configured')

export const BUCKET_PRIVATE = 'property-media'
export const BUCKET_REGIONS = 'region-media'
