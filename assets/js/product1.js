// Import the isUserLoggedIn function and cart
import { isUserLoggedIn } from './supabase.js';
import cart from './cart.js';

const carouselImages = document.querySelector('.carousel-images');
const prevButton = document.getElementById('prev');
const nextButton = document.getElementById('next');
let currentIndex = 0;

// Variables for touch events
let startX = 0;
let endX = 0;

// Button click events
prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
    }
});

nextButton.addEventListener('click', () => {
    if (currentIndex < carouselImages.children.length - 1) {
        currentIndex++;
        updateCarousel();
    }
});

// Touch event listeners for swipe
carouselImages.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
});

carouselImages.addEventListener('touchmove', (e) => {
    endX = e.touches[0].clientX;
});

carouselImages.addEventListener('touchend', () => {
    const swipeThreshold = 50; // Minimum swipe distance
    if (startX - endX > swipeThreshold && currentIndex < carouselImages.children.length - 1) {
        currentIndex++;
    } else if (endX - startX > swipeThreshold && currentIndex > 0) {
        currentIndex--;
    }
    updateCarousel();
});

// Function to update carousel position
function updateCarousel() {
    const width = carouselImages.children[0].clientWidth;
    carouselImages.style.transform = `translateX(-${currentIndex * width}px)`;
}

// Update carousel position on window resize
window.addEventListener('resize', updateCarousel);

// Size selection functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize size selection
    initSizeSelection();
    
    // Initialize add to cart button
    initAddToCartButton();
});

// Global variable to store selected size
let selectedSize = null;

function initSizeSelection() {
    const sizeOptions = document.querySelectorAll('.size-option');
    
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
            const addToCartBtn = document.querySelector('.add-to-cart');
            if (addToCartBtn) {
                addToCartBtn.classList.add('enabled');
                addToCartBtn.disabled = false;
            }
        });
    });
}

function initAddToCartButton() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    
    addToCartButtons.forEach(button => {
        // Disable button initially if no size is selected
        button.disabled = true;
        
        button.addEventListener('click', async function(event) {
            event.preventDefault();
            
            // Check if size is selected
            if (!selectedSize) {
                alert('Please select a size before adding to bag');
                return;
            }
            
            try {
                // Get product details
                const productContainer = this.closest('.product-container');
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
                    const successMessage = document.createElement('div');
                    successMessage.className = 'add-success-message';
                    successMessage.textContent = `${productName} (Size: ${selectedSize}) added to bag!`;
                    successMessage.style.position = 'fixed';
                    successMessage.style.bottom = '20px';
                    successMessage.style.right = '20px';
                    successMessage.style.backgroundColor = 'black';
                    successMessage.style.color = 'white';
                    successMessage.style.padding = '10px 15px';
                    successMessage.style.borderRadius = '4px';
                    successMessage.style.zIndex = '1000';
                    document.body.appendChild(successMessage);
                    
                    // Remove success message after 3 seconds
                    setTimeout(() => {
                        document.body.removeChild(successMessage);
                    }, 3000);
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Error adding item to cart:', error);
                alert('There was an error adding this item to your bag. Please try again.');
            }
        });
    });
}
