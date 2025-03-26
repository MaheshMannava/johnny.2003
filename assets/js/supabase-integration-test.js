/**
 * Supabase Integration Test
 * 
 * This script tests the full integration between the Johnny.2003 website
 * and Supabase for authentication, product retrieval, and cart management.
 */

// Main test class
class SupabaseIntegrationTest {
  constructor() {
    this.results = {
      auth: { success: false, details: {} },
      products: { success: false, details: {} },
      cart: { success: false, details: {} }
    };
    this.statusElement = null;
  }

  // Initialize test
  async init() {
    console.log('Initializing Supabase integration test...');
    
    // Create status display
    this.createStatusDisplay();
    this.updateStatus('Initializing tests...');
    
    // Wait for all scripts to load
    await this.waitForScripts();
    
    // Run tests
    await this.runTests();
  }
  
  // Create a visual status display
  createStatusDisplay() {
    // Check if it already exists
    if (document.getElementById('supabase-test-status')) {
      this.statusElement = document.getElementById('supabase-test-status');
      return;
    }
    
    // Create container
    const container = document.createElement('div');
    container.id = 'supabase-test-container';
    container.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 5px;
      font-family: monospace;
      z-index: 10000;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.textContent = 'Supabase Integration Test';
    header.style.cssText = `
      font-weight: bold;
      border-bottom: 1px solid #555;
      padding-bottom: 5px;
      margin-bottom: 10px;
    `;
    container.appendChild(header);
    
    // Create status element
    const status = document.createElement('div');
    status.id = 'supabase-test-status';
    status.textContent = 'Starting tests...';
    container.appendChild(status);
    this.statusElement = status;
    
    // Create results container
    const results = document.createElement('div');
    results.id = 'supabase-test-results';
    container.appendChild(results);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    closeBtn.style.cssText = `
      margin-top: 10px;
      background: #333;
      color: white;
      border: none;
      padding: 5px 10px;
      border-radius: 3px;
      cursor: pointer;
    `;
    closeBtn.onclick = () => container.remove();
    container.appendChild(closeBtn);
    
    // Add to body
    document.body.appendChild(container);
  }
  
