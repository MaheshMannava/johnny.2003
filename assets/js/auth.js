import { supabase, isUserLoggedIn, signInUser, signUpUser, signOutUser, getCurrentUser, resetPassword, testSupabaseConnection } from './supabase.js';

// Debug information only - won't block registration
testSupabaseConnection().then(result => {
    console.log('Initial Supabase connection test (informational only):', result);
});

// Custom events for authentication state changes
const USER_LOGGED_IN_EVENT = 'user-logged-in';
const USER_LOGGED_OUT_EVENT = 'user-logged-out';

// Helper function to dispatch authentication events
function dispatchAuthEvent(eventName, data = {}) {
    console.log(`Dispatching auth event: ${eventName}`, data);
    const event = new CustomEvent(eventName, { 
        detail: data,
        bubbles: true, 
        cancelable: true 
    });
    document.dispatchEvent(event);
}

// Helper functions outside the main function to ensure they're always available
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        console.log(`Modal ${modalId} activated`);
    } else {
        console.error(`Modal ${modalId} not found`);
    }
}

function showLoginFormDirect() {
    console.log('Direct login form trigger');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const authMessage = document.getElementById('auth-message');
    
    if (!loginTab || !registerTab || !loginForm || !registerForm) {
        console.error('Required form elements not found');
        return;
    }
    
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (authMessage) authMessage.textContent = '';
    
    // Make sure the modal is visible
    showModal('auth-modal');
}

function showRegisterFormDirect() {
    console.log('Direct register form trigger');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const authMessage = document.getElementById('auth-message');
    
    if (!loginTab || !registerTab || !loginForm || !registerForm) {
        console.error('Required form elements not found');
        return;
    }
    
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
    if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
    if (authMessage) authMessage.textContent = '';
    
    // Make sure the modal is visible
    showModal('auth-modal');
}

