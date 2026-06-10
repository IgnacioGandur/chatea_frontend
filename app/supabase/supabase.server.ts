import { createClient } from "@supabase/supabase-js";

// NOTE: USE THIS CLIENT ONLY IN THE SERVER/BACKEND.

export const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY ?? "",
);