  // Update status message
  updateStatus(message) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
    console.log('Test status:', message);
  }
  
  // Add a result to the results container
  addResult(category, test, success, message) {
    // Update internal results
    if (!this.results[category]) {
      this.results[category] = { success: true, details: {} };
    }
    this.results[category].details[test] = { success, message };
    this.results[category].success = Object.values(this.results[category].details)
      .every(result => result.success);
    
    // Update UI
    const resultsContainer = document.getElementById('supabase-test-results');
    if (!resultsContainer) return;
    
    // Check if category container exists
    let categoryContainer = document.getElementById(`test-${category}`);
    if (!categoryContainer) {
      categoryContainer = document.createElement('div');
      categoryContainer.id = `test-${category}`;
      categoryContainer.style.marginTop = '10px';
      
      const categoryHeader = document.createElement('div');
      categoryHeader.textContent = category.toUpperCase();
      categoryHeader.style.fontWeight = 'bold';
      categoryContainer.appendChild(categoryHeader);
      
      resultsContainer.appendChild(categoryContainer);
    }
    
    // Add test result
    const resultElement = document.createElement('div');
    resultElement.style.marginLeft = '10px';
    resultElement.style.fontSize = '12px';
    resultElement.innerHTML = `
      <span style="color: ${success ? '#4CAF50' : '#F44336'}">${success ? '✓' : '✗'}</span>
      ${test}: ${message}
    `;
    categoryContainer.appendChild(resultElement);
  }
  
  // Wait for all scripts to load
  async waitForScripts() {
    this.updateStatus('Waiting for scripts to load...');
    
    // Check if key functions are available
    const requiredFunctions = [
      'window.isUserLoggedIn',
      'window.signInUser',
      'window.signOutUser',
      'window.cart',
      'window.runMcpSupabaseQuery'
    ];
    
    return new Promise(resolve => {
      const checkFunctions = () => {
        const missingFunctions = requiredFunctions.filter(fn => {
          const parts = fn.split('.');
          let obj = window;
          for (const part of parts) {
            if (part === 'window') continue;
            if (!obj[part]) return true;
            obj = obj[part];
          }
          return false;
        });
        
        if (missingFunctions.length === 0) {
          this.updateStatus('All required scripts loaded');
          resolve();
        } else {
          this.updateStatus(`Waiting for scripts... Missing: ${missingFunctions.join(', ')}`);
          setTimeout(checkFunctions, 500);
        }
      };
      
      checkFunctions();
    });
  }
  
  // Run all tests
  async runTests() {
    this.updateStatus('Running tests...');
    
    // Test auth
    await this.testAuth();
    
    // Test products
    await this.testProducts();
    
    // Test cart
    await this.testCart();
    
    // Show final results
    this.showFinalResults();
  }
  
  // Test authentication
  async testAuth() {
    this.updateStatus('Testing authentication...');
    
    try {
      // Check if isUserLoggedIn function exists
      if (typeof window.isUserLoggedIn !== 'function') {
        this.addResult('auth', 'functions', false, 'isUserLoggedIn function not found');
        return;
      }
      this.addResult('auth', 'functions', true, 'Auth functions available');
      
      // Test signOut first to ensure we're in a clean state
      try {
        await window.signOutUser();
        this.addResult('auth', 'signOut', true, 'Successfully signed out');
      } catch (error) {
        this.addResult('auth', 'signOut', false, `Error signing out: ${error.message}`);
      }
      
      // Check initial auth state
      const initialAuthState = await window.isUserLoggedIn();
      this.addResult('auth', 'initialState', true, `Initial auth state: ${initialAuthState ? 'logged in' : 'logged out'}`);
      
      // Try sign in with test user
      try {
        const { data, error } = await window.signInUser('test@johnny2003.com', 'password123');
        if (error) {
          this.addResult('auth', 'signIn', false, `Error signing in: ${error.message}`);
        } else {
          this.addResult('auth', 'signIn', true, 'Successfully signed in test user');
        }
      } catch (error) {
        this.addResult('auth', 'signIn', false, `Exception during sign in: ${error.message}`);
      }
      
      // Check auth state after sign in
      const afterSignInState = await window.isUserLoggedIn();
      this.addResult('auth', 'stateAfterSignIn', afterSignInState, 
        `Auth state after sign in: ${afterSignInState ? 'logged in' : 'still logged out'}`);
      
      // Try to get current user
      try {
        const { user, error } = await window.getCurrentUser();
        if (error) {
          this.addResult('auth', 'getCurrentUser', false, `Error getting current user: ${error.message}`);
        } else if (user) {
          this.addResult('auth', 'getCurrentUser', true, `Current user: ${user.email}`);
        } else {
          this.addResult('auth', 'getCurrentUser', false, 'No current user found');
        }
      } catch (error) {
        this.addResult('auth', 'getCurrentUser', false, `Exception getting current user: ${error.message}`);
      }
      
      // Sign out again
      try {
        await window.signOutUser();
        this.addResult('auth', 'finalSignOut', true, 'Successfully signed out');
      } catch (error) {
        this.addResult('auth', 'finalSignOut', false, `Error signing out: ${error.message}`);
      }
    } catch (error) {
      this.addResult('auth', 'overall', false, `Unexpected error in auth tests: ${error.message}`);
    }
  }
  
  // Test products
  async testProducts() {
    this.updateStatus('Testing products...');
    
    try {
      // Try to query products
      try {
        let productsResult;
        if (window.runMcpSupabaseQuery) {
          productsResult = await window.runMcpSupabaseQuery('SELECT * FROM products LIMIT 5');
        } else {
          this.addResult('products', 'query', false, 'MCP query function not available');
          return;
        }
        
        if (!productsResult || productsResult.error) {
          this.addResult('products', 'query', false, 
            `Error querying products: ${productsResult?.error || 'No results'}`);
        } else {
          const productCount = Array.isArray(productsResult) ? productsResult.length : 0;
          this.addResult('products', 'query', true, `Retrieved ${productCount} products`);
          
          // Check product structure
          if (productCount > 0) {
            const product = productsResult[0];
            const hasRequiredFields = product.id && product.name && product.price && product.image_url;
            this.addResult('products', 'structure', hasRequiredFields, 
              hasRequiredFields ? 'Product has required fields' : 'Product missing required fields');
          }
        }
      } catch (error) {
        this.addResult('products', 'query', false, `Exception querying products: ${error.message}`);
      }
    } catch (error) {
      this.addResult('products', 'overall', false, `Unexpected error in product tests: ${error.message}`);
    }
  }
  
  // Test cart functionality
  async testCart() {
    this.updateStatus('Testing cart functionality...');
    
    try {
      // Check if cart object exists
      if (!window.cart) {
        this.addResult('cart', 'object', false, 'Cart object not found');
        return;
      }
      this.addResult('cart', 'object', true, 'Cart object available');
      
      // Test adding item to cart
      try {
        const testItem = {
          id: `test-item-${Date.now()}`,
          name: 'Test Product',
          price: 1200,
          image: '../assets/images/test.png',
          quantity: 1,
          size: 'M'
        };
        
        const result = await window.cart.addItem(testItem);
        if (result && result.success) {
          this.addResult('cart', 'addItem', true, 'Successfully added item to cart');
        } else {
          this.addResult('cart', 'addItem', false, 
            `Error adding item to cart: ${result?.message || 'Unknown error'}`);
        }
        
        // Check if item was added
        const itemInCart = window.cart.items.some(item => item.id === testItem.id);
        this.addResult('cart', 'itemPresent', itemInCart, 
          itemInCart ? 'Item found in cart' : 'Item not found in cart');
        
        // Test cart persistence
        await window.cart.saveCart();
        this.addResult('cart', 'saveCart', true, 'Saved cart');
        
        // Test item removal
        await window.cart.removeItem(testItem.id);
        const itemRemovedFromCart = !window.cart.items.some(item => item.id === testItem.id);
        this.addResult('cart', 'removeItem', itemRemovedFromCart, 
          itemRemovedFromCart ? 'Item removed from cart' : 'Failed to remove item from cart');
      } catch (error) {
        this.addResult('cart', 'operations', false, `Exception during cart operations: ${error.message}`);
      }
      
      // Test cart with Supabase (if user is logged in)
      try {
        const isLoggedIn = await window.isUserLoggedIn();
        if (isLoggedIn) {
          // Try to save cart to Supabase
          if (window.runMcpSupabaseQuery) {
            try {
              const cartResult = await window.runMcpSupabaseQuery(`
                SELECT * FROM carts WHERE user_id = auth.uid()
              `);
              if (cartResult && !cartResult.error) {
                this.addResult('cart', 'supabaseCart', true, 'Retrieved cart from Supabase');
              } else {
                this.addResult('cart', 'supabaseCart', false, 
                  `Error retrieving cart from Supabase: ${cartResult?.error || 'No results'}`);
              }
            } catch (error) {
              this.addResult('cart', 'supabaseCart', false, 
                `Exception retrieving cart from Supabase: ${error.message}`);
            }
          }
        } else {
          this.addResult('cart', 'supabaseCart', true, 'Skipped Supabase cart test (user not logged in)');
        }
      } catch (error) {
        this.addResult('cart', 'supabaseTest', false, `Exception during Supabase cart test: ${error.message}`);
      }
    } catch (error) {
      this.addResult('cart', 'overall', false, `Unexpected error in cart tests: ${error.message}`);
    }
  }
  
  // Display final test results
  showFinalResults() {
    // Count successes
    const totalTests = Object.values(this.results).reduce((count, category) => 
      count + Object.keys(category.details).length, 0);
    
    const successfulTests = Object.values(this.results).reduce((count, category) => 
      count + Object.values(category.details).filter(test => test.success).length, 0);
    
    const overallSuccess = Object.values(this.results).every(category => category.success);
    
    this.updateStatus(`Tests completed: ${successfulTests}/${totalTests} passed`);
    
    // Add summary to console
    console.log('%c Supabase Integration Test Results', 'font-size: 16px; font-weight: bold;');
    console.log(`Overall result: ${overallSuccess ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Tests passed: ${successfulTests}/${totalTests}`);
    console.log('Detailed results:', this.results);
    
    // Return results
    return {
      overallSuccess,
      totalTests,
      successfulTests,
      details: this.results
    };
  }
}

// Initialize tests on load
window.runSupabaseIntegrationTest = () => {
  const tester = new SupabaseIntegrationTest();
  tester.init();
  return tester;
};

// Auto-run test if URL has test parameter
if (window.location.search.includes('test=supabase')) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      window.runSupabaseIntegrationTest();
    }, 1000);
  });
}

console.log('Supabase integration test script loaded. Run window.runSupabaseIntegrationTest() to start tests.'); 