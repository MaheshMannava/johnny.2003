import cart from './cart.js';
import { isUserLoggedIn, getCurrentUser } from './supabase.js';

class CheckoutManager {
    constructor() {
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing checkout process...');
            
            // First ensure that cart object is initialized
            if (typeof cart.init === 'function' && (!cart.items || cart.items.length === 0)) {
                console.log('Cart not initialized or empty, initializing cart first');
                await cart.init();
            }
            
            // Make sure to load the latest cart data
            await cart.loadCart();
            console.log('Cart loaded with items:', cart.items);
            
            // Check if the cart is empty
            if (!cart.items || cart.items.length === 0) {
                console.log('Cart is empty, showing message');
                this.showEmptyCartMessage();
                return;
            }
            
            console.log(`Cart has ${cart.items.length} items, proceeding with checkout`);
            
            // Check if user is logged in
            const isLoggedIn = await isUserLoggedIn();
            if (!isLoggedIn) {
                console.log('User not logged in, showing auth modal');
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
        // Create a stylish empty cart message instead of redirecting
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = `
                <div class="empty-cart-message-container">
                    <h2>Your Shopping Bag is Empty</h2>
                    <p>You don't have any items in your bag yet.</p>
                    <button id="continue-shopping" class="continue-shopping-btn">Continue Shopping</button>
                </div>
            `;
            
            // Add some inline styles for the empty cart message
            const style = document.createElement('style');
            style.textContent = `
                .empty-cart-message-container {
                    text-align: center;
                    padding: 50px 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .empty-cart-message-container h2 {
                    font-size: 24px;
                    margin-bottom: 15px;
                }
                .empty-cart-message-container p {
                    color: #666;
                    margin-bottom: 30px;
                }
                .continue-shopping-btn {
                    background-color: black;
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .continue-shopping-btn:hover {
                    background-color: #333;
                }
            `;
            document.head.appendChild(style);
            
            // Add event listener for continue shopping button
            document.getElementById('continue-shopping')?.addEventListener('click', () => {
                window.location.href = 'nextpage.html';
            });
        }
    }
    
