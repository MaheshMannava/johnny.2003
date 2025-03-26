/**
 * Orders Management Script
 * 
 * Admin tool for managing customer orders
 */

class OrderManager {
  constructor() {
    this.orders = [];
    this.currentPage = 1;
    this.ordersPerPage = 10;
    this.currentFilters = {
      status: 'all',
      dateFrom: null,
      dateTo: null
    };
    this.statusElement = document.getElementById('status-message');
    this.ordersTableBody = document.getElementById('orders-table-body');
    this.ordersPagination = document.getElementById('orders-pagination');
    this.currentOrderId = null;
  }
  
  // Initialize the order manager
  async init() {
    this.showStatus('Initializing order manager...');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load orders
    await this.loadOrders();
    
    this.showStatus('Order manager initialized');
  }
  
  // Show status message
  showStatus(message, isError = false) {
    if (this.statusElement) {
      this.statusElement.textContent = message;
      this.statusElement.className = isError ? 'error' : 'success';
    }
    console.log(isError ? 'Error: ' : 'Status: ', message);
  }
  
  // Set up event listeners
  setupEventListeners() {
    // Refresh button
    document.getElementById('refresh-orders')?.addEventListener('click', () => {
      this.loadOrders();
    });
    
    // Filter buttons
    document.getElementById('apply-filters')?.addEventListener('click', () => {
      this.applyFilters();
    });
    
    document.getElementById('clear-filters')?.addEventListener('click', () => {
      this.clearFilters();
    });
    
    // Back to orders list button
    document.getElementById('back-to-orders')?.addEventListener('click', () => {
      this.showOrdersList();
    });
    
    // Update status button
    document.getElementById('update-status-btn')?.addEventListener('click', () => {
      if (this.currentOrderId) {
        const newStatus = document.getElementById('status-update').value;
        this.updateOrderStatus(this.currentOrderId, newStatus);
      }
    });
  }
  
  // Load orders from Supabase
  async loadOrders() {
    try {
      this.showStatus('Loading orders...');
      
      if (window.runMcpSupabaseQuery) {
        let query = `
          SELECT 
            o.order_id, 
            o.user_id, 
            o.items, 
            o.total, 
            o.status, 
            o.shipping_address, 
            o.payment_info, 
            o.created_at,
            au.email as user_email
          FROM 
            orders o
          LEFT JOIN 
            auth.users au ON o.user_id = au.id
        `;
        
        // Apply filters if any
        const whereConditions = [];
        
        if (this.currentFilters.status && this.currentFilters.status !== 'all') {
          whereConditions.push(`o.status = '${this.currentFilters.status}'`);
        }
        
        if (this.currentFilters.dateFrom) {
          whereConditions.push(`o.created_at >= '${this.currentFilters.dateFrom}'`);
        }
        
        if (this.currentFilters.dateTo) {
          whereConditions.push(`o.created_at <= '${this.currentFilters.dateTo}'`);
        }
        
        if (whereConditions.length > 0) {
          query += ' WHERE ' + whereConditions.join(' AND ');
        }
        
        // Add order by and limit
        query += ' ORDER BY o.created_at DESC';
        
        const results = await window.runMcpSupabaseQuery(query);
        
        if (results && !results.error) {
          this.orders = results;
          this.renderOrdersTable();
          this.renderPagination();
          this.showStatus(`Loaded ${this.orders.length} orders`);
        } else {
          this.showStatus('Error loading orders: ' + (results?.error || 'Unknown error'), true);
        }
      } else {
        this.showStatus('Supabase query function not available', true);
      }
    } catch (error) {
      this.showStatus('Error loading orders: ' + error.message, true);
    }
  }
  
