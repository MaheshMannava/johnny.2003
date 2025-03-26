/**
 * MCP Supabase Bridge
 * 
 * This script bridges the Supabase JavaScript SDK with Cursor's MCP Supabase query functionality.
 * It allows the johnny.2003 website to interact with Supabase using MCP instead of direct API calls.
 */

// Import Supabase client
import { supabase, isUserLoggedIn, getCurrentUser } from './supabase.js';

/**
 * Run a Supabase query through MCP
 * 
 * This function is exposed to the global scope and can be called from MCP
 * It provides a safe way to run SQL queries on Supabase
 * 
 * @param {string} query - SQL query to run
 * @returns {Promise<object>} - Query results or error
 */
async function runMcpSupabaseQuery(query) {
  try {
    console.log('MCP Supabase Query:', query);
    
    // For security, only allow SELECT, INSERT, UPDATE queries
    // This helps prevent malicious SQL
    const normalizedQuery = query.trim().toLowerCase();
    
    if (
      normalizedQuery.startsWith('select') || 
      normalizedQuery.startsWith('insert') || 
      normalizedQuery.startsWith('update') ||
      // Allow specific stored procedures that are safe
      normalizedQuery.startsWith('select * from get_cart') ||
      normalizedQuery.startsWith('select * from update_cart') ||
      normalizedQuery.startsWith('select * from place_order') ||
      normalizedQuery.startsWith('select * from get_orders') ||
      normalizedQuery.startsWith('select * from check_stock_availability') ||
      // Admin functions
      normalizedQuery.startsWith('select * from admin_adjust_stock') ||
      normalizedQuery.startsWith('select * from get_low_stock_products') ||
      normalizedQuery.startsWith('select * from update_order_status')
    ) {
      // Execute the query
      const { data, error } = await supabase.rpc('run_sql', { query_text: query });
      
      if (error) {
        console.error('Supabase query error:', error);
        return { error: error.message };
      }
      
      // Success! Return the data
      console.log('Supabase query result:', data);
      return data;
    } else {
      // For security, reject queries that aren't explicitly allowed
      console.error('Unauthorized query type rejected');
      return { error: 'Unauthorized query type' };
    }
  } catch (error) {
    console.error('Error in runMcpSupabaseQuery:', error);
    return { error: error.message };
  }
}

// Set up global variables for MCP access
window.runMcpSupabaseQuery = runMcpSupabaseQuery;
window.isSupabaseConnected = true;

// Let MCP or other parts of the app know we're ready
console.log('MCP Supabase Bridge loaded and ready');

// Constants for cart storage
const CART_KEY = 'johnny_cart';
const SESSION_CART_KEY = 'johnny_session_cart';
const ANONYMOUS_CART_KEY = 'johnny_anonymous_cart';
const USER_CART_PREFIX = 'johnny_user_cart_';

// Function to save cart to Supabase
async function syncCartToSupabase(cart) {
  try {
    if (!cart || !Array.isArray(cart)) {
      console.error('Invalid cart data for sync');
      return false;
    }
    
    const isLoggedIn = await isUserLoggedIn();
    if (!isLoggedIn) {
      console.log('User not logged in, saving to session storage instead');
      
      // For non-logged-in users, save ONLY to session storage (cleared when browser closes)
      sessionStorage.setItem(SESSION_CART_KEY, JSON.stringify(cart));
      
      // Also save to a dedicated anonymous cart in localStorage
      // This is separate from any logged-in user cart
      localStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(cart));
      
      // Remove any reference to the generic cart key which could cause leakage
      localStorage.removeItem(CART_KEY);
      
      return true;
    }
    
    // For logged-in users, save to Supabase
    console.log('Syncing cart to Supabase for logged-in user');
    const result = await window.runMcpSupabaseQuery(`
      SELECT * FROM update_cart('${JSON.stringify(cart)}'::jsonb)
    `);
    
    if (result && !result.error) {
      console.log('Cart synced to Supabase successfully');
      
      // Get current user for user-specific storage
      const { user } = await getCurrentUser();
      if (user && user.id) {
        // Save to user-specific localStorage key as backup
        const userCartKey = `${USER_CART_PREFIX}${user.id}`;
        localStorage.setItem(userCartKey, JSON.stringify(cart));
        
        // Clear any anonymous cart to prevent leakage
        localStorage.removeItem(ANONYMOUS_CART_KEY);
        sessionStorage.removeItem(SESSION_CART_KEY);
        localStorage.removeItem(CART_KEY);
      }
      
      return true;
    } else {
      console.error('Failed to sync cart to Supabase:', result?.error || 'Unknown error');
      
      // Fallback to user-specific local storage if Supabase fails
      const { user } = await getCurrentUser();
      if (user && user.id) {
        const userCartKey = `${USER_CART_PREFIX}${user.id}`;
        localStorage.setItem(userCartKey, JSON.stringify(cart));
      }
      
      return false;
    }
  } catch (error) {
    console.error('Error syncing cart to Supabase:', error);
    
    // Attempt to fallback to user-specific storage if possible
    try {
      const { user } = await getCurrentUser();
      if (user && user.id) {
        const userCartKey = `${USER_CART_PREFIX}${user.id}`;
        localStorage.setItem(userCartKey, JSON.stringify(cart));
      } else {
        // Only use anonymous cart if we're sure user is not logged in
        sessionStorage.setItem(SESSION_CART_KEY, JSON.stringify(cart));
        localStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(cart));
      }
    } catch (e) {
      console.error('Error in fallback cart storage:', e);
    }
    
    return false;
  }
}

