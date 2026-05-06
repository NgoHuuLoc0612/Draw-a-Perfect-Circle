/**
 * @file config.js
 * @description Central configuration for API keys and feature flags.
 * Replace these values with your actual keys.
 * 
 * SUPABASE SETUP:
 *   1. Go to https://supabase.com and create a project
 *   2. Run this SQL in the Supabase SQL editor:
 *      CREATE TABLE scores (
 *        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
 *        name text NOT NULL,
 *        score numeric(6,2) NOT NULL,
 *        grade text NOT NULL,
 *        created_at timestamptz DEFAULT now()
 *      );
 *      ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
 *      CREATE POLICY "Allow anonymous reads" ON scores FOR SELECT USING (true);
 *      CREATE POLICY "Allow anonymous inserts" ON scores FOR INSERT WITH CHECK (true);
 *   3. Copy your Project URL and anon key from Settings > API
 * 
 * GROQ SETUP:
 *   1. Go to https://console.groq.com and get your API key
 *   2. Paste it below
 */

window.SUPABASE_URL      = 'supabase_url';       // e.g. https://xxxx.supabase.co
window.SUPABASE_ANON_KEY = 'supabase_anon_key';  // eyJhbGci...
window.GROQ_API_KEY      = 'groq_api_key';        // gsk_...