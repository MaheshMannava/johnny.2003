import { supabase, isUserLoggedIn } from './supabase.js';

// Test the Supabase connection
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Testing Supabase connection...');
  
  try {
    // Test the connection by getting the current auth status
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful!');
      console.log('Session data:', data);
      
      // Check if a user is logged in
      const isLoggedIn = await isUserLoggedIn();
      console.log('User logged in status:', isLoggedIn);
    }
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
  }
}); 