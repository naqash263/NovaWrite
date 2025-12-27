#!/bin/bash

# Batch convert frontend images to WebP format
# This script converts all PNG and JPG images in frontend/public/images to WebP

FORMAT=${1:-webp}  # Default to webp, can be changed to avif
IMAGES_DIR="frontend/public/images"
OUTPUT_DIR="frontend/public/images/webp"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Converting images to $FORMAT format..."
echo "Source: $IMAGES_DIR"
echo "Output: $OUTPUT_DIR"
echo ""

# Find all PNG and JPG files
find "$IMAGES_DIR" -maxdepth 1 -type f \( -iname "*.png" -o -iname "*.jpg" -o -iname "*.jpeg" \) | while read -r image; do
    filename=$(basename "$image")
    name="${filename%.*}"
    
    echo "Converting: $filename"
    
    # Convert using PHP script
    php scripts/convert-frontend-images.php "$FORMAT" "$image"
    
    if [ $? -eq 0 ]; then
        echo "✓ Successfully converted $filename"
    else
        echo "✗ Failed to convert $filename"
    fi
    echo ""
done

echo "Batch conversion complete!"
echo ""
echo "Converted images are saved alongside originals with .$FORMAT extension"

