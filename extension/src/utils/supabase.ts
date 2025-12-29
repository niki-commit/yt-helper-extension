import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.WXT_SUPABASE_URL;
const supabaseKey = import.meta.env.WXT_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing in extension .env");
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");
