/**
 * MCP Connection Test Script
 * 
 * This is a utility script to test the MCP Supabase connection.
 * Run it directly in the browser console to verify the setup is working.
 */

// Test MCP connection function
async function testMcpConnection() {
  console.log('Testing MCP Supabase connection...');
  
  try {
    // Check if MCP bridge is available
    if (typeof window.runMcpSupabaseQuery !== 'function') {
      console.error('MCP Supabase bridge not initialized. Make sure mcp-supabase-bridge.js is loaded properly.');
      return {
        success: false,
        message: 'MCP Supabase bridge not initialized'
      };
    }
    
    // Attempt to run a simple query
    const result = await window.runMcpSupabaseQuery('SELECT current_timestamp');
    console.log('MCP Query result:', result);
    
    if (result && result.length > 0) {
      console.log('✅ MCP Supabase connection successful!');
      return {
        success: true,
        message: 'MCP Supabase connection successful',
        timestamp: result[0].current_timestamp
      };
    } else {
      console.warn('⚠️ MCP Supabase query returned empty result');
      return {
        success: false,
        message: 'MCP Supabase query returned empty result'
      };
    }
  } catch (error) {
    console.error('❌ MCP Supabase connection failed:', error);
    return {
      success: false,
      message: 'MCP Supabase connection failed: ' + error.message
    };
  }
}

// Test Supabase auth functions
async function testSupabaseAuth() {
  console.log('Testing Supabase auth functions...');
  
  try {
    if (!window.isUserLoggedIn) {
      console.error('Supabase auth functions not available. Make sure supabase.js is loaded properly.');
      return {
        success: false,
        message: 'Supabase auth functions not available'
      };
    }
    
    // Test isUserLoggedIn function
    const isLoggedIn = await window.isUserLoggedIn();
    console.log('isUserLoggedIn result:', isLoggedIn);
    
    return {
      success: true,
      message: 'Supabase auth functions test completed',
      isLoggedIn
    };
  } catch (error) {
    console.error('Supabase auth functions test failed:', error);
    return {
      success: false,
      message: 'Supabase auth functions test failed: ' + error.message
    };
  }
}

// Test cart functionality
async function testCartWithMcp() {
  console.log('Testing cart functionality with MCP...');
  
  try {
    if (!window.cart) {
      console.error('Cart object not available. Make sure cart.js is loaded properly.');
      return {
        success: false,
        message: 'Cart object not available'
      };
    }
    
    // Add a test item to cart
    const testItem = {
      id: 'test-item-' + Date.now(),
      name: 'Test Product',
      price: 1000,
      image: '../assets/images/test.png',
      quantity: 1,
      size: 'M'
    };
    
    // Add item to cart
    const addResult = await window.cart.addItem(testItem);
    console.log('Add item result:', addResult);
    
    // Check if item was added
    console.log('Current cart items:', window.cart.items);
    
    // Remove test item
    await window.cart.removeItem(testItem.id);
    console.log('Item removed, current cart:', window.cart.items);
    
    return {
      success: true,
      message: 'Cart functionality test completed',
      addResult
    };
  } catch (error) {
    console.error('Cart functionality test failed:', error);
    return {
      success: false,
      message: 'Cart functionality test failed: ' + error.message
    };
  }
}

// Run all tests
async function runAllTests() {
  console.log('=============================================');
  console.log('Starting MCP Supabase integration tests...');
  console.log('=============================================');
  
  const mcpResult = await testMcpConnection();
  console.log('---------------------------------------------');
  const authResult = await testSupabaseAuth();
  console.log('---------------------------------------------');
  const cartResult = await testCartWithMcp();
  console.log('---------------------------------------------');
  
  console.log('Test Summary:');
  console.log('- MCP Connection:', mcpResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('- Supabase Auth:', authResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('- Cart with MCP:', cartResult.success ? '✅ PASS' : '❌ FAIL');
  console.log('=============================================');
  
  return {
    mcp: mcpResult,
    auth: authResult,
    cart: cartResult,
    overallSuccess: mcpResult.success && authResult.success && cartResult.success
  };
}

// Export the test functions
window.testMcpConnection = testMcpConnection;
window.testSupabaseAuth = testSupabaseAuth;
window.testCartWithMcp = testCartWithMcp;
window.runMcpTests = runAllTests;

console.log('MCP test utilities loaded. Run window.runMcpTests() to test the MCP Supabase integration.'); 