// Function to load cart from Supabase
async function loadCartFromSupabase() {
  try {
    const isLoggedIn = await isUserLoggedIn();
    
    if (!isLoggedIn) {
      console.log('User not logged in, loading anonymous cart');
      
      // For non-logged in users, first try session storage
      const sessionCart = sessionStorage.getItem(SESSION_CART_KEY);
      if (sessionCart) {
        const cartData = JSON.parse(sessionCart);
        console.log('Cart loaded from session storage', cartData);
        return cartData;
      }
      
      // If no session cart, try anonymous local storage as fallback
      const anonymousCart = localStorage.getItem(ANONYMOUS_CART_KEY);
      if (anonymousCart) {
        const cartData = JSON.parse(anonymousCart);
        console.log('Cart loaded from anonymous local storage', cartData);
        
        // Save to session storage for future reference
        sessionStorage.setItem(SESSION_CART_KEY, anonymousCart);
        
        return cartData;
      }
      
      // For backwards compatibility, check old generic cart key
      // but only if we're certain we're not logged in
      const oldGenericCart = localStorage.getItem(CART_KEY);
      if (oldGenericCart) {
        try {
          const cartData = JSON.parse(oldGenericCart);
          
          // Migrate to the new anonymous cart format
          localStorage.setItem(ANONYMOUS_CART_KEY, oldGenericCart);
          sessionStorage.setItem(SESSION_CART_KEY, oldGenericCart);
          
          // Remove old format to prevent leakage
          localStorage.removeItem(CART_KEY);
          
          return cartData;
        } catch (e) {
          console.error('Error parsing old cart format:', e);
        }
      }
      
      // No cart found in any anonymous storage
      return [];
    }
    
    // For logged-in users, first try to get their user-specific cart key
    const { user } = await getCurrentUser();
    if (!user || !user.id) {
      console.error('User appears logged in but no user ID available');
      return [];
    }
    
    console.log('User logged in, loading cart for user', user.id);
    
    // First try Supabase as the source of truth
    const result = await window.runMcpSupabaseQuery(`
      SELECT * FROM get_cart()
    `);
    
    if (result && !result.error) {
      // Get first result (should only be one)
      const cartData = result[0]?.get_cart;
      
      if (cartData && Array.isArray(cartData)) {
        console.log('Cart loaded from Supabase successfully', cartData);
        
        // Update the user-specific local storage for backup
        const userCartKey = `${USER_CART_PREFIX}${user.id}`;
        localStorage.setItem(userCartKey, JSON.stringify(cartData));
        
        // Clean up any old/anonymous carts
        localStorage.removeItem(ANONYMOUS_CART_KEY);
        sessionStorage.removeItem(SESSION_CART_KEY);
        localStorage.removeItem(CART_KEY);
        
        return cartData;
      }
    }
    
    // If Supabase fails, try user-specific local storage
    const userCartKey = `${USER_CART_PREFIX}${user.id}`;
    const userCart = localStorage.getItem(userCartKey);
    
    if (userCart) {
      try {
        const cartData = JSON.parse(userCart);
        console.log('Cart loaded from user-specific local storage', cartData);
        return cartData;
      } catch (e) {
        console.error('Error parsing user-specific cart:', e);
      }
    }
    
    // No cart found for this user
    console.log('No cart found for user', user.id);
    return [];
  } catch (error) {
    console.error('Error loading cart:', error);
    return [];
  }
}

