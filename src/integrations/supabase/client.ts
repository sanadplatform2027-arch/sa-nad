import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = "https://kavoxwtcoihsomhtarsn.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imthdm94d3Rjb2loc29taHRhcnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyNjYyNDEsImV4cCI6MjEwMzg0MjI0MX0.SqFfslPAYEDEDq8T9reHGwvmKDdxDwhJKbyzPn99B4E";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
