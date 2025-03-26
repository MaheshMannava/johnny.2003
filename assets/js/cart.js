// Import Supabase functions
import { supabase, isUserLoggedIn, getCurrentUser } from './supabase.js';

// Cart class to handle all cart operations
class ShoppingCart {
    constructor() {
        this.items = [];
        this.cartKey = 'johnny_cart';
        this.sessionCartKey = 'johnny_session_cart';
        this.isInitialized = false;
        
        // Automatically initialize the cart when the class is instantiated
        this.init();
        
        // Set up event listener for beforeunload to handle non-logged in user cart clearing
        window.addEventListener('beforeunload', this.handlePageUnload.bind(this));
    }
    
    // Initialize the cart
    async init() {
        try {
            if (this.isInitialized) {
                console.log('Cart already initialized, skipping initialization');
                return;
            }
            
            console.log('Initializing cart...');
            
            // Get DOM elements
            this.bagIcon = document.querySelector('.bag-icon');
            this.cartDropdown = document.getElementById('cart-dropdown');
            this.checkoutBtn = document.getElementById('checkout-btn');
            
            console.log('Found DOM elements:', {
                bagIcon: !!this.bagIcon,
                cartDropdown: !!this.cartDropdown,
                checkoutBtn: !!this.checkoutBtn
            });
            
            // Try to load cart data
            await this.loadCart();
            
            // Update UI
            this.updateBadge();
            this.renderCartDropdown();
            
            // Set up event listeners for the bag icon
            if (this.bagIcon) {
                this.bagIcon.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevent default link behavior
                    e.stopPropagation();
                    this.toggleCartDropdown();
                    console.log('Bag icon clicked, toggling dropdown');
                });
            }
            
            // Set up event listener for checkout button
            if (this.checkoutBtn) {
                this.checkoutBtn.addEventListener('click', () => {
                    this.goToCheckout();
                });
            }
            
            // Set up event delegation for quantity controls
            document.addEventListener('click', async (e) => {
                // Close dropdown when clicking outside
                if (this.cartDropdown && this.cartDropdown.classList.contains('show') && 
                    !this.cartDropdown.contains(e.target) && e.target !== this.bagIcon) {
                    this.cartDropdown.classList.remove('show');
                }
                
                // Handle increase quantity button
                if (e.target.classList.contains('increase-quantity')) {
                    const itemId = e.target.dataset.itemId;
                    if (itemId) {
                        await this.increaseQuantity(itemId);
                    }
                }
                
                // Handle decrease quantity button
                if (e.target.classList.contains('decrease-quantity')) {
                    const itemId = e.target.dataset.itemId;
                    if (itemId) {
                        await this.decreaseQuantity(itemId);
                    }
                }
                
                // Handle remove item button
                if (e.target.classList.contains('remove-item')) {
                    const itemId = e.target.dataset.itemId;
                    if (itemId) {
                        await this.removeItem(itemId);
                    }
                }
            });
            
            // Mark the cart as initialized
            this.isInitialized = true;
            
