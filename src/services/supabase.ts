import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

// Helpful validation: fail early with clear instructions so developer can fix .env
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
	throw new Error(
		'Supabase env vars missing: please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n' +
			"If you're developing locally, copy the repository root '.env.frontend' into 'frontend/.env' and fill values, then restart Vite."
	)
}

export const supabase = createClient(String(SUPABASE_URL), String(SUPABASE_ANON_KEY))

export default supabase
