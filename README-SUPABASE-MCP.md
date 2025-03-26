# Johnny.2003 MCP Supabase Integration

This document explains how to use the MCP Supabase integration with the Johnny.2003 website.

## Overview

The Johnny.2003 website has been configured to work with Supabase via MCP (Model Control Protocol) for data storage and authentication. This integration allows:

1. User authentication (login, signup, password reset)
2. Product data retrieval
3. Cart management and persistence
4. Order management

## Setup

### 1. Database Setup

Run the SQL in `setup-supabase-tables.sql` using your Supabase SQL Editor to set up the required tables:

- `products`: Stores product information
- `carts`: Stores user cart data
- `orders`: Stores user order information

### 2. Authentication Setup

The website uses Supabase Authentication. Ensure that:

- Email/password authentication is enabled in your Supabase dashboard
- Proper redirect URLs are set for password resets

### 3. Testing the Integration

#### Automated Testing

You can run the integration tests using two methods:

1. Open the website and run in the browser console:
   ```javascript
   window.runSupabaseIntegrationTest()
   ```

2. Add `?test=supabase` to the URL to auto-run tests on page load:
   ```
   https://your-site.com/index.html?test=supabase
   ```

#### Manual Testing

To manually test the integration:

1. **Authentication**:
   - Create an account using the signup form
   - Log in using your credentials
   - Check that your login state persists between page refreshes

2. **Products**:
   - Verify products are loaded from Supabase
   - Check that product details are displayed correctly

3. **Cart**:
   - Add items to your cart
   - Verify that the (+) and (-) buttons work to adjust quantities
   - Remove items using the (×) button
   - Verify cart contents persist between page refreshes
   - Log out and log in to verify cart contents are maintained

4. **Checkout**:
   - Proceed to checkout
   - Complete the checkout form
   - Verify successful order placement

## Integration Architecture

### Files

- `assets/js/mcp-supabase-bridge.js`: Handles communication with MCP Supabase
- `assets/js/supabase.js`: Main Supabase integration logic
- `assets/js/auth.js`: Authentication-related functionality
- `assets/js/cart.js`: Cart functionality with Supabase integration
- `test-mcp-connection.js`: Simple test script for MCP connections
- `assets/js/supabase-integration-test.js`: Comprehensive integration tests

### Fallback Mechanism

The integration includes a fallback mechanism:

1. **Priority**: MCP Supabase connection is attempted first
2. **Fallback 1**: If MCP fails, direct Supabase JS client is used
3. **Fallback 2**: If direct connection fails, mock authentication and local storage are used

This ensures the website continues to function even if connectivity issues occur.

## Customization

To modify the Supabase integration:

1. Update the Supabase URL and anon key in `assets/js/supabase.js` if needed
2. Customize table schemas in `setup-supabase-tables.sql` for your specific requirements
3. Add new functionality by extending the existing files

## Troubleshooting

### Common Issues

- **Connection Errors**: Check Supabase credentials and MCP configuration
- **Authentication Issues**: Verify that Supabase auth is configured correctly
- **Cart Persistence Issues**: Check browser console for errors related to cart operations

### Debugging

You can enable debug mode by adding `?debug=true` to the URL. This will show more detailed logs in the console.

To check the current connection status, run:

```javascript
window.testSupabaseConnection().then(console.log)
```

## Security Considerations

- The cart data is stored as a JSON string in Supabase
- Row-level security (RLS) policies ensure users can only access their own data
- Security-definer functions are used for sensitive operations

## License

This integration is part of the Johnny.2003 project and is subject to the same license terms as the main project. 