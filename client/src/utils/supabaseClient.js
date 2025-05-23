import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase URL and anon key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://morlleviurqksprjlrtf.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to get auth token from local storage or session storage
const getAuthToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

// Function to ensure the bucket exists with proper permissions
export const ensureStorageBucket = async () => {
  try {
    // Skip bucket creation attempts since you already have the bucket
    // and the policies are set up, we'll just check if it exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error("Error checking for buckets:", listError);
      return false;
    }
    
    const bucketExists = buckets.some(bucket => bucket.name === 'workshop-files');
    console.log("Bucket exists:", bucketExists);
    
    // We won't try to create the bucket since it already exists
    // and we have policies in place
    return bucketExists;
    
  } catch (error) {
    console.error('Error initializing storage:', error);
    return false;
  }
};