import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://sdbbzzlqlvxoioxteccl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkYmJ6emxxbHZ4b2lveHRlY2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzAxNDcsImV4cCI6MjA2NjcwNjE0N30.fH3oleQ2gjMoCyT9YyvktQEAzEAbvK_bQmNZLMbVk-A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
