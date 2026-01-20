import { createClient } from '@supabase/supabase-js'

// Remplace directement par tes infos Supabase
const supabaseUrl = "https://nebdjuqrjbkiznmixckf.supabase.co" 
const supabaseAnonKey = "sb_publishable_fxQapn4H53Sjjz6xAGBdHw_W1PlTyKT"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)