# API Documentation - Image Tools

## Text to Image API

### Endpoint
```
POST /api/utility-tools/text-to-image/generate
```

### Description
Generate images from text with customizable backgrounds, fonts, colors, and layouts. Supports background images for creating Instagram posts, stories, and other social media content.

### Request Headers
```
Content-Type: multipart/form-data
```

### Request Parameters

#### Text Content
- `heading` (string, optional, max: 500): Main heading text
- `summary` (string, optional, max: 2000): Summary/description text

#### Dimensions
- `width` (integer, optional, min: 100, max: 5000): Image width in pixels (default: 1200)
- `height` (integer, optional, min: 100, max: 5000): Image height in pixels (default: 630)

#### Colors
- `backgroundColor` (string, optional): Background color in hex format (e.g., `#3B82F6`)
- `headingColor` (string, optional): Heading text color in hex format (e.g., `#FFFFFF`)
- `summaryColor` (string, optional): Summary text color in hex format (e.g., `#F3F4F6`)
- `gradientColor` (string, optional): Second color for gradient background (e.g., `#1E40AF`)

#### Typography
- `headingSize` (integer, optional, min: 20, max: 120): Heading font size in pixels (default: 56)
- `summarySize` (integer, optional, min: 12, max: 60): Summary font size in pixels (default: 28)
- `fontFamily` (string, optional, max: 50): Font family name (default: `Arial`)
- `textAlign` (string, optional): Text alignment - `left`, `center`, or `right` (default: `center`)
- `padding` (integer, optional, min: 20, max: 200): Padding around text in pixels (default: 80)
- `lineSpacing` (numeric, optional, min: 1.0, max: 3.0): Line spacing multiplier (default: 1.5)
- `headingSpacing` (integer, optional, min: 20, max: 100): Space between heading and summary (default: 50)

#### Visual Effects
- `useGradient` (boolean, optional): Enable gradient background (default: `false`)
- `textShadow` (boolean, optional): Enable text shadow (default: `true`)
- `textShadowBlur` (integer, optional, min: 0, max: 20): Text shadow blur radius (default: 8)

#### Background Image
- `useBackgroundImage` (boolean, optional): Use uploaded background image (default: `false`)
- `backgroundImage` (file, optional): Background image file (JPEG, PNG, GIF, WebP, max: 10MB)
- `backgroundImageUrl` (string, optional): URL to background image (alternative to file upload, max: 2048 chars)
- `backgroundOverlay` (boolean, optional): Add dark overlay for text readability (default: `true`)
- `backgroundOverlayOpacity` (numeric, optional, min: 0, max: 0.8): Overlay opacity (default: 0.3)

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Image generated successfully",
  "data": {
    "url": "https://naqashthaheem.com/storage/text-images/generated_abc123.png",
    "path": "text-images/generated_abc123.png"
  }
}
```

#### Error Response (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "heading": ["Heading must not exceed 500 characters."]
  }
}
```

### Example: Instagram Post with Background Image

#### cURL
#### Using Background Image URL
```bash
curl -X POST https://naqashthaheem.com/api/utility-tools/text-to-image/generate \
  -F "heading=Welcome to My Instagram" \
  -F "summary=Follow for amazing content and updates!" \
  -F "width=1080" \
  -F "height=1080" \
  -F "headingColor=#FFFFFF" \
  -F "summaryColor=#F3F4F6" \
  -F "headingSize=72" \
  -F "summarySize=36" \
  -F "fontFamily=Arial" \
  -F "textAlign=center" \
  -F "padding=100" \
  -F "useBackgroundImage=true" \
  -F "backgroundImageUrl=https://drive.google.com/uc?export=view&id=1io04gaHWlcw2y-G6PLSUOE15lMWhlk9k" \
  -F "backgroundOverlay=true" \
  -F "backgroundOverlayOpacity=0.4" \
  -F "textShadow=true" \
  -F "textShadowBlur=10"
```

#### Using Background Image File Upload
```bash
curl -X POST https://naqashthaheem.com/api/utility-tools/text-to-image/generate \
  -F "heading=Welcome to My Instagram" \
  -F "summary=Follow for amazing content and updates!" \
  -F "width=1080" \
  -F "height=1080" \
  -F "headingColor=#FFFFFF" \
  -F "summaryColor=#F3F4F6" \
  -F "headingSize=72" \
  -F "summarySize=36" \
  -F "fontFamily=Arial" \
  -F "textAlign=center" \
  -F "padding=100" \
  -F "useBackgroundImage=true" \
  -F "backgroundImage=@/path/to/background.jpg" \
  -F "backgroundOverlay=true" \
  -F "backgroundOverlayOpacity=0.4" \
  -F "textShadow=true" \
  -F "textShadowBlur=10"
```

#### JavaScript (Fetch API)
```javascript
const formData = new FormData();
formData.append('heading', 'Welcome to My Instagram');
formData.append('summary', 'Follow for amazing content and updates!');
formData.append('width', '1080');
formData.append('height', '1080');
formData.append('headingColor', '#FFFFFF');
formData.append('summaryColor', '#F3F4F6');
formData.append('headingSize', '72');
formData.append('summarySize', '36');
formData.append('fontFamily', 'Arial');
formData.append('textAlign', 'center');
formData.append('padding', '100');
formData.append('useBackgroundImage', 'true');
formData.append('backgroundImage', backgroundImageFile); // File object
formData.append('backgroundOverlay', 'true');
formData.append('backgroundOverlayOpacity', '0.4');
formData.append('textShadow', 'true');
formData.append('textShadowBlur', '10');

const response = await fetch('https://naqashthaheem.com/api/utility-tools/text-to-image/generate', {
  method: 'POST',
  body: formData
});

const data = await response.json();
if (data.success) {
  console.log('Image URL:', data.data.url);
}
```

