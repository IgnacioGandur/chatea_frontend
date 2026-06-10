interface ImportMetaEnv {
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string;
    readonly VITE_SUPABASE_URL: string;
    readonly DATABASE_URL: string;
    readonly COOKIE_SECRET: string;
    readonly SUPABASE_SECRET_KEY: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
