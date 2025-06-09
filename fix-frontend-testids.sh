#!/bin/bash

# Script to add data-testid attributes to frontend components
# This helps with test automation

echo "🔧 Adding test IDs to frontend components..."

# Function to add test ID to elements
add_testid() {
    local file=$1
    local search=$2
    local replace=$3
    
    if grep -q "$search" "$file"; then
        sed -i.bak "s|$search|$replace|g" "$file" && rm "${file}.bak"
        echo "  ✓ Updated: $file"
    fi
}

# Common test IDs to add
cd frontend/src

# Landing page
if [ -f "pages/Landing.tsx" ]; then
    add_testid "pages/Landing.tsx" \
        '<Button variant="contained"' \
        '<Button data-testid="get-started-button" variant="contained"'
fi

# Login page
if [ -f "pages/Login.tsx" ]; then
    add_testid "pages/Login.tsx" \
        '<form onSubmit' \
        '<form data-testid="login-form" onSubmit'
    
    add_testid "pages/Login.tsx" \
        'type="email"' \
        'type="email" data-testid="email-input"'
    
    add_testid "pages/Login.tsx" \
        'type="password"' \
        'type="password" data-testid="password-input"'
fi

# Dashboard
if [ -f "pages/Dashboard.tsx" ]; then
    add_testid "pages/Dashboard.tsx" \
        '<Box>' \
        '<Box data-testid="dashboard">'
    
    add_testid "pages/Dashboard.tsx" \
        '<Button.*New Scan' \
        '<Button data-testid="new-scan-button"'
fi

# Products page
if [ -f "pages/Products.tsx" ]; then
    add_testid "pages/Products.tsx" \
        '<Card>' \
        '<Card data-testid="product-card">'
fi

# Add more as needed...

echo "✅ Test IDs added successfully!"