            console.log('Cart initialized successfully with items:', this.items);
        } catch (error) {
            console.error('Error initializing cart:', error);
        }
    }
    
    // Handle the page unload event (browser close or navigation away)
    async handlePageUnload() {
        try {
            // Check if user is logged in
            const isLoggedIn = await isUserLoggedIn();
            
            // If not logged in, save cart to sessionStorage instead of localStorage
            // This ensures cart is available during the current session but gets cleared when browser is closed
            if (!isLoggedIn) {
                console.log('User not logged in, saving cart to session storage before page unload');
                sessionStorage.setItem(this.sessionCartKey, JSON.stringify(this.items));
                
                // Only clear localStorage cart if we're not going to checkout
                // This prevents cart data loss during the checkout process
                if (!sessionStorage.getItem('goingToCheckout')) {
                    localStorage.removeItem(this.cartKey);
                }
            }
        } catch (error) {
            console.error('Error handling page unload:', error);
        }
    }
    
    // Toggle cart dropdown visibility
    toggleCartDropdown() {
        console.log('Toggling cart dropdown...');
        
        if (!this.cartDropdown) {
            console.error('Cart dropdown element not found!');
            this.cartDropdown = document.getElementById('cart-dropdown');
            
            if (!this.cartDropdown) {
                console.error('Still cannot find cart dropdown element!');
                return;
            }
        }
        
        const isCurrentlyVisible = this.cartDropdown.classList.contains('show');
        console.log('Cart dropdown is currently', isCurrentlyVisible ? 'visible' : 'hidden');
        
        if (isCurrentlyVisible) {
            this.cartDropdown.classList.remove('show');
            console.log('Cart dropdown hidden');
        } else {
            this.renderCartDropdown(); // Update content before showing
            this.cartDropdown.classList.add('show');
            console.log('Cart dropdown shown');
        }
    }
    
    // Render cart items in dropdown
    renderCartDropdown() {
        const cartItemsContainer = document.getElementById('cart-items');
        const cartTotalAmount = document.getElementById('cart-total-amount');
        
        console.log('Rendering cart dropdown. Found elements:', {
            cartItemsContainer: !!cartItemsContainer,
            cartTotalAmount: !!cartTotalAmount
        });
        
        if (!cartItemsContainer) {
            console.error('Cart items container not found!');
            return;
        }
        
        // Clear existing content
        cartItemsContainer.innerHTML = '';
        
        if (this.items.length === 0) {
            // Show empty cart message
            console.log('Cart is empty');
            cartItemsContainer.innerHTML = '<div class="empty-cart-message">Your cart is empty</div>';
            if (cartTotalAmount) cartTotalAmount.textContent = '₹0';
            return;
        }
        
        console.log(`Rendering ${this.items.length} items in cart`);
        
        // Calculate total
        const total = this.getTotal();
        
        // Add each item to the dropdown
        this.items.forEach(item => {
            console.log('Rendering item:', item);
            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-size">Size: ${item.size}</div>
                    <div class="cart-item-price">₹${item.price} × ${item.quantity}</div>
                    <div class="cart-quantity-controls">
                        <button class="decrease-quantity" data-item-id="${item.id}">-</button>
                        <span class="item-quantity">${item.quantity}</span>
                        <button class="increase-quantity" data-item-id="${item.id}">+</button>
                        <button class="remove-item" data-item-id="${item.id}">×</button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
        
        // Update total
        if (cartTotalAmount) {
            cartTotalAmount.textContent = `₹${total}`;
            console.log('Updated cart total:', total);
        }
    }
    
    // Go to checkout page
    goToCheckout() {
        console.log('Redirecting to checkout page');
        
        // Save cart before redirecting to ensure latest data is available
        this.saveCart().then(() => {
            // Add a special flag in sessionStorage to indicate we're going to checkout
            // This helps prevent issues with cart data being lost between pages
            sessionStorage.setItem('goingToCheckout', 'true');
            
            // Check current URL path to build correct relative path
            const currentPath = window.location.pathname;
            const isInPagesDir = currentPath.includes('/pages/');
            
            if (isInPagesDir) {
                window.location.href = 'checkout.html';
            } else {
                window.location.href = 'pages/checkout.html';
            }
        }).catch(error => {
            console.error('Error saving cart before checkout:', error);
            // Continue to checkout even if saving fails
            sessionStorage.setItem('goingToCheckout', 'true');
            const isInPagesDir = window.location.pathname.includes('/pages/');
            window.location.href = isInPagesDir ? 'checkout.html' : 'pages/checkout.html';
        });
    }
    
    // Get cart total
    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    // Update cart badge
    updateBadge() {
        // Remove existing badge if any
        if (this.badgeElement) {
            this.badgeElement.remove();
            this.badgeElement = null;
        }
        
        // Get total quantity
        const totalQuantity = this.items.reduce((total, item) => total + item.quantity, 0);
        
        // Only create badge if there are items
        if (totalQuantity > 0 && this.bagIcon) {
            const badge = document.createElement('div');
            badge.className = 'cart-badge';
            badge.textContent = totalQuantity;
            
            // Find the parent container of the bag icon
            const container = this.bagIcon.closest('.cart-container') || this.bagIcon.parentElement;
            container.style.position = 'relative';
            container.appendChild(badge);
            
            this.badgeElement = badge;
        }
    }
    
    // Add item to cart
    async addItem(item) {
        try {
            console.log('Adding item to cart:', item);
            
            // Ensure item has all required properties
            if (!item.id || !item.name || !item.price || !item.image) {
                console.error('Item missing required properties:', item);
                return { success: false, message: 'Invalid item: missing required properties.' };
            }
            
            // Ensure quantity is a number greater than 0
            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
                item.quantity = 1;
            }
            
            // Default size if not provided
            if (!item.size) {
                item.size = 'M'; // Default size
                item.id = `${item.id}-M`; // Update ID to include size
            }
            
            // Check if item already exists in cart
            const existingItem = this.items.find(cartItem => cartItem.id === item.id);
            
            if (existingItem) {
                // Increase quantity of existing item
                existingItem.quantity += item.quantity || 1;
                console.log('Increased quantity of existing item:', existingItem);
            } else {
                // Add new item to cart
                this.items.push(item);
                console.log('Added new item to cart:', item);
            }
            
            // Save updated cart
            await this.saveCart();
            
            // Update UI
            this.updateBadge();
            this.renderCartDropdown();
            
            // Create a success message based on whether it was a new item or existing item
            const message = existingItem 
                ? `Increased quantity of ${item.name} in your bag!` 
                : `${item.name} added to your bag!`;
            
            return { success: true, message };
        } catch (error) {
            console.error('Error adding item to cart:', error);
            return { success: false, message: 'Error adding item to cart. Please try again.' };
        }
    }
    
    // Decrease the quantity of an item
    async decreaseQuantity(itemId) {
        try {
            const item = this.items.find(item => item.id === itemId);
            if (item) {
                item.quantity -= 1;
                
                // Remove item if quantity is 0
                if (item.quantity <= 0) {
                    await this.removeItem(itemId);
                    return;
                }
                
                // Save updated cart
                await this.saveCart();
                
                // Update UI
                this.updateBadge();
                this.renderCartDropdown();
            }
        } catch (error) {
            console.error('Error decreasing item quantity:', error);
        }
    }
    
    // Increase the quantity of an item
    async increaseQuantity(itemId) {
        try {
            const item = this.items.find(item => item.id === itemId);
            if (item) {
                item.quantity += 1;
                
                // Save updated cart
                await this.saveCart();
                
                // Update UI
                this.updateBadge();
                this.renderCartDropdown();
            }
        } catch (error) {
            console.error('Error increasing item quantity:', error);
        }
    }
    
    // Remove an item completely from the cart
    async removeItem(itemId) {
        try {
            // Filter out the item to remove
            this.items = this.items.filter(item => item.id !== itemId);
            
            // Save updated cart
            await this.saveCart();
            
            // Update UI
            this.updateBadge();
            this.renderCartDropdown();
        } catch (error) {
            console.error('Error removing item from cart:', error);
        }
    }
    
    // Load cart data from storage
    async loadCart() {
        try {
            // Check if user is logged in
            const isLoggedIn = await isUserLoggedIn();
            
            if (isLoggedIn) {
                // If logged in, try to get cart from Supabase
                console.log('User is logged in, loading cart from Supabase');
                await this.loadCartFromSupabase();
            } else {
                // If not logged in, first check sessionStorage (for current session only)
                console.log('User is not logged in, checking session storage first');
                const sessionCart = sessionStorage.getItem(this.sessionCartKey);
                
                if (sessionCart) {
                    // If session cart exists, use it
                    this.items = JSON.parse(sessionCart);
                    console.log('Cart loaded from session storage:', this.items);
                } else {
                    // If no session cart, fallback to localStorage (from previous sessions)
                    console.log('No session cart found, checking local storage');
                    this.loadCartFromLocalStorage();
                }
            }
        } catch (error) {
            console.error('Error loading cart:', error);
            // Fallback to local storage if there's an error
            this.loadCartFromLocalStorage();
        }
    }
    
    // Load cart from Supabase for logged-in users
    async loadCartFromSupabase() {
        try {
            console.log('Attempting to load cart from Supabase...');
            
            // Check if Supabase client is available
            if (!supabase) {
                console.error('Supabase client not available');
                this.loadCartFromLocalStorage(); // Fallback
                return;
            }
            
            // Get current user
            const { user, error } = await getCurrentUser();
            
            if (error || !user) {
                console.error('Error getting current user:', error);
                this.loadCartFromLocalStorage(); // Fallback
                return;
            }
            
            try {
                // Try to get cart from Supabase
                const { data, error: cartError } = await supabase
                    .from('carts')
                    .select('items')
                    .eq('user_id', user.id)
                    .single();
                    
                if (cartError) {
                    console.error('Error fetching cart from Supabase:', cartError);
                    // If the table doesn't exist, we'll use local storage with a special user key
                    this.loadUserSpecificCartFromLocalStorage(user.id);
                    return;
                }
                
                // If cart exists in Supabase, use that
                if (data && data.items) {
                    console.log('Cart loaded from Supabase:', data.items);
                    this.items = JSON.parse(data.items);
                } else {
                    // If no cart in Supabase, use user-specific local storage
                    this.loadUserSpecificCartFromLocalStorage(user.id);
                }
            } catch (dbError) {
                console.error('Database operation error:', dbError);
                this.loadUserSpecificCartFromLocalStorage(user.id);
            }
        } catch (error) {
            console.error('Error in loadCartFromSupabase:', error);
            this.loadCartFromLocalStorage(); // Fallback
        }
    }
    
    // Load cart from local storage with user-specific key
    loadUserSpecificCartFromLocalStorage(userId) {
        try {
            const userCartKey = `${this.cartKey}_${userId}`;
            console.log(`Loading user-specific cart from local storage with key: ${userCartKey}`);
            
            const cartData = localStorage.getItem(userCartKey);
            if (cartData) {
                this.items = JSON.parse(cartData);
                console.log('User-specific cart loaded from local storage:', this.items);
            } else {
                // Regular cart as fallback
                this.loadCartFromLocalStorage();
            }
        } catch (error) {
            console.error('Error loading user-specific cart from local storage:', error);
            this.loadCartFromLocalStorage(); // Default fallback
        }
    }
    
    // Load cart from local storage
    loadCartFromLocalStorage() {
        try {
            const cartData = localStorage.getItem(this.cartKey);
            if (cartData) {
                this.items = JSON.parse(cartData);
                console.log('Cart loaded from local storage:', this.items);
            } else {
                this.items = [];
                console.log('No cart found in local storage, starting with empty cart');
            }
        } catch (error) {
            console.error('Error loading cart from local storage:', error);
            this.items = [];
        }
    }
    
    // Save cart to storage
    async saveCart() {
        try {
            console.log('Saving cart...');
            
            // Check if user is logged in
            const isLoggedIn = await isUserLoggedIn();
            
            if (isLoggedIn) {
                // If logged in, save to Supabase and user-specific local storage
                await this.saveCartToSupabase();
            } else {
                // If not logged in, save to both local storage and session storage
                this.saveCartToLocalStorage();
                sessionStorage.setItem(this.sessionCartKey, JSON.stringify(this.items));
                console.log('Cart saved to session storage for non-logged in user');
            }
            
            // Update badge after saving
            this.updateBadge();
        } catch (error) {
            console.error('Error saving cart:', error);
            // Fallback to local storage
            this.saveCartToLocalStorage();
            this.updateBadge();
        }
    }
    
    // Save cart to Supabase
    async saveCartToSupabase() {
        try {
            console.log('Attempting to save cart to Supabase...');
            
            // Check if Supabase client is available
            if (!supabase) {
                console.error('Supabase client not available, cannot save cart to database');
                return;
            }
            
            // Get current user
            const { user, error } = await getCurrentUser();
            
            if (error) {
                console.error('Error getting current user:', error);
                return;
            }
            
            if (!user) {
                console.error('No user found, cannot save cart to database');
                return;
            }
            
            console.log('Saving cart for user:', user.id);
            console.log('Cart items to save:', this.items);
            
            // Save to user-specific local storage as a reliable fallback
            this.saveUserSpecificCartToLocalStorage(user.id);
            
            try {
                // Convert items to string for storage
                const cartItems = JSON.stringify(this.items);
                
                // Upsert cart data (insert if not exists, update if exists)
                const { data, error: upsertError } = await supabase
                    .from('carts')
                    .upsert(
                        { 
                            user_id: user.id, 
                            items: cartItems,
                            updated_at: new Date().toISOString()
                        },
                        { 
                            onConflict: 'user_id',
                            returning: 'minimal' // Don't need to return the row
                        }
                    );
                    
                if (upsertError) {
                    console.error('Error saving cart to Supabase:', upsertError);
                    // Check if it's a permissions error or table doesn't exist
                    if (upsertError.code === '42P01' || upsertError.message.includes('relation') || 
                        upsertError.code === '42501' || upsertError.message.includes('permission denied')) {
                        console.error('Table issue or permission denied. Falling back to local storage.');
                    }
                } else {
                    console.log('Cart saved to Supabase successfully');
                }
            } catch (dbError) {
                console.error('Database operation error:', dbError);
                // Local storage fallback already handled above
            }
        } catch (error) {
            console.error('Exception in saveCartToSupabase:', error);
        }
    }
    
    // Save cart to local storage with user-specific key
    saveUserSpecificCartToLocalStorage(userId) {
        try {
            const userCartKey = `${this.cartKey}_${userId}`;
            console.log(`Saving user-specific cart to local storage with key: ${userCartKey}`);
            
            localStorage.setItem(userCartKey, JSON.stringify(this.items));
            console.log('User-specific cart saved to local storage');
            
            // Also save to regular cart key as backup
            this.saveCartToLocalStorage();
        } catch (error) {
            console.error('Error saving user-specific cart to local storage:', error);
            this.saveCartToLocalStorage(); // Default fallback
        }
    }
    
    // Save cart to local storage
    saveCartToLocalStorage() {
        try {
            localStorage.setItem(this.cartKey, JSON.stringify(this.items));
            console.log('Cart saved to local storage successfully');
        } catch (error) {
            console.error('Error saving cart to local storage:', error);
        }
    }
    
    // Handle user login event
    async handleUserLogin() {
        try {
            console.log('User logged in, transferring session cart to user account');
            
            // Get current items from either session storage or local storage
            const sessionCart = sessionStorage.getItem(this.sessionCartKey);
            const localCart = localStorage.getItem(this.cartKey);
            
            // Use session cart if available, otherwise use local cart
            if (sessionCart) {
                this.items = JSON.parse(sessionCart);
            } else if (localCart) {
                this.items = JSON.parse(localCart);
            }
            
            // If we have items, save them to Supabase for the now logged-in user
            if (this.items.length > 0) {
                await this.saveCartToSupabase();
                console.log('Session cart migrated to user account');
            } else {
                // If no items in temporary storage, load cart from Supabase
                await this.loadCartFromSupabase();
            }
            
            // Clear session storage as we don't need it anymore
            sessionStorage.removeItem(this.sessionCartKey);
            
            // Update UI
            this.updateBadge();
            this.renderCartDropdown();
        } catch (error) {
            console.error('Error handling user login:', error);
        }
    }
    
    // Handle user logout event
    async handleUserLogout() {
        try {
            console.log('User logged out, saving current cart to session storage');
            
            // Save current cart to session storage
            sessionStorage.setItem(this.sessionCartKey, JSON.stringify(this.items));
            
            // Clear user-specific storage to prevent data leakage
            const { user } = await getCurrentUser();
            if (user) {
                localStorage.removeItem(`${this.cartKey}_${user.id}`);
            }
            
            // Keep the cart in memory so the UI doesn't change abruptly
            // It will be properly handled when the page is refreshed or closed
        } catch (error) {
            console.error('Error handling user logout:', error);
        }
    }
}

// Create and export a single instance of the cart
let cart;

// Initialize the cart when the DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCart);
} else {
    initCart();
}

function initCart() {
    console.log('Initializing cart from module');
    cart = new ShoppingCart();
    
    // Expose cart to window for testing
    window.cart = cart;
    
    // Set up auth event listeners for cart handling
    document.addEventListener('user-logged-in', () => {
        cart.handleUserLogin();
    });
    
    document.addEventListener('user-logged-out', () => {
        cart.handleUserLogout();
    });
}

export default cart; 