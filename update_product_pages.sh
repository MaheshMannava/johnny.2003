#!/bin/bash

# Script to update all product pages with cart dropdown functionality

echo "Starting to update product pages..."

# Loop through all product HTML files
for file in pages/product*.html; do
  echo "Processing $file..."
  
  # Skip product1.html (reference template) and already processed files
  if [[ "$file" == "pages/product1.html" || "$file" == "pages/product16.html" ]]; then
    echo "Skipping $file (already processed)"
    continue
  fi

  # Check if the file contains the cart-container class
  if grep -q "cart-container" "$file"; then
    echo "$file already has cart-container, skipping..."
    continue
  fi

  # Replace simple bag icon with cart container and dropdown
  sed -i.bak '/<div class="navbar-right">/,/<\/div>/ s|<img src="../assets/images/bag.png" alt="bag" class="bag-icon">|<div class="cart-container">\n                <img src="../assets/images/bag.png" alt="bag" class="bag-icon">\n                <!-- Cart Dropdown -->\n                <div id="cart-dropdown" class="cart-dropdown">\n                    <div class="cart-header">\n                        <h3>Your Cart</h3>\n                    </div>\n                    <div id="cart-items" class="cart-items">\n                        <!-- Cart items will be dynamically added here -->\n                    </div>\n                    <div class="cart-footer">\n                        <div class="cart-total">\n                            <span>Total:</span>\n                            <span id="cart-total-amount">₹0</span>\n                        </div>\n                        <button id="checkout-btn" class="checkout-btn">Checkout</button>\n                    </div>\n                </div>\n            </div>|' "$file"

  # Add auth modal if not present
  if ! grep -q "auth-modal" "$file"; then
    sed -i.bak '/<\/div>\s*<\/div>\s*<\/div>/a \\n    <!-- Auth Modal -->\n    <div id="auth-modal" class="auth-modal">\n        <div class="modal-content">\n            <button id="close-btn" class="close-btn">&times;</button>\n            \n            <div class="auth-tabs">\n                <div id="login-tab" class="auth-tab active">Login</div>\n                <div id="register-tab" class="auth-tab">Register</div>\n            </div>\n            \n            <!-- Login Form -->\n            <form id="login-form" class="auth-form">\n                <div class="form-group">\n                    <input type="email" id="login-email" placeholder="Email" required>\n                </div>\n                <div class="form-group">\n                    <input type="password" id="login-password" placeholder="Password" required>\n                </div>\n                <button type="submit">Login</button>\n                <div id="forgot-password" class="forgot-password">Forgot Password?</div>\n            </form>\n            \n            <!-- Register Form -->\n            <form id="register-form" class="auth-form" style="display: none;">\n                <div class="form-group">\n                    <input type="email" id="register-email" placeholder="Email" required>\n                </div>\n                <div class="form-group">\n                    <input type="password" id="register-password" placeholder="Password" required>\n                </div>\n                <div class="form-group">\n                    <input type="password" id="confirm-password" placeholder="Confirm Password" required>\n                </div>\n                <button type="submit">Register</button>\n            </form>\n            \n            <!-- Forgot Password Form -->\n            <form id="forgot-password-form" class="auth-form" style="display: none;">\n                <div class="form-group">\n                    <input type="email" id="forgot-email" placeholder="Email" required>\n                </div>\n                <button type="submit">Reset Password</button>\n            </form>\n            \n            <!-- Auth Message -->\n            <div id="auth-message" class="auth-message"></div>\n        </div>\n    </div>' "$file"
  fi

  # Add auth.css link if not present
  if ! grep -q "auth.css" "$file"; then
    sed -i.bak '/<link rel="stylesheet" href="..\/assets\/css\/product1.css">/a \    <link rel="stylesheet" href="../assets/css/auth.css">' "$file"
  fi

  # Update scripts section to include all required scripts
  if ! grep -q "cart.js" "$file"; then
    # Replace existing script tag(s) with complete script imports
    sed -i.bak 's|<script src="../assets/js/product[0-9]*.js"></script>|<!-- Scripts -->\n    <script type="module" src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>\n    <script type="module" src="../assets/js/supabase.js"></script>\n    <script type="module" src="../assets/js/auth.js"></script>\n    <script type="module" src="../assets/js/cart.js"></script>\n    <script type="module" src="../assets/js/product.js"></script>|' "$file"
  fi

  echo "Updated $file successfully"
done

echo "All product pages updated successfully!" 