/**
 * Stock Management Script
 * 
 * Admin tool for managing product inventory
 */

// Main class for stock management
class StockManager {
  constructor() {
    this.products = [];
    this.lowStockThreshold = 5;
    this.statusElement = document.getElementById('status-message');
    this.productTableBody = document.getElementById('product-table-body');
    this.lowStockTableBody = document.getElementById('low-stock-table-body');
  }

  // Initialize the stock manager
  async init() {
    this.showStatus('Initializing stock manager...');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load products
    await this.loadProducts();
    
    // Check for low stock
    await this.checkLowStock();
    
    this.showStatus('Stock manager initialized');
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
    // Stock adjustment form
    document.getElementById('stock-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const productId = document.getElementById('product-id').value;
      const adjustment = parseInt(document.getElementById('adjustment').value, 10);
      const reason = document.getElementById('reason').value;
      
      if (!productId || isNaN(adjustment) || !reason) {
        this.showStatus('Please fill out all fields', true);
        return;
      }
      
      await this.adjustStock(productId, adjustment, reason);
    });
    
    // Refresh button
    document.getElementById('refresh-button')?.addEventListener('click', async () => {
      await this.loadProducts();
      await this.checkLowStock();
    });
    
    // Search field
    document.getElementById('search-field')?.addEventListener('input', (e) => {
      const searchTerm = e.target.value.toLowerCase();
      this.filterProducts(searchTerm);
    });
    