#### Python (requests)
```python
import requests

url = 'https://naqashthaheem.com/api/utility-tools/text-to-image/generate'

data = {
    'heading': 'Welcome to My Instagram',
    'summary': 'Follow for amazing content and updates!',
    'width': '1080',
    'height': '1080',
    'headingColor': '#FFFFFF',
    'summaryColor': '#F3F4F6',
    'headingSize': '72',
    'summarySize': '36',
    'fontFamily': 'Arial',
    'textAlign': 'center',
    'padding': '100',
    'useBackgroundImage': 'true',
    'backgroundOverlay': 'true',
    'backgroundOverlayOpacity': '0.4',
    'textShadow': 'true',
    'textShadowBlur': '10'
}

files = {
    'backgroundImage': open('/path/to/background.jpg', 'rb')
}

response = requests.post(url, data=data, files=files)
result = response.json()

if result['success']:
    print('Image URL:', result['data']['url'])
```

### Example: Instagram Story with Background Image

```bash
curl -X POST https://naqashthaheem.com/api/utility-tools/text-to-image/generate \
  -F "heading=Daily Inspiration" \
  -F "summary=Start your day with positivity" \
  -F "width=1080" \
  -F "height=1920" \
  -F "headingColor=#FFFFFF" \
  -F "summaryColor=#E0E7FF" \
  -F "headingSize=80" \
  -F "summarySize=40" \
  -F "fontFamily=Impact" \
  -F "textAlign=center" \
  -F "padding=120" \
  -F "useBackgroundImage=true" \
  -F "backgroundImage=@/path/to/story-background.jpg" \
  -F "backgroundOverlay=true" \
  -F "backgroundOverlayOpacity=0.5" \
  -F "textShadow=true" \
  -F "textShadowBlur=12"
```

### Recommended Settings for Instagram

#### Instagram Post (Square: 1080x1080)
- `width`: 1080
- `height`: 1080
- `headingSize`: 60-80
- `summarySize`: 30-40
- `padding`: 80-120

#### Instagram Story (Vertical: 1080x1920)
- `width`: 1080
- `height`: 1920
- `headingSize`: 70-90
- `summarySize`: 35-45
- `padding`: 100-150
- `backgroundOverlayOpacity`: 0.4-0.6 (for better text readability)

#### Instagram Reel Cover (Vertical: 1080x1920)
- Same as Instagram Story
- Consider using bold fonts like `Impact` or `Arial Black`

### Notes
- At least one of `heading` or `summary` must be provided
- Background image will be resized to fit the specified dimensions
- Dark overlay is recommended when using background images for better text readability
- Text is automatically centered vertically and horizontally
- Text automatically wraps to fit within padding boundaries

---

## Image Resizer API

### Endpoint
```
POST /api/utility-tools/image-resizer/resize
```

### Description
Resize images to specific dimensions or social media presets.

### Request Headers
```
Content-Type: multipart/form-data
```

### Request Parameters
- `image` (file, required): Image file to resize (JPEG, PNG, GIF, WebP, BMP, max: 10MB)
- `width` (integer, optional, min: 1, max: 10000): Target width in pixels
- `height` (integer, optional, min: 1, max: 10000): Target height in pixels
- `preset` (string, optional): Preset name (see presets below)
- `maintain_aspect_ratio` (boolean, optional): Maintain aspect ratio (default: `true`)
- `quality` (numeric, optional, min: 0.1, max: 1.0): Image quality (default: 0.9)
- `format` (string, optional): Output format - `jpeg`, `png`, or `webp` (default: `jpeg`)

### Available Presets
- `instagram-post`: 1080x1080
- `instagram-story`: 1080x1920
- `instagram-reel`: 1080x1920
- `facebook-post`: 1200x630
- `facebook-cover`: 1640x859
- `twitter-post`: 1200x675
- `twitter-header`: 1500x500
- `linkedin-post`: 1200x627
- `linkedin-cover`: 1584x396
- `youtube-thumbnail`: 1280x720
- `pinterest-pin`: 1000x1500
- `default`: Custom size

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Image resized successfully",
  "data": {
    "url": "https://naqashthaheem.com/storage/resized/resized_abc123.jpg",
    "path": "resized/resized_abc123.jpg",
    "original_dimensions": {
      "width": 2000,
      "height": 1500
    },
    "resized_dimensions": {
      "width": 1080,
      "height": 1080
    },
    "original_size": 524288,
    "resized_size": 245760,
    "size_reduction": 53.13,
    "format": "jpeg",
    "quality": 0.9,
    "preset": "Instagram Post"
  }
}
```

### Example: Resize to Instagram Post
```bash
curl -X POST https://naqashthaheem.com/api/utility-tools/image-resizer/resize \
  -F "image=@/path/to/image.jpg" \
  -F "preset=instagram-post" \
  -F "quality=0.9" \
  -F "format=jpeg"
```

---

## Get Presets

### Endpoint
```
GET /api/utility-tools/image-resizer/presets
```

### Description
Get list of available image size presets.

### Response
```json
{
  "success": true,
  "presets": {
    "instagram-post": {
      "name": "Instagram Post",
      "width": 1080,
      "height": 1080,
      "description": "Square format for Instagram feed posts",
      "category": "social-media"
    },
    ...
  }
}
```

