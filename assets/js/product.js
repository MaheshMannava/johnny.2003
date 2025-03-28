// Import the cart module and authentication functions
import cart from './cart.js';
import { isUserLoggedIn } from './supabase.js';

// ProductManager class for managing product interactions
class ProductManager {
    constructor() {
        // Initialize the product manager
        this.init();
    }
    
    // Initialize the product manager
    init() {
        try {
            console.log('Initializing product manager...');
            
            // Add "Add to Bag" buttons to products on category pages
            this.addAddToBagButtons();
            
            // Set up the add to cart functionality on product detail pages
            this.setupProductPageAddToCart();
            
            // Set up product notifications
            this.setupNotifications();
            
            console.log('Product manager initialized successfully');
        } catch (error) {
            console.error('Error initializing product manager:', error);
        }
    }
    
    // Add "Add to Bag" buttons to product items on category pages
    addAddToBagButtons() {
        try {
            console.log('Adding "Add to Bag" buttons to products');
            
            // Get all product boxes
            const productBoxes = document.querySelectorAll('.product-box');
            
            // If no product boxes found, we're not on a category page
            if (productBoxes.length === 0) {
                console.log('No product boxes found, skipping category page setup');
                return;
            }
            
            // Process each product box
            productBoxes.forEach(box => {
                // Get product info
                const productItem = box.closest('.product-item');
                const productNameElement = productItem.querySelector('.product-name');
                const productPriceElement = productItem.querySelector('.product-price');
                const productImageElement = box.querySelector('img');
                
                if (!productNameElement || !productPriceElement || !productImageElement) {
                    console.error('Required product elements not found');
                    return;
                }
                
                // Parse product price (remove ₹ symbol and convert to number)
                const priceText = productPriceElement.textContent.trim();
                const price = parseFloat(priceText.replace('₹', '').replace(',', ''));
                
                if (isNaN(price)) {
                    console.error('Invalid price format:', priceText);
                    return;
                }
                
                // Create a unique product ID based on the product URL or name
                const productLink = box.getAttribute('href');
                const productId = productLink ? 
                    productLink.replace('.html', '') : 
                    productNameElement.textContent.trim().toLowerCase().replace(/\s+/g, '-');
                
                // Create the "Add to Bag" button
                const addBtn = document.createElement('button');
                addBtn.className = 'add-to-bag-btn';
                addBtn.textContent = 'Add to Bag';
                
                // Add click handler
                addBtn.addEventListener('click', async (e) => {
                    e.preventDefault(); // Prevent navigating to the product page
                    e.stopPropagation(); // Prevent event bubbling
                    
                // Add to cart - allow any user (logged in or not) to add items to cart
                    try {
                        const result = await cart.addItem(product);
                        
                        if (result.success) {
                            // Show success notification
                            this.showNotification(`${product.name} (Size: M) added to bag!`);
                        } else {
                            // Show error notification
                            this.showNotification(result.message || 'Error adding item to bag', true);
                        }
                    } catch (error) {
                        console.error('Error adding item to cart:', error);
                        this.showNotification('Error adding item to bag. Please try again.', true);
                    }
                });
                
                // Add the button to the product box
                box.appendChild(addBtn);
            });
            
            console.log('Successfully added "Add to Bag" buttons to products');
        } catch (error) {
            console.error('Error adding "Add to Bag" buttons:', error);
        }
    }
    
