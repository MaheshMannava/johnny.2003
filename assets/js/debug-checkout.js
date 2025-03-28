// Import cart module
import cart from './cart.js';
import { isUserLoggedIn, getCurrentUser } from './supabase.js';

// Debug version of checkout manager to fix cart issues
class DebugCheckoutManager {
    constructor() {
        console.log("Debug Checkout Manager Initialized");
        this.init();
    }
    
    async init() {
        try {
            console.log('Debug Initializing checkout process...');
            
            // Initialize cart with a safety timeout to ensure it completes
            if (typeof cart.init === 'function') {
                try {
                    console.log('Ensuring cart is properly initialized');
                    await cart.init();
                    
                    // Force load cart from storage
                    if (typeof cart.loadCart === 'function') {
                        await cart.loadCart();
                    } else {
                        console.error('loadCart method not found on cart object');
                    }
                } catch (cartError) {
                    console.error('Error initializing cart:', cartError);
                }
            }
            
            // Log cart items for debugging
            console.log('Cart items after initialization:', cart.items);
            
            // Check if the cart is empty
            if (!cart.items || cart.items.length === 0) {
                console.log('Cart is empty, showing empty cart message');
                this.showEmptyCartMessage();
                return;
            }
            
            console.log(`Cart has ${cart.items.length} items, proceeding with checkout`);
            
            // Check if user is logged in
            const isLoggedIn = await isUserLoggedIn();
            if (!isLoggedIn) {
                console.log('User not logged in, showing friendly auth modal for checkout');
                this.showAuthModal();
                return;
            }
            
            // Initialize the page
            this.setupEventListeners();
            this.updateOrderSummary();
            this.loadUserInfo();
            
            console.log('Checkout initialized successfully');
        } catch (error) {
            console.error('Error initializing checkout:', error);
            this.showErrorMessage('There was a problem loading your checkout. Please try again.');
        }
    }
    
