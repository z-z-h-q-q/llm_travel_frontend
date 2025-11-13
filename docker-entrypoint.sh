#!/bin/sh
set -e

# Create env-config.js from environment variables so frontend can read runtime config
ENV_FILE=/usr/share/nginx/html/env-config.js

cat > "$ENV_FILE" <<EOF
window.__ENV = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY}",
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_AMAP_KEY: "${VITE_AMAP_KEY}"
}
EOF

echo "Wrote $ENV_FILE"

# Exec nginx (container will keep running)
exec nginx -g 'daemon off;'
