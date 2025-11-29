# Font Installation Guide for Text to Image API

## Problem
The Text to Image API requires TTF (TrueType Font) files to render text on images. If you see the error:
```
"No suitable font found. Please ensure TTF fonts are installed on the server."
```

This means TTF fonts are not installed or not accessible on your server.

## Solution: Install Liberation Fonts (Recommended)

### For Linux Servers (Ubuntu/Debian)

```bash
# SSH into your server
ssh -p 21098 timesovh@162.254.39.126

# Install Liberation fonts
sudo apt-get update
sudo apt-get install -y fonts-liberation

# Verify installation
ls -la /usr/share/fonts/truetype/liberation/
```

### For Linux Servers (CentOS/RHEL)

```bash
sudo yum install -y liberation-fonts
# or
sudo dnf install -y liberation-fonts
```

### Alternative: Install DejaVu Fonts

```bash
# Ubuntu/Debian
sudo apt-get install -y fonts-dejavu

# CentOS/RHEL
sudo yum install -y dejavu-fonts
```

## Verify Font Installation

After installing fonts, verify they're accessible:

```bash
# Check Liberation fonts
ls -la /usr/share/fonts/truetype/liberation/

# Check DejaVu fonts
ls -la /usr/share/fonts/truetype/dejavu/

# List all TTF fonts
find /usr/share/fonts -name "*.ttf" | head -10
```

## Test the API

After installing fonts, test the API:

```bash
curl -X POST https://naqashthaheem.com/api/utility-tools/text-to-image/generate \
  -F "heading=Test Image" \
  -F "summary=Testing font installation" \
  -F "width=1200" \
  -F "height=630"
```

## Font Locations Searched by API

The API searches for fonts in these locations (in order):

1. `/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf`
2. `/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf`
3. `/usr/share/fonts/TTF/DejaVuSans.ttf`
4. `/usr/share/fonts/` (recursive search)
5. `/System/Library/Fonts/` (macOS)
6. `C:/Windows/Fonts/` (Windows)

## Manual Font Installation

If package managers don't work, you can manually install fonts:

```bash
# Create fonts directory if it doesn't exist
sudo mkdir -p /usr/share/fonts/truetype/liberation

# Download Liberation fonts
cd /tmp
wget https://github.com/liberationfonts/liberation-fonts/releases/download/2.1.5/liberation-fonts-ttf-2.1.5.tar.gz
tar -xzf liberation-fonts-ttf-2.1.5.tar.gz
sudo cp liberation-fonts-ttf-2.1.5/*.ttf /usr/share/fonts/truetype/liberation/

# Update font cache
sudo fc-cache -f -v
```

## Troubleshooting

### Check if GD library supports TTF fonts

```bash
php -r "var_dump(function_exists('imagettftext'));"
```

Should output: `bool(true)`

### Check font file permissions

```bash
ls -la /usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf
```

Should be readable by the web server user.

### Test font access from PHP

```bash
php -r "var_dump(file_exists('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf'));"
```

Should output: `bool(true)`

## Production Server Commands

For the production server (timesovh), run:

```bash
ssh -p 21098 timesovh@162.254.39.126
sudo apt-get update
sudo apt-get install -y fonts-liberation fonts-dejavu
sudo fc-cache -f -v
```

Then restart PHP-FPM:

```bash
sudo systemctl restart php8.1-fpm
# or
sudo systemctl restart php-fpm
```

## Supported Font Families

The API supports these font families (mapped to system fonts):

- **Arial** → Liberation Sans / DejaVu Sans
- **Helvetica** → Liberation Sans / DejaVu Sans
- **Times New Roman** → Liberation Serif / DejaVu Serif
- **Courier New** → Liberation Mono / DejaVu Sans Mono

If a specific font is not found, the API will automatically fallback to Arial, and if that's not found, it will return an error.