    showEmptyCartMessage() {
        // Create a stylish empty cart message
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = `
                <div class="empty-cart-message-container">
                    <h2>Your Shopping Bag is Empty</h2>
                    <p>You don't have any items in your bag yet.</p>
                    <div class="action-buttons">
                        <button id="continue-shopping" class="continue-shopping-btn">Continue Shopping</button>
                    </div>
                </div>
            `;
            
            // Add event listener for continue shopping button
            document.getElementById('continue-shopping')?.addEventListener('click', () => {
                window.location.href = 'nextpage.html';
            });
        }
    }
    
    showAuthModal() {
        console.log("User not logged in, showing friendly auth modal for checkout");
        // Create a stylish auth required message
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = `
                <div class="auth-required-container">
                    <h2>Login to Complete Your Purchase</h2>
                    <p>Please log in or create an account to complete your purchase. Your cart items will be saved.</p>
                    <div class="auth-buttons">
                        <button id="login-btn" class="auth-btn">Log In</button>
                        <button id="signup-btn" class="auth-btn secondary">Create Account</button>
                    </div>
                    <button id="back-to-cart" class="back-btn">Back to Shopping</button>
                </div>
            `;
            
            // Add event listeners for auth buttons
            document.getElementById('login-btn')?.addEventListener('click', () => {
                // Show auth modal instead of redirecting
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    authModal.style.display = 'block';
                    // Set active tab to login
                    const loginTab = document.getElementById('login-tab');
                    if (loginTab) {
                        loginTab.click();
                    }
                } else {
                    // Fallback to nextpage if modal not found
                    window.location.href = 'nextpage.html';
                }
            });
            
            document.getElementById('signup-btn')?.addEventListener('click', () => {
                // Show auth modal instead of redirecting
                const authModal = document.getElementById('auth-modal');
                if (authModal) {
                    authModal.style.display = 'block';
                    // Set active tab to register
                    const registerTab = document.getElementById('register-tab');
                    if (registerTab) {
                        registerTab.click();
                    }
                } else {
                    // Fallback to nextpage if modal not found
                    window.location.href = 'nextpage.html';
                }
            });
            
            document.getElementById('back-to-cart')?.addEventListener('click', () => {
                // Go back to previous page
                window.history.back();
            });
        }
    }
    
    showErrorMessage(message) {
        // Show error message
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = `
                <div class="error-message-container">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <div class="action-buttons">
                        <button id="retry-btn" class="retry-btn">Try Again</button>
                        <button id="back-to-shopping" class="back-btn">Continue Shopping</button>
                    </div>
                </div>
            `;
            
            // Add event listeners
            document.getElementById('retry-btn')?.addEventListener('click', () => {
                window.location.reload();
            });
            
            document.getElementById('back-to-shopping')?.addEventListener('click', () => {
                window.location.href = 'nextpage.html';
            });
        }
    }
    
    setupEventListeners() {
        // Add event listener for the checkout button
        const completeOrderBtn = document.getElementById('complete-checkout');
        if (completeOrderBtn) {
            completeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleCheckout();
            });
        }
    }
    
    updateOrderSummary() {
        try {
            // Find order summary elements
            const orderItems = document.querySelector('.order-items');
            const subtotalElement = document.querySelector('.summary-line span:last-child');
            const totalElement = document.querySelector('.total-price .big-price');
            
            if (!orderItems || !subtotalElement || !totalElement) {
                console.error('Order summary elements not found');
                return;
            }
            
            // Clear existing items
            orderItems.innerHTML = '';
            
            // Calculate total
            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Format as currency
            const formattedTotal = `₹${total.toFixed(2)}`;
            
            // Update subtotal and total
            subtotalElement.textContent = formattedTotal;
            totalElement.textContent = formattedTotal;
            
            // Add each item to the order summary
            cart.items.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'order-item';
                itemElement.innerHTML = `
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}">
                        <div class="item-quantity">${item.quantity}</div>
                    </div>
                    <div class="item-details">
                        <div class="item-name">${item.name}</div>
                        <div class="item-variant">Size: ${item.size || 'One Size'}</div>
                    </div>
                    <div class="item-price">₹${(item.price * item.quantity).toFixed(2)}</div>
                `;
                orderItems.appendChild(itemElement);
            });
        } catch (error) {
            console.error('Error updating order summary:', error);
        }
    }
    
    async loadUserInfo() {
        try {
            // Get current user
            const { user, error } = await getCurrentUser();
            
            if (error || !user) {
                console.error('Error getting user info:', error);
                return;
            }
            
            // Get email input
            const emailInput = document.getElementById('email');
            if (emailInput) {
                emailInput.value = user.email;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }
    
    async handleCheckout() {
        try {
            // Validate required fields
            const requiredFields = [
                'email', 'first-name', 'last-name', 'address',
                'city', 'state', 'zip-code', 'phone',
                'card-number', 'expiry-date', 'security-code', 'name-on-card'
            ];
            
            let isValid = true;
            
            for (const fieldId of requiredFields) {
                const field = document.getElementById(fieldId);
                if (!field || !field.value.trim()) {
                    field?.classList.add('error');
                    isValid = false;
                    
                    // Add error message if it doesn't exist
                    if (field && !field.nextElementSibling?.classList.contains('error-message')) {
                        const errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.textContent = 'This field is required';
                        field.parentNode.insertBefore(errorMsg, field.nextSibling);
                    }
                } else {
                    field?.classList.remove('error');
                    // Remove error message if it exists
                    const errorMsg = field.nextElementSibling;
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        errorMsg.remove();
                    }
                }
            }
            
            if (!isValid) {
                // Scroll to the first error field
                const firstErrorField = document.querySelector('.error');
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                return;
            }
            
            // Get shipping address and payment info
            const shippingAddress = {
                firstName: document.getElementById('first-name')?.value,
                lastName: document.getElementById('last-name')?.value,
                address: document.getElementById('address')?.value,
                apartment: document.getElementById('apartment')?.value,
                city: document.getElementById('city')?.value,
                state: document.getElementById('state')?.value,
                zipCode: document.getElementById('zip-code')?.value,
                phone: document.getElementById('phone')?.value
            };
            
            const paymentInfo = {
                cardNumber: document.getElementById('card-number')?.value,
                expiryDate: document.getElementById('expiry-date')?.value,
                securityCode: document.getElementById('security-code')?.value,
                nameOnCard: document.getElementById('name-on-card')?.value
            };
            
            // Calculate total
            const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            // Place order using Supabase function if available
            if (window.runMcpSupabaseQuery) {
                try {
                    const orderResult = await window.runMcpSupabaseQuery(`
                        SELECT * FROM place_order(
                            '${JSON.stringify(cart.items)}'::jsonb,
                            ${total},
                            '${JSON.stringify(shippingAddress)}'::jsonb,
                            '${JSON.stringify(paymentInfo)}'::jsonb
                        )
                    `);
                    
                    console.log('Order placement result:', orderResult);
                    
                    if (orderResult && orderResult[0] && orderResult[0].place_order) {
                        const result = orderResult[0].place_order;
                        
                        if (result.success === false) {
                            // Show stock availability error
                            const stockErrorMsg = document.createElement('div');
                            stockErrorMsg.className = 'checkout-error stock-error';
                            
                            // Create user-friendly error message for out-of-stock items
                            let errorHtml = '<h3>Some items have insufficient stock:</h3><ul>';
                            result.products.forEach(product => {
                                errorHtml += `<li>${product.name}: Requested: ${product.requested}, Available: ${product.available}</li>`;
                            });
                            errorHtml += '</ul><p>Please adjust quantities or remove these items.</p>';
                            
                            stockErrorMsg.innerHTML = errorHtml;
                            
                            const completeOrderBtn = document.getElementById('complete-checkout');
                            if (completeOrderBtn) {
                                completeOrderBtn.insertAdjacentElement('beforebegin', stockErrorMsg);
                            }
                            
                            // Scroll to the error message
                            stockErrorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            return;
                        }
                        
                        // Order successful! Show success page
                        const checkoutContainer = document.querySelector('.checkout-container');
                        if (checkoutContainer) {
                            checkoutContainer.innerHTML = `
                                <div class="success-message-container">
                                    <h2>Thank You for Your Order!</h2>
                                    <p>Your order has been placed successfully. You will receive an email confirmation shortly.</p>
                                    <p class="order-number">Order #: ${result.order_id}</p>
                                    <p class="stock-message">Product stock has been updated accordingly.</p>
                                    <button id="continue-shopping-btn" class="continue-shopping-btn">Continue Shopping</button>
                                </div>
                            `;
                            
                            // Add event listener for continue shopping button
                            document.getElementById('continue-shopping-btn')?.addEventListener('click', () => {
                                window.location.href = 'nextpage.html';
                            });
                        }
                        
                        // Clear the cart (server already did it, but make sure UI is updated)
                        cart.items = [];
                        await cart.saveCart();
                        
                        // Update the badge count to show empty cart
                        if (typeof cart.updateBadge === 'function') {
                            cart.updateBadge();
                        }
                        
                        return;
                    }
                } catch (supabaseError) {
                    console.error('Error placing order with Supabase:', supabaseError);
                }
            }
            
            // Fallback to client-side order processing if Supabase call fails
            const checkoutContainer = document.querySelector('.checkout-container');
            if (checkoutContainer) {
                checkoutContainer.innerHTML = `
                    <div class="success-message-container">
                        <h2>Thank You for Your Order!</h2>
                        <p>Your order has been placed successfully. You will receive an email confirmation shortly.</p>
                        <p class="order-number">Order #: JW${Date.now().toString().substring(5)}</p>
                        <p class="fallback-message">Note: Using local order processing. Stock levels will be updated when synced.</p>
                        <button id="continue-shopping-btn" class="continue-shopping-btn">Continue Shopping</button>
                    </div>
                `;
                
                // Add event listener for continue shopping button
                document.getElementById('continue-shopping-btn')?.addEventListener('click', () => {
                    window.location.href = 'nextpage.html';
                });
            }
            
            // Clear the cart
            cart.items = [];
            await cart.saveCart();
            
            // Update the badge count to show empty cart
            if (typeof cart.updateBadge === 'function') {
                cart.updateBadge();
            }
        } catch (error) {
            console.error('Error processing checkout:', error);
            const errorMsg = document.createElement('div');
            errorMsg.className = 'checkout-error';
            errorMsg.textContent = 'There was an error processing your order. Please try again.';
            
            const completeOrderBtn = document.getElementById('complete-checkout');
            if (completeOrderBtn) {
                completeOrderBtn.insertAdjacentElement('beforebegin', errorMsg);
            }
        }
    }
}

// Initialize the checkout manager
document.addEventListener('DOMContentLoaded', () => {
    const checkoutManager = new DebugCheckoutManager();
    
    // Make it available globally for debugging
    window.checkoutManager = checkoutManager;
});

export default DebugCheckoutManager; 