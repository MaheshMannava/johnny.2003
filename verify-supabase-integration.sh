#!/bin/bash

# Verify Supabase Integration Script
# This script checks that all necessary files for the Supabase MCP integration are present

echo "Verifying Johnny.2003 Supabase MCP Integration..."
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1 exists"
        return 0
    else
        echo -e "${RED}✗${NC} $1 does not exist"
        return 1
    fi
}

# Function to check if text exists in file
check_text_in_file() {
    if grep -q "$2" "$1"; then
        echo -e "${GREEN}✓${NC} $1 contains required code: $2"
        return 0
    else
        echo -e "${RED}✗${NC} $1 does not contain required code: $2"
        return 1
    fi
}

# Count success and failures
TOTAL=0
SUCCESS=0

# Check required files
echo "Checking required files..."
REQUIRED_FILES=(
    "assets/js/mcp-supabase-bridge.js"
    "assets/js/supabase.js"
    "assets/js/supabase-integration-test.js"
    "test-mcp-connection.js"
    "setup-supabase-tables.sql"
    "README-SUPABASE-MCP.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    TOTAL=$((TOTAL+1))
    if check_file "$file"; then
        SUCCESS=$((SUCCESS+1))
    fi
done

# Check files have required code
echo -e "\nChecking file contents..."

# Check index.html includes the bridge script
TOTAL=$((TOTAL+1))
if check_text_in_file "index.html" "mcp-supabase-bridge.js"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check a product page includes the bridge script
TOTAL=$((TOTAL+1))
if check_text_in_file "pages/product1.html" "mcp-supabase-bridge.js"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check checkout page includes the bridge script
TOTAL=$((TOTAL+1))
if check_text_in_file "pages/checkout.html" "mcp-supabase-bridge.js"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check supabase.js includes MCP flag
TOTAL=$((TOTAL+1))
if check_text_in_file "assets/js/supabase.js" "useMcpServer"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check bridge includes fallback
TOTAL=$((TOTAL+1))
if check_text_in_file "assets/js/mcp-supabase-bridge.js" "Using mock authentication"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check cart.js includes quantity controls
TOTAL=$((TOTAL+1))
if check_text_in_file "assets/js/cart.js" "cart-quantity-controls"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check the quantity controls in the CSS
TOTAL=$((TOTAL+1))
if check_text_in_file "assets/css/product1.css" ".cart-quantity-controls"; then
    SUCCESS=$((SUCCESS+1))
fi

# Check SQL contains required tables
TOTAL=$((TOTAL+1))
if check_text_in_file "setup-supabase-tables.sql" "CREATE TABLE IF NOT EXISTS products"; then
    SUCCESS=$((SUCCESS+1))
fi

TOTAL=$((TOTAL+1))
if check_text_in_file "setup-supabase-tables.sql" "CREATE TABLE IF NOT EXISTS carts"; then
    SUCCESS=$((SUCCESS+1))
fi

# Calculate success percentage
PERCENT=$((SUCCESS*100/TOTAL))

echo -e "\nSummary:"
echo -e "Files checked: ${TOTAL}"
echo -e "Files passed: ${SUCCESS}"
echo -e "Success rate: ${PERCENT}%"

if [ $PERCENT -eq 100 ]; then
    echo -e "\n${GREEN}All integration checks passed!${NC}"
    echo -e "The Supabase MCP integration should be fully functional."
    echo -e "You can now set up the Supabase database using setup-supabase-tables.sql."
    echo -e "To test the integration, open the website and run window.runSupabaseIntegrationTest() in the console."
elif [ $PERCENT -ge 80 ]; then
    echo -e "\n${YELLOW}Most integration checks passed.${NC}"
    echo -e "The Supabase MCP integration should work but may have some issues."
    echo -e "Please review the failures above and fix them before testing."
else
    echo -e "\n${RED}Several integration checks failed.${NC}"
    echo -e "The Supabase MCP integration may not work properly."
    echo -e "Please review the failures above and fix them before proceeding."
fi 