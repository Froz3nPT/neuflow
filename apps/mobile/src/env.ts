// Centralised env access. Crashes loudly at startup if a required value is missing,
// which is what we want — beats a confusing runtime error in a network call.

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required env var: ${name}. Did you copy .env.example to .env and fill it in?`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required(
    'EXPO_PUBLIC_SUPABASE_URL',
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseAnonKey: required(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  ),
} as const;
