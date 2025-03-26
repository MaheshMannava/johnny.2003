#!/bin/bash

# Script to update all product pages with the MCP Supabase bridge script
# and fix any duplicate script tags

# Find all product pages
PRODUCT_PAGES=$(find pages -name "product*.html")

for page in $PRODUCT_PAGES; do
  echo "Updating $page..."
  
  # Fix duplicate script tags if any
  # This finds <!-- Scripts --> and everything until </body>, then replaces it with our standard script section
  sed -i '' -e '/<\!-- Scripts -->/,/<\/body>/{
    /<\!-- Scripts -->/!{/<\/body>/!d;}
  }' "$page"
  
  # Add the MCP Supabase bridge script
  sed -i '' -e 's#<script type="module" src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js">#<script type="module" src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js">\n    <script type="module" src="../assets/js/mcp-supabase-bridge.js">#' "$page"
  
  # Make sure we have all the necessary scripts in the right order
  sed -i '' -e '/<\/body>/i\
    <script type="module" src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>\
    <script type="module" src="../assets/js/mcp-supabase-bridge.js"></script>\
    <script type="module" src="../assets/js/supabase.js"></script>\
    <script type="module" src="../assets/js/auth.js"></script>\
    <script type="module" src="../assets/js/cart.js"></script>\
    <script type="module" src="../assets/js/product.js"></script>' "$page"
  
  # Clean up any duplicate script tags
  sed -i '' -e '/^[ \t]*<script.*supabase-js.*<\/script>/{N;/\n[ \t]*<script.*supabase-js.*<\/script>/D;}' "$page"
  sed -i '' -e '/^[ \t]*<script.*mcp-supabase-bridge.*<\/script>/{N;/\n[ \t]*<script.*mcp-supabase-bridge.*<\/script>/D;}' "$page"
  sed -i '' -e '/^[ \t]*<script.*supabase\.js.*<\/script>/{N;/\n[ \t]*<script.*supabase\.js.*<\/script>/D;}' "$page"
  sed -i '' -e '/^[ \t]*<script.*auth\.js.*<\/script>/{N;/\n[ \t]*<script.*auth\.js.*<\/script>/D;}' "$page"
  sed -i '' -e '/^[ \t]*<script.*cart\.js.*<\/script>/{N;/\n[ \t]*<script.*cart\.js.*<\/script>/D;}' "$page"
  sed -i '' -e '/^[ \t]*<script.*product\.js.*<\/script>/{N;/\n[ \t]*<script.*product\.js.*<\/script>/D;}' "$page"
  
  echo "Updated $page successfully."
done

echo "All product pages updated successfully!"
