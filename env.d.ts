interface ImportMetaEnv {
    readonly DATABASE_URL: string;
    readonly VITE_COOKIE_SECRET: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
