#!/bin/bash

# Update product pages to allow non-logged in users to add to cart

echo "Updating product page files to allow non-logged in users to add to cart..."

# Find all product HTML files
PRODUCT_FILES=$(find ./pages -name "product*.html")

# Counter for modified files
COUNT=0

for file in $PRODUCT_FILES; do
  echo "Processing $file..."
  
  # Replace the auth-required-message display logic - keep the element but make sure it's hidden
  sed -i '' 's/<p id="auth-required-message" class="auth-required" style="display: none; color: red; margin-top: 10px;">Please login to add items to your bag.<\/p>/<p id="auth-required-message" class="auth-required" style="display: none; color: red; margin-top: 10px;">Please complete checkout to continue.<\/p>/' "$file"
  
  COUNT=$((COUNT + 1))
done

echo "Updated $COUNT product files."

# Update product.js in case it exists and has the same login check as product1.js
echo "Checking for product.js to remove login check..."

if [ -f "./assets/js/product.js" ]; then
  echo "Updating product.js to remove login check..."
  
  # Create a backup
  cp "./assets/js/product.js" "./assets/js/product.js.bak"
  
  # Remove the login check section from product.js
  # This is a bit complex for sed, so we'll use a temporary file approach
  awk '
  /\/\/ First check if user is logged in/ { 
    in_login_check = 1; 
    # Skip this line 
    next; 
  }
  
  in_login_check == 1 && /\/\/ Add to cart/ { 
    in_login_check = 0; 
    # Output our replacement line
    print "                // Add to cart - allow any user (logged in or not) to add items to cart"; 
    next; 
  }
  
  in_login_check == 1 { 
    # Skip all lines in the login check block
    next; 
  }
  
  # Print all other lines
  { print }
  ' "./assets/js/product.js.bak" > "./assets/js/product.js"
  
  echo "Updated product.js successfully."
else
  echo "product.js not found, skipping."
fi

# Now update debug-checkout.js to check for login at checkout instead
echo "Updating debug-checkout.js to handle login at checkout..."

if [ -f "./assets/js/debug-checkout.js" ]; then
  echo "Modifying debug-checkout.js..."
  
  # Create a backup
  cp "./assets/js/debug-checkout.js" "./assets/js/debug-checkout.js.bak"
  
  # Find the showAuthModal function
  grep -q "showAuthModal()" "./assets/js/debug-checkout.js"
  
  if [ $? -eq 0 ]; then
    # Update the showAuthModal function to be more user-friendly
    sed -i '' '/showAuthModal()/{n; s/.*console.log.*/        console.log("User not logged in, showing friendly auth modal for checkout");/}' "./assets/js/debug-checkout.js"
    
    # Find and update any auth modal related messages
    sed -i '' 's/Please log in to continue checkout/Please log in or create an account to complete your purchase/' "./assets/js/debug-checkout.js"
    
    echo "Updated debug-checkout.js successfully."
  else
    echo "Could not find showAuthModal in debug-checkout.js, manual update needed."
  fi
else
  echo "debug-checkout.js not found, skipping."
fi

echo "All updates complete!" 