    // Setup add to cart functionality on product detail pages
    setupProductPageAddToCart() {
        try {
            // Check if we're on a product detail page
            const addToCartBtn = document.getElementById('add-to-cart');
            const sizeOptions = document.querySelectorAll('.size-option');
            
            if (!addToCartBtn || sizeOptions.length === 0) {
                console.log('Not on a product detail page or elements missing, skipping product page setup');
                return;
            }
            
            console.log('Setting up product page add to cart functionality');
            
            // Global variable to store selected size
            let selectedSize = null;
            
            // Initialize size selection
            sizeOptions.forEach(option => {
                option.addEventListener('click', function() {
                    // Remove selected class from all options
                    sizeOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selected class to clicked option
                    this.classList.add('selected');
                    
                    // Store selected size
                    selectedSize = this.getAttribute('data-size');
                    console.log('Selected size:', selectedSize);
                    
                    // Enable the add to cart button
                    if (addToCartBtn) {
                        addToCartBtn.classList.add('enabled');
                        addToCartBtn.disabled = false;
                    }
                });
            });
            
            // Disable button initially if no size is selected
            addToCartBtn.disabled = true;
            
            // Add to cart button click handler
            addToCartBtn.addEventListener('click', async (event) => {
                event.preventDefault();
                
                // Check if size is selected
                if (!selectedSize) {
                    alert('Please select a size before adding to bag');
                    return;
                }
                
                try {
                    // Get product details
                    const productContainer = addToCartBtn.closest('.product-container');
                    const productName = productContainer.querySelector('.product-name').textContent;
                    const priceText = productContainer.querySelector('.product-description').textContent;
                    const price = parseInt(priceText.match(/₹(\d+)/)[1]); // Extract numeric price
                    const productImage = productContainer.querySelector('.carousel-images img').getAttribute('src');
                    
                    // Create a product object with all details
                    const product = {
                        id: `${productName.toLowerCase().replace(/\s+/g, '-')}-${selectedSize}`, // Create a URL-friendly ID
                        name: productName,
                        price: price,
                        image: productImage,
                        size: selectedSize,
                        quantity: 1
                    };
                    
                // Add to cart - allow any user (logged in or not) to add items to cart
                    const result = await cart.addItem(product);
                    
                    if (result.success) {
                        // Show success message
                        this.showNotification(`${productName} (Size: ${selectedSize}) added to bag!`);
                    } else {
                        this.showNotification(result.message || 'Error adding item to bag', true);
                    }
                } catch (error) {
                    console.error('Error adding item to cart:', error);
                    this.showNotification('Error adding item to bag. Please try again.', true);
                }
            });
            
            console.log('Product page add to cart setup complete');
        } catch (error) {
            console.error('Error setting up product page add to cart:', error);
        }
    }
    
    // Set up product notifications
    setupNotifications() {
        // Create notification container if it doesn't exist
        let notificationElement = document.getElementById('product-notification');
        
        if (!notificationElement) {
            notificationElement = document.createElement('div');
            notificationElement.id = 'product-notification';
            notificationElement.className = 'product-notification';
            notificationElement.style.position = 'fixed';
            notificationElement.style.bottom = '20px';
            notificationElement.style.right = '20px';
            notificationElement.style.backgroundColor = '#2ecc71';
            notificationElement.style.color = 'white';
            notificationElement.style.padding = '12px 20px';
            notificationElement.style.borderRadius = '4px';
            notificationElement.style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
            notificationElement.style.zIndex = '1000';
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateY(20px)';
            notificationElement.style.transition = 'opacity 0.3s, transform 0.3s';
            document.body.appendChild(notificationElement);
        }
    }
    
    // Show a notification
    showNotification(message, isError = false) {
        let notificationElement = document.getElementById('product-notification');
        
        if (!notificationElement) {
            this.setupNotifications();
            notificationElement = document.getElementById('product-notification');
        }
        
        // Set message
        notificationElement.textContent = message;
        
        // Set color based on type
        if (isError) {
            notificationElement.style.backgroundColor = '#e74c3c'; // Red for error
        } else {
            notificationElement.style.backgroundColor = '#2ecc71'; // Green for success
        }
        
        // Show the notification
        notificationElement.style.opacity = '1';
        notificationElement.style.transform = 'translateY(0)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notificationElement.style.opacity = '0';
            notificationElement.style.transform = 'translateY(20px)';
        }, 3000);
    }
}

// Create and initialize product manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const productManager = new ProductManager();
    window.productManager = productManager; // Make available globally for debugging
});

export default ProductManager; 
