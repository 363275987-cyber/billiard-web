// src/lib/supabase.js - Supabase 客户端配置
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://cmswoyiuoeqzeassubvw.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

if (!SUPABASE_URL) {
  console.error('Missing VITE_SUPABASE_URL')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