// Add direct click handlers as soon as the script loads
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Auth script loaded');

    // Debug only - won't block UI
    testSupabaseConnection().then(result => {
        console.log('Supabase connection status:', result);
    });

    // Get all UI elements
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userProfileBtn = document.getElementById('user-profile');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout');
    const authModal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('close-btn');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const forgotPasswordBtn = document.getElementById('forgot-password');
    const forgotPasswordForm = document.getElementById('forgot-password-form');
    const authMessage = document.getElementById('auth-message');
    const myAccountBtn = document.getElementById('my-account');
    const myOrdersBtn = document.getElementById('my-orders');
    
    console.log("Auth elements:", { 
        loginBtn, registerBtn, authModal, loginForm, registerForm 
    });

    // Setup direct click handlers for login/register buttons
    if (loginBtn) {
        console.log('Adding direct click handler to login button');
        loginBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Login button clicked directly');
            showLoginFormDirect();
        };
    } else {
        console.error('Login button not found');
    }
    
    if (registerBtn) {
        console.log('Adding direct click handler to register button');
        registerBtn.onclick = function(e) {
            e.preventDefault();
            console.log('Register button clicked directly');
            showRegisterFormDirect();
        };
    } else {
        console.error('Register button not found');
    }

    // Check if user is logged in
    const updateAuthState = async () => {
        console.log('Checking auth state...');
        try {
            const isLoggedIn = await isUserLoggedIn();
            console.log('Is user logged in?', isLoggedIn);
            
            // Get all auth-related elements
            const loginBtn = document.getElementById('login-btn');
            const registerBtn = document.getElementById('register-btn');
            const userProfileBtn = document.getElementById('user-profile');
            const userInitials = document.getElementById('user-initials');
            const authModal = document.getElementById('auth-modal');
            const authRequiredMessage = document.getElementById('auth-required-message');
            const authButtons = document.querySelector('.auth-buttons');
            const loginRegisterContainer = document.querySelector('.login-register-container');
            
            if (isLoggedIn) {
                // User is logged in
                const { user } = await getCurrentUser();
                console.log('Current user:', user);
                
                // Hide login/register buttons and auth modal
                if (loginRegisterContainer) {
                    loginRegisterContainer.style.display = 'none';
                }
                
                if (loginBtn) {
                    loginBtn.style.display = 'none';
                    loginBtn.setAttribute('aria-hidden', 'true');
                }
                if (registerBtn) {
                    registerBtn.style.display = 'none';
                    registerBtn.setAttribute('aria-hidden', 'true');
                }
                if (authButtons) {
                    // Keep the container but hide the buttons
                    const buttons = authButtons.querySelectorAll('.auth-btn');
                    buttons.forEach(btn => {
                        btn.style.display = 'none';
                        btn.setAttribute('aria-hidden', 'true');
                    });
                }
                if (authModal) {
                    authModal.style.display = 'none';
                    authModal.classList.remove('active');
                }
                if (authRequiredMessage) {
                    authRequiredMessage.style.display = 'none';
                }
                
                // Show user profile if it exists
                if (userProfileBtn) {
                    userProfileBtn.style.display = 'flex';
                    // Set user initials if available
                    if (user && user.email && userInitials) {
                        userInitials.textContent = user.email.substring(0, 2).toUpperCase();
                    }
                }
                
                // Store session
                localStorage.setItem('auth_session', 'true');
                localStorage.setItem('auth_state', 'logged_in');
                
            } else {
                // User is not logged in
                if (loginRegisterContainer) {
                    loginRegisterContainer.style.display = 'flex';
                }
                
                if (loginBtn) {
                    loginBtn.style.display = 'block';
                    loginBtn.removeAttribute('aria-hidden');
                }
                if (registerBtn) {
                    registerBtn.style.display = 'block';
                    registerBtn.removeAttribute('aria-hidden');
                }
                if (authButtons) {
                    // Show all auth buttons
                    const buttons = authButtons.querySelectorAll('.auth-btn');
                    buttons.forEach(btn => {
                        btn.style.display = 'block';
                        btn.removeAttribute('aria-hidden');
                    });
                }
                if (userProfileBtn) {
                    userProfileBtn.style.display = 'none';
                }
                
                // Clear session
                localStorage.removeItem('auth_session');
                localStorage.removeItem('auth_state');
            }
        } catch (err) {
            console.error('Error checking auth state:', err);
            // Default to logged out state on error
            const loginRegisterContainer = document.querySelector('.login-register-container');
            if (loginRegisterContainer) {
                loginRegisterContainer.style.display = 'flex';
            }
            
            if (loginBtn) {
                loginBtn.style.display = 'block';
                loginBtn.removeAttribute('aria-hidden');
            }
            if (registerBtn) {
                registerBtn.style.display = 'block';
                registerBtn.removeAttribute('aria-hidden');
            }
            if (userProfileBtn) {
                userProfileBtn.style.display = 'none';
            }
            localStorage.removeItem('auth_session');
            localStorage.removeItem('auth_state');
        }
    };
    
    // Call updateAuthState immediately when the script loads
    await updateAuthState();

    // Add event listener for storage changes to handle auth state across tabs/pages
    window.addEventListener('storage', (e) => {
        if (e.key === 'auth_state' || e.key === 'auth_session') {
            updateAuthState();
        }
    });

    // Run updateAuthState when the page becomes visible
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            updateAuthState();
        }
    });

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Modal closed');
            authModal.classList.remove('active');
            clearForms();
            clearMessages();
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
            clearForms();
            clearMessages();
        }
    });

    // Switch between login and register forms
    if (loginTab) {
        loginTab.addEventListener('click', showLoginForm);
    }

    if (registerTab) {
        registerTab.addEventListener('click', showRegisterForm);
    }

    // Show login form
    function showLoginForm() {
        console.log('Showing login form');
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        clearMessages();
    }

    // Show register form
    function showRegisterForm() {
        console.log('Showing register form');
        loginTab.classList.remove('active');
        registerTab.classList.add('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'flex';
        if (forgotPasswordForm) forgotPasswordForm.style.display = 'none';
        clearMessages();
    }

    // Show forgot password form
    if (forgotPasswordBtn) {
        forgotPasswordBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Showing forgot password form');
            loginForm.style.display = 'none';
            registerForm.style.display = 'none';
            forgotPasswordForm.style.display = 'flex';
            clearMessages();
        });
    }

    // Handle register form submission
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Register form submitted');
            
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            try {
                clearMessages();
                
                // Check if passwords match
                if (password !== confirmPassword) {
                    showMessage('Passwords do not match!', true);
                    return;
                }
                
                // Disable the button and show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating account...';
                
                console.log('Attempting to sign up with email:', email);
                const { data, error } = await signUpUser(email, password);
                
                if (error) {
                    console.error('Registration error:', error);
                    showMessage(`Registration failed: ${error.message}`, true);
                } else {
                    console.log('Registration successful:', data);
                    showMessage('Registration successful! You can now log in.');
                    
                    // Auto-switch to login tab after successful registration
                    setTimeout(() => {
                        showLoginForm();
                        clearForms();
                    }, 1500);
                    
                    // Dispatch login event if auto-login occurs
                    if (data && data.user) {
                        dispatchAuthEvent(USER_LOGGED_IN_EVENT, { user: data.user });
                        await updateAuthState();
                    }
                }
            } catch (err) {
                console.error('Unexpected error during registration:', err);
                showMessage(`An unexpected error occurred: ${err.message}`, true);
            } finally {
                // Re-enable the button and restore text
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // Handle login form submission
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            console.log('Login form submitted');
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            
            try {
                clearMessages();
                
                // Disable the button and show loading state
                submitBtn.disabled = true;
                submitBtn.textContent = 'Signing in...';
                
                console.log('Attempting to sign in with email:', email);
                const { data, error } = await signInUser(email, password);
                
                if (error) {
                    console.error('Login error:', error);
                    showMessage(`Login failed: ${error.message}`, true);
                } else {
                    console.log('Login successful:', data);
                    showMessage('Login successful!');
                    
                    // Update auth state
                    await updateAuthState();
                    
                    // Dispatch login event
                    dispatchAuthEvent(USER_LOGGED_IN_EVENT, { user: data.user });
                    
                    // Close modal after short delay
                    setTimeout(() => {
                        authModal.classList.remove('active');
                        clearForms();
                    }, 1000);
                }
            } catch (err) {
                console.error('Unexpected error during login:', err);
                showMessage(`An unexpected error occurred: ${err.message}`, true);
            } finally {
                // Re-enable the button and restore text
                submitBtn.disabled = false;
                submitBtn.textContent = originalBtnText;
            }
        });
    }

    // Handle forgot password form submission
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearMessages();
            console.log('Forgot password form submitted');
            
            const email = document.getElementById('forgot-email').value.trim();
            
            console.log('Password reset request for:', email);
            
            // Validate input
            if (!email) {
                showMessage('Please enter your email', true);
                return;
            }
            
            // Show loading state
            const submitBtn = forgotPasswordForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            // Reset password
            try {
                const { error } = await resetPassword(email);
                
                if (error) {
                    console.error('Password reset error:', error);
                    showMessage(error.message, true);
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                } else {
                    console.log('Password reset email sent');
                    showMessage('Password reset instructions sent to your email');
                    
                    // Switch back to login form after a delay
                    setTimeout(() => {
                        showLoginForm();
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                    }, 2000);
                }
            } catch (err) {
                console.error('Unexpected password reset error:', err);
                showMessage('An unexpected error occurred. Please try again.', true);
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }

    // Setup user profile dropdown
    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('active');
            }
        });
    }
    
    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            console.log('Logout requested');
            
            try {
                const { error } = await signOutUser();
                
                if (error) {
                    console.error('Logout error:', error);
                    alert(`Logout failed: ${error.message}`);
                } else {
                    console.log('Logout successful');
                    
                    // Close dropdown if open
                    if (dropdownMenu) {
                        dropdownMenu.classList.remove('active');
                    }
                    
                    // Dispatch logout event before updating auth state
                    dispatchAuthEvent(USER_LOGGED_OUT_EVENT);
                    
                    // Update auth state
                    await updateAuthState();
                    
                    // Redirect to home page if on a restricted page
                    const currentPath = window.location.pathname;
                    if (currentPath.includes('/account') || currentPath.includes('/orders')) {
                        window.location.href = currentPath.includes('/pages/') ? '../index.html' : 'index.html';
                    }
                }
            } catch (err) {
                console.error('Unexpected error during logout:', err);
                alert(`An unexpected error occurred during logout: ${err.message}`);
            }
        });
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        if (dropdownMenu && dropdownMenu.classList.contains('active')) {
            dropdownMenu.classList.remove('active');
        }
    });

    // Helper functions
    function showMessage(message, isError = false) {
        if (!authMessage) return;
        
        authMessage.textContent = message;
        authMessage.className = isError ? 'error' : 'success';
        
        // Log messages for debugging
        if (isError) {
            console.error('Auth Message (Error):', message);
        } else {
            console.log('Auth Message (Success):', message);
        }
    }
    
    function clearMessages() {
        if (authMessage) {
            authMessage.textContent = '';
            authMessage.classList.remove('error', 'success');
        }
    }
    
    function clearForms() {
        if (loginForm) loginForm.reset();
        if (registerForm) registerForm.reset();
        if (forgotPasswordForm) forgotPasswordForm.reset();
    }

    // Update the MutationObserver to be more thorough
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length) {
                const authState = localStorage.getItem('auth_state');
                if (authState === 'logged_in') {
                    // Handle all possible auth-related elements
                    const loginBtn = document.getElementById('login-btn');
                    const registerBtn = document.getElementById('register-btn');
                    const authButtons = document.querySelector('.auth-buttons');
                    
                    if (loginBtn) {
                        loginBtn.style.display = 'none';
                        loginBtn.setAttribute('aria-hidden', 'true');
                    }
                    if (registerBtn) {
                        registerBtn.style.display = 'none';
                        registerBtn.setAttribute('aria-hidden', 'true');
                    }
                    if (authButtons) {
                        const buttons = authButtons.querySelectorAll('.auth-btn');
                        buttons.forEach(btn => {
                            btn.style.display = 'none';
                            btn.setAttribute('aria-hidden', 'true');
                        });
                    }
                }
            }
        });
    });

    // Start observing the document body for changes with more specific options
    observer.observe(document.body, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class']
    });
}); 