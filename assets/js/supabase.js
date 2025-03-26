// Define Supabase credentials
const supabaseUrl = 'https://ogotrgcmgwfvnvpxicrg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nb3RyZ2NtZ3dmdm52cHhpY3JnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3OTEzNzksImV4cCI6MjA1ODM2NzM3OX0.6LowRgoshGBe6NaP0fs4GsyWcdUBgsz7wlyoI_LMsCU';

// Initialize variables
let supabaseClient = null;
let useMockAuth = false;
let useMcpServer = true; // Flag to use MCP server instead of direct Supabase

// Create Supabase client
try {
  // Check if the MCP bridge already set up mock auth due to connection issues
  if (window.useMcpMockAuth) {
    console.log('Using mock authentication as indicated by MCP bridge');
    useMockAuth = true;
    useMcpServer = false; // Don't try to use MCP if it's already failed
  }
  // Check if using MCP server is preferred
  else if (useMcpServer) {
    console.log('Using MCP server for Supabase operations');
    // MCP doesn't require client initialization, it will handle auth through API calls
    supabaseClient = { isMcp: true };
  } 
  // Fallback to direct Supabase connection if needed
  else if (typeof window.supabase === 'undefined') {
    console.error('Supabase not found in window object. Using mock authentication.');
    useMockAuth = true;
  } else {
    console.log('Creating direct Supabase client with URL:', supabaseUrl);
    console.log('Using Anon Key:', supabaseAnonKey.substring(0, 10) + '...');
    
    // Initialize the Supabase client using the global supabase object from CDN
    supabaseClient = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
    console.log('Supabase client created successfully:', supabaseClient);
  }
} catch (error) {
  console.error('Error initializing Supabase:', error);
  useMockAuth = true;
}

// Export the Supabase client
export const supabase = supabaseClient;

// Expose functions to the global window object for testing
window.isUserLoggedIn = isUserLoggedIn;
window.signUpUser = signUpUser;
window.signInUser = signInUser;
window.signOutUser = signOutUser;
window.getCurrentUser = getCurrentUser;
window.resetPassword = resetPassword;
window.testSupabaseConnection = testSupabaseConnection;

// Helper function to make MCP calls
async function mcpSupabaseQuery(sql) {
  try {
    if (!window.runMcpSupabaseQuery) {
      console.error('MCP Supabase query function not available');
      throw new Error('MCP Supabase query function not available');
    }
    return await window.runMcpSupabaseQuery(sql);
  } catch (error) {
    console.error('Error in MCP Supabase query:', error);
    throw error;
  }
}

// Function to check if a user is logged in
export const isUserLoggedIn = async () => {
  try {
    if (useMockAuth) {
      const user = localStorage.getItem('mock-user');
      return !!user;
    }
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return false;
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Use MCP to check user session
        const result = await mcpSupabaseQuery("SELECT auth.uid() as user_id");
        return result && result.length > 0 && result[0].user_id != null;
      } catch (error) {
        console.error('Error checking authentication via MCP:', error);
        return false;
      }
    } else {
      const { data, error } = await supabaseClient.auth.getUser();
      if (error) {
        console.error('Error checking authentication status:', error);
        return false;
      }
      return data.user !== null;
    }
  } catch (err) {
    console.error('Error in isUserLoggedIn:', err);
    return false;
  }
};

// Function to sign up a user with email and password
export const signUpUser = async (email, password) => {
  try {
    console.log('Attempting to sign up user with email:', email);
    
    if (useMockAuth) {
      console.log('Using mock signup due to Supabase initialization failure');
      localStorage.setItem('mock-user', JSON.stringify({ email }));
      return { 
        data: { 
          user: { email }, 
          session: { access_token: 'mock-token' } 
        }, 
        error: null 
      };
    }
    
    // Ensure the client is initialized
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return {
        data: null,
        error: { message: 'Authentication system not initialized properly. Please try again later.' }
      };
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Use MCP for signup
        // This is a simplified example - in production, you'd use proper auth endpoints
        const result = await mcpSupabaseQuery(
          `SELECT * FROM auth.sign_up('${email}', '${password}')`
        );
        if (result && result.error) {
          return { data: null, error: result.error };
        }
        return { 
          data: { 
            user: { email },
            session: { access_token: 'session-token' }
          }, 
          error: null 
        };
      } catch (error) {
        console.error('Error during MCP signup:', error);
        return { data: null, error: { message: error.message } };
      }
    } else {
      console.log('Sending signup request to Supabase...');
      
      // Simple signup without extra options that might cause issues
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase signup error:', error);
        return { data: null, error };
      } else {
        console.log('Supabase signup successful. User data:', data.user);
        
        // Store that registration was attempted
        localStorage.setItem('registration_attempted', 'true');
        
        return { data, error: null };
      }
    }
  } catch (err) {
    console.error('Error in signUpUser:', err);
    return { data: null, error: { message: 'Unexpected error during sign up: ' + err.message } };
  }
};

// Function to sign in a user with email and password
export const signInUser = async (email, password) => {
  try {
    console.log('Attempting to sign in user with email:', email);
    
    if (useMockAuth) {
      console.log('Using mock signin due to Supabase initialization failure');
      localStorage.setItem('mock-user', JSON.stringify({ email }));
      return { 
        data: { 
          user: { email }, 
          session: { access_token: 'mock-token' } 
        }, 
        error: null 
      };
    }
    
    // Ensure the client is initialized
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return {
        data: null,
        error: { message: 'Authentication system not initialized properly. Please try again later.' }
      };
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Use MCP for signin
        const result = await mcpSupabaseQuery(
          `SELECT * FROM auth.sign_in('${email}', '${password}')`
        );
        if (result && result.error) {
          return { data: null, error: result.error };
        }
        return { 
          data: { 
            user: { email },
            session: { access_token: 'session-token' }
          }, 
          error: null 
        };
      } catch (error) {
        console.error('Error during MCP signin:', error);
        return { data: null, error: { message: error.message } };
      }
    } else {
      console.log('Sending signin request to Supabase...');
      
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Supabase signin error:', error);
        return { data: null, error };
      } else {
        console.log('Supabase signin successful. User data:', data.user);
        return { data, error: null };
      }
    }
  } catch (err) {
    console.error('Error in signInUser:', err);
    return { data: null, error: { message: 'Unexpected error during sign in: ' + err.message } };
  }
};

