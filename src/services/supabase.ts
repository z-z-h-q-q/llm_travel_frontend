import { createClient } from '@supabase/supabase-js'

// Runtime config support: prefer window.__ENV (injected at container start),
// fallback to build-time Vite variables (import.meta.env).
const runtimeEnv = typeof window !== 'undefined' ? (window as any).__ENV || {} : {}

const SUPABASE_URL = runtimeEnv.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = runtimeEnv.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

// Only throw when running in the browser and config is missing
if (typeof window !== 'undefined' && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
	throw new Error(
		'Supabase env vars missing: please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (runtime or build).'
	)
}

export const supabase = createClient(String(SUPABASE_URL), String(SUPABASE_ANON_KEY))

export default supabase
