import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uqmvyxedtmffaszitize.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbXZ5eGVkdG1mdGFzeml0aXplIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDc2MTAsImV4cCI6MjA5MTk4MzYxMH0.GLYRUxK0SyyiH0WY8xc4xcZCNEnBoDHmOYQ0D07iEXE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