    // Set low stock threshold
    document.getElementById('threshold-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const threshold = parseInt(document.getElementById('threshold').value, 10);
      
      if (!isNaN(threshold) && threshold >= 0) {
        this.lowStockThreshold = threshold;
        this.checkLowStock();
        this.showStatus(`Low stock threshold set to ${threshold}`);
      }
    });
  }
  
  // Load products from Supabase
  async loadProducts() {
    try {
      this.showStatus('Loading products...');
      
      if (window.runMcpSupabaseQuery) {
        const results = await window.runMcpSupabaseQuery(`
          SELECT * FROM products ORDER BY category, name
        `);
        
        if (results && !results.error) {
          this.products = results;
          this.renderProductTable();
          this.showStatus(`Loaded ${this.products.length} products`);
        } else {
          this.showStatus('Error loading products: ' + (results?.error || 'Unknown error'), true);
        }
      } else {
        this.showStatus('Supabase query function not available', true);
      }
    } catch (error) {
      this.showStatus('Error loading products: ' + error.message, true);
    }
  }
  
  // Render product table
  renderProductTable() {
    if (!this.productTableBody) return;
    
    this.productTableBody.innerHTML = '';
    
    if (this.products.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="5" class="no-data">No products found</td>`;
      this.productTableBody.appendChild(row);
      return;
    }
    
    this.products.forEach(product => {
      const row = document.createElement('tr');
      row.className = product.stock <= this.lowStockThreshold ? 'low-stock' : '';
      
      row.innerHTML = `
        <td>${product.product_id}</td>
        <td>${product.name}</td>
        <td>${product.category || 'N/A'}</td>
        <td class="stock-cell">${product.stock}</td>
        <td>
          <button class="adjust-btn" data-id="${product.product_id}" data-name="${product.name}">Adjust</button>
          <button class="history-btn" data-id="${product.product_id}">History</button>
        </td>
      `;
      
      this.productTableBody.appendChild(row);
      
      // Add event listeners to buttons
      row.querySelector('.adjust-btn').addEventListener('click', () => {
        this.prepareAdjustmentForm(product.product_id, product.name);
      });
      
      row.querySelector('.history-btn').addEventListener('click', () => {
        this.showStockHistory(product.product_id);
      });
    });
  }
  
  // Filter products based on search term
  filterProducts(searchTerm) {
    if (!this.productTableBody) return;
    
    const rows = this.productTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
      const productId = row.querySelector('td:first-child')?.textContent;
      const name = row.querySelector('td:nth-child(2)')?.textContent;
      const category = row.querySelector('td:nth-child(3)')?.textContent;
      
      if (!productId || !name) return;
      
      if (
        productId.toLowerCase().includes(searchTerm) || 
        name.toLowerCase().includes(searchTerm) || 
        category.toLowerCase().includes(searchTerm)
      ) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }
  
  // Prepare adjustment form with product info
  prepareAdjustmentForm(productId, productName) {
    const productIdField = document.getElementById('product-id');
    const productNameDisplay = document.getElementById('product-name-display');
    const adjustmentField = document.getElementById('adjustment');
    const reasonField = document.getElementById('reason');
    
    if (productIdField) productIdField.value = productId;
    if (productNameDisplay) productNameDisplay.textContent = productName;
    if (adjustmentField) adjustmentField.value = '';
    if (reasonField) reasonField.value = '';
    
    // Scroll to form
    document.getElementById('stock-adjustment-section')?.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Adjust stock for a product
  async adjustStock(productId, adjustment, reason) {
    try {
      this.showStatus(`Adjusting stock for ${productId}...`);
      
      if (window.runMcpSupabaseQuery) {
        const result = await window.runMcpSupabaseQuery(`
          SELECT * FROM admin_adjust_stock('${productId}', ${adjustment}, '${reason}')
        `);
        
        if (result && result[0] && result[0].admin_adjust_stock) {
          const adjustResult = result[0].admin_adjust_stock;
          
          if (adjustResult.success) {
            this.showStatus(`Stock adjusted: ${adjustResult.previous_stock} → ${adjustResult.new_stock}`);
            
            // Reload products to reflect changes
            await this.loadProducts();
            await this.checkLowStock();
          } else {
            this.showStatus(`Error adjusting stock: ${adjustResult.error}`, true);
          }
        } else {
          this.showStatus('Error adjusting stock: Unknown error', true);
        }
      } else {
        this.showStatus('Supabase query function not available', true);
      }
    } catch (error) {
      this.showStatus('Error adjusting stock: ' + error.message, true);
    }
  }
  
  // Show stock history for a product
  async showStockHistory(productId) {
    try {
      this.showStatus(`Loading history for ${productId}...`);
      
      if (window.runMcpSupabaseQuery) {
        const results = await window.runMcpSupabaseQuery(`
          SELECT 
            sh.*, 
            p.name as product_name
          FROM 
            stock_history sh
          JOIN 
            products p ON sh.product_id = p.product_id
          WHERE 
            sh.product_id = '${productId}'
          ORDER BY 
            sh.created_at DESC
        `);
        
        if (results && !results.error) {
          this.renderHistoryModal(results);
        } else {
          this.showStatus('Error loading history: ' + (results?.error || 'Unknown error'), true);
        }
      } else {
        this.showStatus('Supabase query function not available', true);
      }
    } catch (error) {
      this.showStatus('Error loading history: ' + error.message, true);
    }
  }
  
  // Render history modal
  renderHistoryModal(historyItems) {
    // Create or get modal
    let modal = document.getElementById('history-modal');
    
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'history-modal';
      modal.className = 'modal';
      document.body.appendChild(modal);
    }
    
    const productName = historyItems.length > 0 ? historyItems[0].product_name : 'Unknown Product';
    
    // Populate modal
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Stock History: ${productName}</h2>
          <span class="close-modal">&times;</span>
        </div>
        <div class="modal-body">
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Previous</th>
                <th>Change</th>
                <th>New</th>
                <th>Reason</th>
                <th>Order ID</th>
              </tr>
            </thead>
            <tbody>
              ${historyItems.length === 0 ? '<tr><td colspan="6" class="no-data">No history found</td></tr>' : ''}
              ${historyItems.map(item => `
                <tr class="${item.change_amount < 0 ? 'negative-change' : 'positive-change'}">
                  <td>${new Date(item.created_at).toLocaleString()}</td>
                  <td>${item.previous_stock}</td>
                  <td>${item.change_amount < 0 ? '' : '+'}${item.change_amount}</td>
                  <td>${item.new_stock}</td>
                  <td>${item.reason || 'N/A'}</td>
                  <td>${item.order_id || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    // Show modal
    modal.style.display = 'block';
    
    // Add close button listener
    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.style.display = 'none';
    });
    
    // Close when clicking outside
    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Check for low stock items
  async checkLowStock() {
    try {
      if (!this.lowStockTableBody) return;
      
      this.showStatus('Checking for low stock items...');
      
      if (window.runMcpSupabaseQuery) {
        const results = await window.runMcpSupabaseQuery(`
          SELECT * FROM get_low_stock_products(${this.lowStockThreshold})
        `);
        
        if (results && !results.error) {
          this.renderLowStockTable(results);
        } else {
          this.showStatus('Error checking low stock: ' + (results?.error || 'Unknown error'), true);
        }
      } else {
        this.showStatus('Supabase query function not available', true);
      }
    } catch (error) {
      this.showStatus('Error checking low stock: ' + error.message, true);
    }
  }
  
  // Render low stock table
  renderLowStockTable(lowStockItems) {
    if (!this.lowStockTableBody) return;
    
    this.lowStockTableBody.innerHTML = '';
    
    if (lowStockItems.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="4" class="no-data">No low stock items found</td>`;
      this.lowStockTableBody.appendChild(row);
      return;
    }
    
    lowStockItems.forEach(item => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${item.product_id}</td>
        <td>${item.name}</td>
        <td>${item.category || 'N/A'}</td>
        <td class="stock-cell">${item.current_stock}</td>
      `;
      
      this.lowStockTableBody.appendChild(row);
    });
  }
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const stockManager = new StockManager();
  stockManager.init();
});

// Export the StockManager for global use
window.StockManager = StockManager; 