  // Render orders table
  renderOrdersTable() {
    if (!this.ordersTableBody) return;
    
    this.ordersTableBody.innerHTML = '';
    
    if (this.orders.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="7" class="no-data">No orders found</td>`;
      this.ordersTableBody.appendChild(row);
      return;
    }
    
    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.ordersPerPage;
    const endIndex = Math.min(startIndex + this.ordersPerPage, this.orders.length);
    const ordersToShow = this.orders.slice(startIndex, endIndex);
    
    ordersToShow.forEach(order => {
      const row = document.createElement('tr');
      
      // Parse the items JSON
      const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      const itemsCount = Array.isArray(items) ? items.length : 0;
      
      // Format the date
      const orderDate = new Date(order.created_at).toLocaleDateString();
      
      // Format total as currency
      const totalFormatted = this.formatCurrency(order.total / 100); // Assuming the total is stored in cents
      
      row.innerHTML = `
        <td>${order.order_id}</td>
        <td>${orderDate}</td>
        <td>${order.user_email || 'Guest'}</td>
        <td>${itemsCount} item${itemsCount !== 1 ? 's' : ''}</td>
        <td>${totalFormatted}</td>
        <td>
          <span class="order-status status-${order.status}">${order.status}</span>
        </td>
        <td class="order-actions">
          <button class="btn btn-small btn-primary view-order-btn" data-id="${order.order_id}">View</button>
        </td>
      `;
      
      this.ordersTableBody.appendChild(row);
      
      // Add event listener to view button
      row.querySelector('.view-order-btn').addEventListener('click', () => {
        this.viewOrderDetails(order.order_id);
      });
    });
  }
  
  // Format currency
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  // Render pagination
  renderPagination() {
    if (!this.ordersPagination) return;
    
    this.ordersPagination.innerHTML = '';
    
    const totalPages = Math.ceil(this.orders.length / this.ordersPerPage);
    
    if (totalPages <= 1) {
      this.ordersPagination.style.display = 'none';
      return;
    }
    
    this.ordersPagination.style.display = 'flex';
    
    // Previous page button
    if (this.currentPage > 1) {
      const prevItem = document.createElement('li');
      prevItem.innerHTML = `<a href="#" data-page="${this.currentPage - 1}">&laquo;</a>`;
      this.ordersPagination.appendChild(prevItem);
    }
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      const pageItem = document.createElement('li');
      pageItem.innerHTML = `<a href="#" data-page="${i}" ${i === this.currentPage ? 'class="active"' : ''}>${i}</a>`;
      this.ordersPagination.appendChild(pageItem);
    }
    
    // Next page button
    if (this.currentPage < totalPages) {
      const nextItem = document.createElement('li');
      nextItem.innerHTML = `<a href="#" data-page="${this.currentPage + 1}">&raquo;</a>`;
      this.ordersPagination.appendChild(nextItem);
    }
    
    // Add event listeners to pagination links
    this.ordersPagination.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.target.dataset.page, 10);
        if (page !== this.currentPage) {
          this.currentPage = page;
          this.renderOrdersTable();
          this.renderPagination();
        }
      });
    });
  }
  
  // Apply filters
  applyFilters() {
    const statusFilter = document.getElementById('status-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    this.currentFilters = {
      status: statusFilter ? statusFilter.value : 'all',
      dateFrom: dateFrom && dateFrom.value ? dateFrom.value : null,
      dateTo: dateTo && dateTo.value ? dateTo.value : null
    };
    
    this.currentPage = 1;
    this.loadOrders();
  }
  
  // Clear filters
  clearFilters() {
    const statusFilter = document.getElementById('status-filter');
    const dateFrom = document.getElementById('date-from');
    const dateTo = document.getElementById('date-to');
    
    if (statusFilter) statusFilter.value = 'all';
    if (dateFrom) dateFrom.value = '';
    if (dateTo) dateTo.value = '';
    
    this.currentFilters = {
      status: 'all',
      dateFrom: null,
      dateTo: null
    };
    
    this.currentPage = 1;
    this.loadOrders();
  }
  
  // View order details
  async viewOrderDetails(orderId) {
    try {
      this.showStatus(`Loading order details for ${orderId}...`);
      
      // Find the order in the already loaded orders
      let orderDetails = this.orders.find(order => order.order_id === orderId);
      
      // If not found, fetch it from the database
      if (!orderDetails && window.runMcpSupabaseQuery) {
        const result = await window.runMcpSupabaseQuery(`
          SELECT 
            o.order_id, 
            o.user_id, 
            o.items, 
            o.total, 
            o.status, 
            o.shipping_address, 
            o.payment_info, 
            o.created_at,
            au.email as user_email
          FROM 
            orders o
          LEFT JOIN 
            auth.users au ON o.user_id = au.id
          WHERE 
            o.order_id = '${orderId}'
        `);
        
        if (result && result.length > 0) {
          orderDetails = result[0];
        }
      }
      
      if (!orderDetails) {
        this.showStatus(`Order ${orderId} not found`, true);
        return;
      }
      
      // Save the current order ID
      this.currentOrderId = orderId;
      
      // Update the order detail view
      this.populateOrderDetails(orderDetails);
      
      // Show the detail view and hide the list view
      document.getElementById('orders-list-view').style.display = 'none';
      document.getElementById('order-detail-view').style.display = 'block';
      
      this.showStatus(`Viewing order ${orderId}`);
      
      // Set the current status in the status update dropdown
      const statusUpdate = document.getElementById('status-update');
      if (statusUpdate) {
        statusUpdate.value = orderDetails.status;
      }
    } catch (error) {
      this.showStatus('Error loading order details: ' + error.message, true);
    }
  }
  
  // Populate order details
  populateOrderDetails(order) {
    // Set basic order information
    document.getElementById('detail-order-id').textContent = order.order_id;
    document.getElementById('detail-order-date').textContent = new Date(order.created_at).toLocaleString();
    
    // Set status
    const statusElement = document.getElementById('detail-order-status');
    if (statusElement) {
      statusElement.textContent = order.status;
      statusElement.className = `order-status status-${order.status}`;
    }
    
    // Set customer information
    document.getElementById('detail-customer-email').textContent = order.user_email || 'Guest';
    document.getElementById('detail-customer-id').textContent = order.user_id || 'N/A';
    
    // Set shipping address
    const shippingAddress = typeof order.shipping_address === 'string' 
      ? JSON.parse(order.shipping_address) 
      : order.shipping_address;
    
    let addressHtml = '';
    if (shippingAddress) {
      addressHtml = `
        ${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
        ${shippingAddress.address || ''} ${shippingAddress.apartment ? ', ' + shippingAddress.apartment : ''}<br>
        ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}<br>
        Phone: ${shippingAddress.phone || 'N/A'}
      `;
    } else {
      addressHtml = 'No shipping address provided';
    }
    document.getElementById('detail-shipping-address').innerHTML = addressHtml;
    
    // Set payment information
    const paymentInfo = typeof order.payment_info === 'string' 
      ? JSON.parse(order.payment_info) 
      : order.payment_info;
    
    let paymentHtml = '';
    if (paymentInfo) {
      // Mask card number for security
      const maskedCard = paymentInfo.cardNumber 
        ? '****-****-****-' + paymentInfo.cardNumber.slice(-4) 
        : 'N/A';
      
      paymentHtml = `
        <div><strong>Card:</strong> ${maskedCard}</div>
        <div><strong>Name on Card:</strong> ${paymentInfo.nameOnCard || 'N/A'}</div>
        <div><strong>Expiry:</strong> ${paymentInfo.expiryDate || 'N/A'}</div>
      `;
    } else {
      paymentHtml = 'No payment information available';
    }
    document.getElementById('detail-payment-info').innerHTML = paymentHtml;
    
    // Set order items
    const orderItems = typeof order.items === 'string' 
      ? JSON.parse(order.items) 
      : order.items;
    
    const orderItemsContainer = document.getElementById('detail-order-items');
    orderItemsContainer.innerHTML = '';
    
    if (Array.isArray(orderItems) && orderItems.length > 0) {
      orderItems.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'order-item';
        
        const itemTotal = (item.price * item.quantity) / 100; // Assuming price is in cents
        
        itemElement.innerHTML = `
          <div class="order-item-image">
            <img src="${item.image || '../assets/images/placeholder.png'}" alt="${item.name}">
          </div>
          <div class="order-item-details">
            <div class="order-item-name">${item.name || 'Unknown Product'}</div>
            <div class="order-item-variant">Size: ${item.size || 'One Size'}</div>
          </div>
          <div class="order-item-quantity">×${item.quantity}</div>
          <div class="order-item-price">${this.formatCurrency(itemTotal)}</div>
        `;
        
        orderItemsContainer.appendChild(itemElement);
      });
    } else {
      orderItemsContainer.innerHTML = '<div class="no-data">No items in this order</div>';
    }
    
    // Set order total
    document.getElementById('detail-order-total').textContent = this.formatCurrency(order.total / 100);
  }
  
  // Show orders list and hide detail view
  showOrdersList() {
    document.getElementById('orders-list-view').style.display = 'block';
    document.getElementById('order-detail-view').style.display = 'none';
    this.currentOrderId = null;
  }
  
  // Update order status
  async updateOrderStatus(orderId, newStatus) {
    try {
      this.showStatus(`Updating status for order ${orderId} to ${newStatus}...`);
      
      if (window.runMcpSupabaseQuery) {
        // Use the dedicated Supabase function for updating order status
        const result = await window.runMcpSupabaseQuery(`
          SELECT * FROM update_order_status('${orderId}', '${newStatus}')
        `);
        
        if (result && result[0] && result[0].update_order_status) {
          const updateResult = result[0].update_order_status;
          
          if (updateResult.success) {
            this.showStatus(`Order ${orderId} status updated to ${newStatus}`);
            
            // Update the status display
            const statusElement = document.getElementById('detail-order-status');
            if (statusElement) {
              statusElement.textContent = newStatus;
              statusElement.className = `order-status status-${newStatus}`;
            }
            
            // Update the order in the orders array
            const orderIndex = this.orders.findIndex(order => order.order_id === orderId);
            if (orderIndex !== -1) {
              this.orders[orderIndex].status = newStatus;
            }
          } else {
            this.showStatus(`Error updating order status: ${updateResult.error}`, true);
          }
        } else {
          this.showStatus('Error updating order status: Unknown error', true);
        }
      } else {
        this.showStatus('Supabase query function not available', true);
      }
    } catch (error) {
      this.showStatus('Error updating order status: ' + error.message, true);
    }
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const orderManager = new OrderManager();
  orderManager.init();
});

// Export the OrderManager for global use
window.OrderManager = OrderManager; 