// Function to clear all cart data
function clearAllCartData() {
  console.log('Clearing all cart data');
  
  // Clear all possible cart storage locations
  sessionStorage.removeItem(SESSION_CART_KEY);
  localStorage.removeItem(ANONYMOUS_CART_KEY);
  localStorage.removeItem(CART_KEY);
  
  // Clear any user-specific carts by finding all keys with the prefix
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(USER_CART_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}

// Function to handle user login cart transfer
async function handleCartOnLogin(userId) {
  try {
    console.log('Handling cart transfer after login for user', userId);
    
    // First, check if we already have a cart for this user
    const userCartKey = `${USER_CART_PREFIX}${userId}`;
    const existingUserCart = localStorage.getItem(userCartKey);
    
    // Get any anonymous cart data from the current session
    const sessionCart = sessionStorage.getItem(SESSION_CART_KEY);
    const anonymousCart = localStorage.getItem(ANONYMOUS_CART_KEY);
    
    // Choose which cart to use (session cart takes priority)
    let cartToTransfer = null;
    if (sessionCart) {
      cartToTransfer = sessionCart;
      console.log('Using session cart for transfer');
    } else if (anonymousCart) {
      cartToTransfer = anonymousCart;
      console.log('Using anonymous cart for transfer');
    } else {
      console.log('No anonymous carts found, checking if user has an existing cart');
      
      // If no anonymous carts, try to load the user's existing cart from Supabase
      const result = await window.runMcpSupabaseQuery(`
        SELECT * FROM get_cart()
      `);
      
      if (result && !result.error && result[0]?.get_cart) {
        console.log('Found existing cart in Supabase, using that');
        
        // Update the local cart with the Supabase version
        localStorage.setItem(userCartKey, JSON.stringify(result[0].get_cart));
        
        // Clean up anonymous carts
        localStorage.removeItem(ANONYMOUS_CART_KEY);
        sessionStorage.removeItem(SESSION_CART_KEY);
        localStorage.removeItem(CART_KEY);
        
        return;
      }
      
      if (existingUserCart) {
        console.log('Using existing user cart from local storage');
        
        // Push the existing user cart to Supabase
        try {
          const cartItems = JSON.parse(existingUserCart);
          await window.runMcpSupabaseQuery(`
            SELECT * FROM update_cart('${JSON.stringify(cartItems)}'::jsonb)
          `);
          console.log('Existing user cart synced to Supabase');
        } catch (e) {
          console.error('Error syncing existing user cart:', e);
        }
        
        // Clean up anonymous carts
        localStorage.removeItem(ANONYMOUS_CART_KEY);
        sessionStorage.removeItem(SESSION_CART_KEY);
        localStorage.removeItem(CART_KEY);
        
        return;
      }
      
      console.log('No carts found to transfer');
      return;
    }
    
    // Parse the cart to transfer
    let cartItems;
    try {
      cartItems = JSON.parse(cartToTransfer);
    } catch (e) {
      console.error('Error parsing cart to transfer:', e);
      return;
    }
    
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      console.log('Cart is empty or invalid, nothing to transfer');
      return;
    }
    
    // Save the cart to Supabase under the user's account
    console.log('Transferring cart to user account in Supabase', cartItems);
    
    await window.runMcpSupabaseQuery(`
      SELECT * FROM update_cart('${JSON.stringify(cartItems)}'::jsonb)
    `);
    
    // Also save to user-specific local storage
    localStorage.setItem(userCartKey, JSON.stringify(cartItems));
    
    // Clear all anonymous cart data
    localStorage.removeItem(ANONYMOUS_CART_KEY);
    sessionStorage.removeItem(SESSION_CART_KEY);
    localStorage.removeItem(CART_KEY);
    
    console.log('Cart transfer completed successfully');
  } catch (error) {
    console.error('Error transferring cart on login:', error);
  }
}

