# Johnny's Store Admin Interface

This folder contains the admin interface for Johnny's Store. The admin interface provides tools for managing inventory, orders, and other aspects of the store.

## Features

### Stock Management

The stock management system allows administrators to:

- View all products and their current stock levels
- Filter and search for specific products
- Adjust stock levels with reason tracking
- View stock history for each product
- Set low stock thresholds and view alerts for products below those thresholds

### Order Management

The order management system allows administrators to:

- View all orders with filtering capabilities (status, date range)
- See detailed order information including customer data, shipping address, and payment details
- Update order status (confirmed, processing, shipped, delivered, cancelled)
- Manage the order fulfillment process

## Technical Implementation

The admin interface is built using:

- Vanilla JavaScript for frontend functionality
- Supabase for database interactions via the MCP bridge
- Custom SQL functions for secure data operations

### Database Functions

The following SQL functions support the admin interface:

- `admin_adjust_stock`: Adjusts product stock levels and records history
- `get_low_stock_products`: Retrieves products below a specified threshold
- `update_order_status`: Updates the status of an order
- `check_stock_availability`: Verifies if there's enough stock for orders
- `place_order`: Processes new orders and adjusts stock accordingly

### Security

The admin interface should be secured with proper authentication. Currently, it's using the same authentication system as the main store, but additional admin-specific checks should be implemented in a production environment.

## Setup

1. Ensure the Supabase database is set up with the required tables and functions (see `setup-supabase-tables.sql` in the root directory)
2. The MCP Supabase bridge should be properly configured (see `assets/js/mcp-supabase-bridge.js`)
3. Access the admin interface by navigating to the `/admin/` directory in the browser

## Files

- `index.html`: Admin dashboard main page
- `stock-management.html`: Stock management interface
- `stock-management.js`: Stock management functionality
- `orders.html`: Order management interface
- `orders.js`: Order management functionality
- `admin-styles.css`: Shared styles for admin pages

## Future Enhancements

Some planned improvements for the admin interface:

- User management system for controlling admin access
- Sales analytics and reporting
- Product management (add/edit/delete products)
- Bulk stock operations
- Export capabilities for orders and inventory reports
- Email notifications for low stock items and new orders 