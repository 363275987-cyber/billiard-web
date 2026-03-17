// src/lib/supabase.js - Supabase 客户端配置
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://cmswoyiuoeqzeassubvw.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_kyhsOoWxO8YEBczAIJsUxQ_9KUmxFV2'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
