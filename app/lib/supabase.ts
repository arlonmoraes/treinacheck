import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nbhosgodqtdzqgtaidrd.supabase.co'
const supabaseKey = 'sb_publishable_Wuko68kVMB5-JKj32QvYYg_LJqztYzl'

export const supabase = createClient(supabaseUrl, supabaseKey)