import { isUserLoggedIn, getCurrentUser, signOutUser } from './supabase.js';
import cart from './cart.js';

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Nextpage script loaded');
    
    // Get DOM elements
    const userProfile = document.getElementById('user-profile');
    const userInitials = document.getElementById('user-initials');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout');
    const myAccountBtn = document.getElementById('my-account');
    const myOrdersBtn = document.getElementById('my-orders');
    
    // Check authentication status
    const checkAuth = async () => {
        try {
            const isLoggedIn = await isUserLoggedIn();
            console.log('User logged in?', isLoggedIn);
            
            if (isLoggedIn) {
                // User is logged in
                const { user } = await getCurrentUser();
                
                // Show user profile
                if (userProfile) {
                    userProfile.style.display = 'flex';
                }
                
                // Set user initials
                if (user && user.email && userInitials) {
                    userInitials.textContent = user.email.substring(0, 2).toUpperCase();
                }
            } else {
                // User is not logged in, show login/signup buttons
                console.log('User not logged in');
            }
        } catch (error) {
            console.error('Error checking auth state:', error);
        }
    };
    
    // Initial auth check
    await checkAuth();
    
    // Handle profile click to show dropdown
    if (userProfile) {
        userProfile.addEventListener('click', () => {
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('active');
            }
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await signOutUser();
                localStorage.removeItem('auth_session');
                localStorage.removeItem('auth_state');
                window.location.href = '../index.html';
            } catch (error) {
                console.error('Error during logout:', error);
            }
        });
    }
    
    // My Account button
    if (myAccountBtn) {
        myAccountBtn.addEventListener('click', () => {
            alert('Account settings will be available soon!');
            dropdownMenu.classList.remove('active');
        });
    }
    
    // My Orders button
    if (myOrdersBtn) {
        myOrdersBtn.addEventListener('click', () => {
            alert('Order history will be available soon!');
            dropdownMenu.classList.remove('active');
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userProfile && dropdownMenu && 
            !userProfile.contains(e.target) && 
            !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('active');
        }
    });
    
    // Note: We are no longer setting up bag icon click event handlers here
    // The cart module (imported at the top) will handle all cart-related functionality
    // including the bag icon click event and the dropdown toggling
    
    // Connect checkout button to checkout page if not handled by cart.js
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn && !checkoutBtn.hasEventListener) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'checkout.html';
        });
        checkoutBtn.hasEventListener = true;
    }
}); 