// Function to handle user logout cart actions
async function handleCartOnLogout() {
  try {
    console.log('Handling cart on logout');
    
    // Get current user before they're logged out
    const { user } = await getCurrentUser();
    
    if (user && user.id) {
      console.log('User logging out, preserving cart in user-specific storage');
      
      // First try to get the cart from Supabase (most authoritative)
      let userCart = [];
      
      try {
        const result = await window.runMcpSupabaseQuery(`
          SELECT * FROM get_cart()
        `);
        
        if (result && !result.error && result[0]?.get_cart) {
          userCart = result[0].get_cart;
        }
      } catch (e) {
        console.error('Error getting cart from Supabase during logout:', e);
        
        // Fall back to user-specific local storage
        const userCartKey = `${USER_CART_PREFIX}${user.id}`;
        const storedCart = localStorage.getItem(userCartKey);
        
        if (storedCart) {
          try {
            userCart = JSON.parse(storedCart);
          } catch (parseError) {
            console.error('Error parsing stored user cart:', parseError);
          }
        }
      }
      
      // Preserve the user-specific cart, but don't leak it to anonymous browsing
      // by NOT copying it to anonymous cart storage
      
      // Just make sure the user-specific storage is updated
      if (userCart && userCart.length > 0) {
        const userCartKey = `${USER_CART_PREFIX}${user.id}`;
        localStorage.setItem(userCartKey, JSON.stringify(userCart));
      }
    }
    
    // Clear anonymous carts to start fresh
    localStorage.removeItem(ANONYMOUS_CART_KEY);
    sessionStorage.removeItem(SESSION_CART_KEY);
    localStorage.removeItem(CART_KEY);
    
    // Initialize empty anonymous cart for the new non-logged-in session
    const emptyCart = [];
    sessionStorage.setItem(SESSION_CART_KEY, JSON.stringify(emptyCart));
    localStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(emptyCart));
    
    console.log('Anonymous cart initialized with empty cart after logout');
  } catch (error) {
    console.error('Error handling cart on logout:', error);
    
    // In case of error, make sure anonymous cart is cleared to prevent leakage
    localStorage.removeItem(ANONYMOUS_CART_KEY);
    sessionStorage.removeItem(SESSION_CART_KEY);
    localStorage.removeItem(CART_KEY);
  }
}

// Set up auth event listeners for cart persistence
document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('user-logged-in', async (e) => {
    if (e.detail && e.detail.user && e.detail.user.id) {
      await handleCartOnLogin(e.detail.user.id);
    }
  });
  
  document.addEventListener('user-logged-out', async () => {
    await handleCartOnLogout();
  });
  
  // Handle page unload for non-logged-in users (browser close)
  window.addEventListener('beforeunload', async (e) => {
    try {
      const isLoggedIn = await isUserLoggedIn();
      if (!isLoggedIn) {
        console.log('Page unloading while user not logged in - ensuring cart persists only in sessionStorage');
        
        // For non-logged-in users, make sure to preserve cart in sessionStorage (cleared on browser close)
        // but DON'T update localStorage unless we're going to checkout
        const goingToCheckout = sessionStorage.getItem('goingToCheckout') === 'true';
        
        if (!goingToCheckout) {
          // Clear localStorage carts but keep sessionStorage for current session
          localStorage.removeItem(ANONYMOUS_CART_KEY);
          localStorage.removeItem(CART_KEY);
          
          // Don't clear sessionStorage - browser will do that on close
        }
      }
    } catch (error) {
      console.error('Error in beforeunload handler:', error);
    }
  });
});

// Check if this is a new browser session and clean up any anonymous carts
// This runs once when the script is first loaded
(async function initializeCartSystem() {
  try {
    const isLoggedIn = await isUserLoggedIn();
    
    if (!isLoggedIn) {
      // For non-logged in users, check if this is a new session
      // by looking for a session marker
      const sessionMarker = sessionStorage.getItem('cart_session_active');
      
      if (!sessionMarker) {
        // This is a new session, clear anonymous carts from localStorage
        console.log('New browser session detected for non-logged-in user, clearing anonymous carts');
        localStorage.removeItem(ANONYMOUS_CART_KEY);
        localStorage.removeItem(CART_KEY);
        
        // Start with empty cart for the new session
        const emptyCart = [];
        sessionStorage.setItem(SESSION_CART_KEY, JSON.stringify(emptyCart));
        localStorage.setItem(ANONYMOUS_CART_KEY, JSON.stringify(emptyCart));
        
        // Set session marker
        sessionStorage.setItem('cart_session_active', 'true');
      }
    } else {
      // For logged-in users, make sure we don't have any leaked anonymous carts
      console.log('Initializing cart for logged-in user, cleaning up anonymous carts');
      localStorage.removeItem(ANONYMOUS_CART_KEY);
      sessionStorage.removeItem(SESSION_CART_KEY);
      localStorage.removeItem(CART_KEY);
    }
  } catch (error) {
    console.error('Error initializing cart system:', error);
  }
})();

// Export functions for use in other modules
export {
  runMcpSupabaseQuery,
  syncCartToSupabase,
  loadCartFromSupabase,
  handleCartOnLogin,
  handleCartOnLogout,
  clearAllCartData
};