// Function to sign out a user
export const signOutUser = async () => {
  try {
    console.log('Attempting to sign out user');
    
    if (useMockAuth) {
      console.log('Using mock signout due to Supabase initialization failure');
      localStorage.removeItem('mock-user');
      return { error: null };
    }
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return { error: { message: 'Authentication system not initialized properly.' } };
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Use MCP for signout
        await mcpSupabaseQuery('SELECT auth.sign_out()');
        return { error: null };
      } catch (error) {
        console.error('Error during MCP signout:', error);
        return { error: { message: error.message } };
      }
    } else {
      const { error } = await supabaseClient.auth.signOut();
      
      if (error) {
        console.error('Supabase signout error:', error);
      } else {
        console.log('Supabase signout successful');
      }
      
      return { error };
    }
  } catch (err) {
    console.error('Error in signOutUser:', err);
    return { error: { message: 'Unexpected error during sign out: ' + err.message } };
  }
};

// Function to get the current user
export const getCurrentUser = async () => {
  try {
    console.log('Getting current user');
    
    if (useMockAuth) {
      console.log('Using mock getCurrentUser due to Supabase initialization failure');
      const user = localStorage.getItem('mock-user');
      return { user: user ? JSON.parse(user) : null, error: null };
    }
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return { user: null, error: { message: 'Authentication system not initialized properly.' } };
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Use MCP to get current user
        const result = await mcpSupabaseQuery(`
          SELECT auth.uid() as id, 
                 auth.email() as email
        `);
        
        if (!result || result.length === 0 || !result[0].id) {
          return { user: null, error: null };
        }
        
        return { 
          user: { 
            id: result[0].id, 
            email: result[0].email
          }, 
          error: null 
        };
      } catch (error) {
        console.error('Error getting user via MCP:', error);
        return { user: null, error: { message: error.message } };
      }
    } else {
      const { data, error } = await supabaseClient.auth.getUser();
      
      if (error) {
        console.error('Supabase getUser error:', error);
      } else {
        console.log('Supabase getUser successful:', data);
      }
      
      return { user: data.user, error };
    }
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return { user: null, error: { message: 'Unexpected error getting user data: ' + err.message } };
  }
};

// Reset password
export const resetPassword = async (email) => {
  try {
    console.log('Password reset requested for:', email);
    
    if (useMockAuth) {
      console.log('Using mock resetPassword due to Supabase initialization failure');
      return { data: {}, error: null };
    }
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return { data: null, error: { message: 'Authentication system not initialized properly.' } };
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Use MCP to reset password
        await mcpSupabaseQuery(`
          SELECT auth.reset_password('${email}', '${window.location.origin}/reset-password')
        `);
        return { data: {}, error: null };
      } catch (error) {
        console.error('Error resetting password via MCP:', error);
        return { data: null, error: { message: error.message } };
      }
    } else {
      const { data, error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        console.error('Supabase reset password error:', error);
      } else {
        console.log('Supabase reset password successful');
      }
      
      return { data, error };
    }
  } catch (err) {
    console.error('Error in resetPassword:', err);
    return { data: null, error: { message: 'Unexpected error during password reset: ' + err.message } };
  }
};

// Test Supabase connection
export async function testSupabaseConnection() {
  try {
    if (useMockAuth) {
      console.log('Using mock connection. Cannot test real connection.');
      return {
        status: 'mock',
        message: 'Using mock authentication mode. Cannot test real connection.'
      };
    }
    
    if (!supabaseClient) {
      console.error('Supabase client not initialized properly');
      return {
        status: 'error',
        message: 'Supabase client not initialized properly'
      };
    }
    
    if (supabaseClient.isMcp) {
      try {
        // Test MCP connection with a simple query
        const result = await mcpSupabaseQuery('SELECT current_timestamp');
        return {
          status: 'connected',
          message: 'Successfully connected to Supabase via MCP',
          timestamp: result[0].current_timestamp
        };
      } catch (error) {
        console.error('Error testing MCP connection:', error);
        return {
          status: 'error',
          message: 'Error connecting to Supabase via MCP: ' + error.message
        };
      }
    } else {
      // Test with a simple query
      const { data, error } = await supabaseClient
        .from('test_connection')
        .select('*')
        .limit(1);
        
      if (error) {
        console.error('Error testing Supabase connection:', error);
        
        // Try a more universal query if the test_connection table doesn't exist
        const { error: pingError } = await supabaseClient.rpc('ping');
        
        if (pingError) {
          console.error('Error pinging Supabase:', pingError);
          return {
            status: 'error',
            message: 'Error connecting to Supabase: ' + pingError.message
          };
        } else {
          return {
            status: 'connected',
            message: 'Connected to Supabase (ping successful, but test_connection table not found)'
          };
        }
      } else {
        console.log('Supabase connection successful');
        return {
          status: 'connected',
          message: 'Successfully connected to Supabase',
          data
        };
      }
    }
  } catch (err) {
    console.error('Unexpected error testing Supabase connection:', err);
    return {
      status: 'error',
      message: 'Unexpected error testing Supabase connection: ' + err.message
    };
  }
}