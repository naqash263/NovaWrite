#!/bin/bash

# Convert all frontend images to WebP format
# This script converts all PNG and JPG images in frontend/public/images to WebP

IMAGES_DIR="frontend/public/images"
CONVERTED_COUNT=0
FAILED_COUNT=0

echo "=========================================="
echo "Converting Frontend Images to WebP"
echo "=========================================="
echo ""

# Find all PNG and JPG files (excluding already converted WebP files)
find "$IMAGES_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) ! -iname "*.webp" | while read -r image; do
    filename=$(basename "$image")
    echo "Converting: $filename"
    
    # Convert using PHP script
    php scripts/convert-frontend-images.php webp "$image" 2>&1
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully converted $filename"
        CONVERTED_COUNT=$((CONVERTED_COUNT + 1))
    else
        echo "✗ Failed to convert $filename"
        FAILED_COUNT=$((FAILED_COUNT + 1))
    fi
    echo ""
done

echo "=========================================="
echo "Conversion Complete!"
echo "Converted: $CONVERTED_COUNT images"
echo "Failed: $FAILED_COUNT images"
echo "=========================================="

