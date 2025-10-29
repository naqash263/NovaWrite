# AdSense Quick Start Guide
## Get Started in 5 Minutes

---

## 🚀 **QUICK SETUP (5 Steps)**

### **Step 1: Get AdSense Account**
1. Visit: https://www.google.com/adsense
2. Sign up with your Google account
3. Submit `https://naqashthaheem.com` for approval
4. Wait 24-48 hours for approval

### **Step 2: Add Auto Ads Script**

Edit `frontend/index.html` - Add this BEFORE `</head>`:

```html
<!-- Google AdSense Auto Ads -->
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_PUBLISHER_ID"
     crossorigin="anonymous"></script>
```

**Replace** `ca-pub-YOUR_PUBLISHER_ID` with your actual Publisher ID from AdSense.

### **Step 3: Add Environment Variables**

Add to `frontend/.env`:

```env
VITE_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX
VITE_ADSENSE_SLOT_HEADER=1234567890
VITE_ADSENSE_SLOT_SIDEBAR=1234567891
VITE_ADSENSE_SLOT_CONTENT_TOP=1234567892
VITE_ADSENSE_SLOT_CONTENT_BOTTOM=1234567893
VITE_ADSENSE_SLOT_FOOTER=1234567894
VITE_ADSENSE_SLOT_BETWEEN_POSTS=1234567895
```

### **Step 4: Use AdPlacement Component**

Example on Blog page:

```tsx
import AdPlacement from '../components/AdPlacement';

// Add after imports

// In your JSX:
<AdPlacement position="content-top" />
// ... your content ...
<AdPlacement position="between-posts" />
// ... more content ...
<AdPlacement position="footer" />
```

### **Step 5: Test & Deploy**

1. Test locally (ads won't show until approved)
2. Deploy to production
3. Wait for AdSense to crawl your site
4. Monitor in AdSense dashboard

---

## 📍 **RECOMMENDED PLACEMENTS**

### **Homepage:**
```tsx
<AdPlacement position="content-top" />  // After hero
<AdPlacement position="content-middle" /> // After services
<AdPlacement position="footer" />        // Above footer
```

### **Blog List Page:**
```tsx
<AdPlacement position="content-top" />     // Top of posts
<AdPlacement position="between-posts" />  // Every 3 posts
<AdPlacement position="sidebar" />        // Sidebar
```

### **Blog Post Page:**
```tsx
<AdPlacement position="content-top" />     // After intro
<AdPlacement position="content-middle" />  // Middle of article
<AdPlacement position="sidebar" />        // Sidebar
<AdPlacement position="content-bottom" />  // Before comments
```

### **Resources Page:**
```tsx
<AdPlacement position="content-top" />
<AdPlacement position="sidebar" />
<AdPlacement position="footer" />
```

---

## ✅ **BEST PRACTICES**

1. **Start Small**: Add 2-3 ads per page initially
2. **Natural Placement**: Don't interrupt user flow
3. **Mobile First**: Ensure ads work on mobile
4. **Performance**: Ads load asynchronously (already done)
5. **Content First**: Maintain quality content

---

## 🎯 **WHERE TO ADD ADS**

### **On Blog.tsx:**
Add after line 248 (after `<h1>Blog</h1>`) and between posts:

```tsx
<h1 className="text-4xl font-bold text-gray-900 mb-8">Blog</h1>

{/* Add ad at top */}
<AdPlacement position="content-top" className="mb-8" />

// ... existing search/filter code ...

{/* In posts map, add between every 3 posts */}
{posts.map((post: Post, index: number) => (
  <>
    <PostCard key={post.id} post={post} />
    {index > 0 && (index + 1) % 3 === 0 && (
      <AdPlacement position="between-posts" className="my-8" />
    )}
  </>
))}
```

### **On Home.tsx:**
Add after hero section and between sections:

```tsx
{/* After hero section */}
<AdPlacement position="content-top" />

{/* After testimonials */}
<AdPlacement position="content-middle" />

{/* Before contact form */}
<AdPlacement position="content-bottom" />
```

---

## 📊 **EXPECTED RESULTS**

- **Approval Time**: 24-48 hours (sometimes up to 2 weeks)
- **Revenue**: $1-5 per 1000 pageviews (varies by niche)
- **Best Performing**: Sidebar ads, in-content ads
- **Worst Performing**: Footer ads (often ignored)

---

## ⚠️ **IMPORTANT NOTES**

1. **Don't click your own ads** (violation of AdSense policy)
2. **Wait for approval** before ads will show
3. **Test in production** - ads hidden in development
4. **Monitor performance** in AdSense dashboard
5. **Optimize placement** based on performance data

---

**That's it! Your AdSense integration is ready.** 🎉

For detailed documentation, see `ADSENSE_INTEGRATION_GUIDE.md`