    showAuthModal() {
        // Create a stylish auth required message
        const checkoutContainer = document.querySelector('.checkout-container');
        if (checkoutContainer) {
            checkoutContainer.innerHTML = `
                <div class="auth-required-container">
                    <h2>Please Log In to Continue</h2>
                    <p>You need to be logged in to proceed with checkout.</p>
                    <div class="auth-buttons">
                        <button id="login-btn" class="auth-btn">Log In</button>
                        <button id="signup-btn" class="auth-btn secondary">Sign Up</button>
                    </div>
                    <button id="back-to-cart" class="back-btn">Back to Cart</button>
                </div>
            `;
            
            // Add some inline styles for the auth message
            const style = document.createElement('style');
            style.textContent = `
                .auth-required-container {
                    text-align: center;
                    padding: 50px 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .auth-required-container h2 {
                    font-size: 24px;
                    margin-bottom: 15px;
                }
                .auth-required-container p {
                    color: #666;
                    margin-bottom: 30px;
                }
                .auth-buttons {
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .auth-btn {
                    background-color: black;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                .auth-btn.secondary {
                    background-color: white;
                    color: black;
                    border: 1px solid black;
                }
                .auth-btn:hover {
                    background-color: #333;
                }
                .auth-btn.secondary:hover {
                    background-color: #f5f5f5;
                }
                .back-btn {
                    background: none;
                    border: none;
                    color: #666;
                    text-decoration: underline;
                    cursor: pointer;
                    margin-top: 15px;
                }
            `;
            document.head.appendChild(style);
            
            // Add event listeners for auth buttons
            document.getElementById('login-btn')?.addEventListener('click', () => {
                // Redirect to login page or show login modal
                window.location.href = '../index.html';
            });
            
            document.getElementById('signup-btn')?.addEventListener('click', () => {
                // Redirect to signup page or show signup modal
                window.location.href = '../index.html';
            });
            
            document.getElementById('back-to-cart')?.addEventListener('click', () => {
                // Go back to cart page or previous page
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
                    <button id="retry-btn" class="retry-btn">Try Again</button>
                    <button id="back-to-shopping" class="back-btn">Continue Shopping</button>
                </div>
            `;
            
            // Add some inline styles for the error message
            const style = document.createElement('style');
            style.textContent = `
                .error-message-container {
                    text-align: center;
                    padding: 50px 20px;
                    max-width: 600px;
                    margin: 0 auto;
                }
                .error-message-container h2 {
                    font-size: 24px;
                    margin-bottom: 15px;
                    color: #e74c3c;
                }
                .error-message-container p {
                    color: #666;
                    margin-bottom: 30px;
                }
                .retry-btn {
                    background-color: black;
                    color: white;
                    border: none;
                    padding: 12px 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin-right: 10px;
                }
                .retry-btn:hover {
                    background-color: #333;
                }
                .back-btn {
                    background: none;
                    border: none;
                    color: #666;
                    text-decoration: underline;
                    cursor: pointer;
                    margin-top: 15px;
                    display: block;
                    margin: 15px auto 0;
                }
            `;
            document.head.appendChild(style);
            
            // Add event listeners
            document.getElementById('retry-btn')?.addEventListener('click', () => {
                window.location.reload();
            });
            
            document.getElementById('back-to-shopping')?.addEventListener('click', () => {
                window.location.href = 'nextpage.html';
            });
        }
    }
    
    async loadUserInfo() {
        try {
            const { user } = await getCurrentUser();
            if (user && user.email) {
                const emailInput = document.getElementById('email');
                if (emailInput) {
                    emailInput.value = user.email;
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }
    
    setupEventListeners() {
        // Complete order button
        const completeOrderBtn = document.getElementById('complete-checkout');
        if (completeOrderBtn) {
            completeOrderBtn.addEventListener('click', () => this.handleCheckout());
        }
        
        // Express checkout buttons
        const expressButtons = document.querySelectorAll('.express-button');
        expressButtons.forEach(button => {
            button.addEventListener('click', () => {
                alert('Express checkout options are not available in this demo.');
            });
        });
        
        // Discount code
        const applyDiscountBtn = document.querySelector('.apply-btn');
        if (applyDiscountBtn) {
            applyDiscountBtn.addEventListener('click', () => this.handleDiscount());
        }
        
        // Add event delegation for any dynamically added elements
        document.addEventListener('click', (e) => {
            if (e.target.matches('.remove-item-btn')) {
                const itemId = e.target.dataset.itemId;
                if (itemId) {
                    this.removeItem(itemId);
                }
            }
        });
    }
    
    updateOrderSummary() {
        try {
            console.log('Updating order summary with cart items:', cart.items);
            const orderItems = document.querySelector('.order-items');
            const subtotalEl = document.querySelector('.summary-line:first-child span:last-child');
            const totalEl = document.querySelector('.big-price');
            
            if (!orderItems) {
                console.error('Order items container not found');
                return;
            }
            
            if (!cart.items || cart.items.length === 0) {
                console.log('Cart is empty, showing empty message');
                this.showEmptyCartMessage();
                return;
            }
            
            // Clear existing items
            orderItems.innerHTML = '';
            
            // Add each item to the summary
            cart.items.forEach(item => {
                const itemHtml = `
                    <div class="order-item" data-item-id="${item.id}">
                        <div class="item-image">
                            <img src="${item.image}" alt="${item.name}">
                            <div class="item-quantity">${item.quantity}</div>
                        </div>
                        <div class="item-details">
                            <div class="item-name">${item.name}</div>
                            <div class="item-variant">Size: ${item.size || 'One Size'}</div>
                            <button class="remove-item-btn" data-item-id="${item.id}">Remove</button>
                        </div>
                        <div class="item-price">₹${item.price * item.quantity}</div>
                    </div>
                `;
                orderItems.insertAdjacentHTML('beforeend', itemHtml);
            });
            
            // Update totals
            const subtotal = cart.getTotal();
            if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
            if (totalEl) totalEl.textContent = `₹${subtotal}`;
            
            // Add some inline styles for the remove button if not already added
            if (!document.querySelector('style[data-for="remove-btn"]')) {
                const style = document.createElement('style');
                style.setAttribute('data-for', 'remove-btn');
                style.textContent = `
                    .remove-item-btn {
                        background: none;
                        border: none;
                        color: #666;
                        text-decoration: underline;
                        cursor: pointer;
                        padding: 0;
                        font-size: 12px;
                        margin-top: 5px;
                    }
                    .remove-item-btn:hover {
                        color: #000;
                    }
                `;
                document.head.appendChild(style);
            }
        } catch (error) {
            console.error('Error updating order summary:', error);
        }
    }
    
    async removeItem(itemId) {
        try {
            // Find the item index
            const itemIndex = cart.items.findIndex(item => item.id === itemId);
            if (itemIndex !== -1) {
                // Remove the item
                cart.items.splice(itemIndex, 1);
                
                // Save cart
                await cart.saveCart();
                
                // Update UI
                this.updateOrderSummary();
                
                // If cart is now empty, show empty cart message
                if (cart.items.length === 0) {
                    this.showEmptyCartMessage();
                }
            }
        } catch (error) {
            console.error('Error removing item:', error);
        }
    }
    
    handleDiscount() {
        const discountInput = document.getElementById('discount-code');
        if (discountInput && discountInput.value.trim()) {
            alert('Discount codes are not available in this demo.');
            discountInput.value = '';
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
            
            // In a real application, we would:
            // 1. Validate the credit card details
            // 2. Process the payment
            // 3. Create an order in the database
            // 4. Send confirmation email
            
            // For demo purposes, just show success and clear cart
            const checkoutContainer = document.querySelector('.checkout-container');
            if (checkoutContainer) {
                checkoutContainer.innerHTML = `
                    <div class="success-message-container">
                        <h2>Thank You for Your Order!</h2>
                        <p>Your order has been placed successfully. You will receive an email confirmation shortly.</p>
                        <p class="order-number">Order #: JW${Date.now().toString().substring(5)}</p>
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

// Initialize checkout manager when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CheckoutManager();
}); 