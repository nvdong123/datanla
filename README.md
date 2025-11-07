# 📸 Datanla Photo Booth - Auto Face Detection

**Modern FaceID Photo System với tự động quét khuôn mặt**

---

## ✨ Tính năng chính

### 🎯 Auto Face Detection
- ✅ **Tự động phát hiện khuôn mặt** khi camera mở
- ✅ **Progress circle** hiển thị tiến trình quét (0-100%)
- ✅ **Face mesh overlay** với scanning line animation
- ✅ **Tự động chụp** khi phát hiện khuôn mặt (>70% progress)
- ✅ **Fallback manual** button sau 10 giây nếu không detect được

### 🎨 Modern Dark Theme
- Dark blue background (#0f1824)
- Cyan accent (#00D9FF)
- Smooth animations và transitions
- Tech-inspired design giống ảnh mẫu

### 📱 Responsive Design
- ✅ Mobile portrait (2 columns grid)
- ✅ Tablet landscape (3-5 columns)
- ✅ POS mode toggle
- ✅ Auto-adapt theo orientation

---

## 🚀 Cách chạy

### Local
```bash
# Mở file trực tiếp
open index.html

# Hoặc dùng server
python -m http.server 8000
# → http://localhost:8000
```

**Lưu ý:** Camera cần HTTPS hoặc localhost

---

## 🌊 Luồng hoạt động

```
1. WELCOME
   ↓ Click "Bắt đầu quét"

2. CAMERA AUTO-SCAN
   - Mở camera
   - Face mesh overlay hiện lên
   - Progress circle 0% → 100%
   - Tự động chụp khi detect mặt (>70%)
   - Nếu 10s không detect → Show nút "Chụp" manual
   ↓ Sau khi chụp

3. RESULTS (Gallery)
   - 6 ảnh mock data
   - Multi-select (max 10)
   - Click "In ảnh"
   ↓

4. CONFIRMATION
   - Success animation
   - Pickup code: P-A12
   - Copy to clipboard
   - Order summary (số ảnh, giờ vào, tổng tiền)
```

---

## ⚙️ Config (app.js)

```javascript
const CONFIG = {
    MAX_SELECT: 10,           // Số ảnh tối đa
    PRICE_PER_PHOTO: 20000,   // Giá/ảnh (VNĐ)
    AUTO_DETECT_ENABLED: true, // Bật/tắt auto-detect
    DETECT_INTERVAL: 600,     // Check every 600ms
    DETECT_TIMEOUT: 10000,    // Manual button sau 10s
    API_FACE_SCAN: '/api/face-scan',
    API_PRINT_JOB: '/api/print-job'
};
```

---

## 🎨 Design Details

### Face Detection UI
- **Face Frame:** Oval shape với cyan border
- **Corner Markers:** 4 góc với rounded corners
- **Scanning Line:** Horizontal line di chuyển từ trên xuống
- **Grid Lines:** Vertical lines (33%, 66%)
- **Progress Circle:** SVG circle với animated stroke
- **Progress %:** Center text, cyan glow effect

### Colors
```css
--color-bg-dark: #0f1824     /* Dark background */
--color-bg-card: #1a2942     /* Card background */
--color-accent: #00D9FF      /* Cyan accent */
--color-success: #00ff88     /* Green success */
```

### Animations
- `framePulse`: Face mesh breathing effect (2s)
- `scanMove`: Scanning line moving (3s)
- `successPop`: Success icon scale animation
- `checkPop`: Checkmark icon on select
- `slideUp`: Action bar slide from bottom

---

## 📱 Responsive Breakpoints

| Device | Screen | Grid Columns |
|--------|--------|--------------|
| Mobile | < 600px | 2 cols |
| Tablet | 600-900px | 3 cols |
| Desktop | > 900px | 4 cols |
| POS Mode | Any | Optimized |

### Landscape Optimization
```css
@media (orientation: landscape) and (max-height: 600px)
```
- Smaller logo
- Compact scan guide
- 5 columns grid
- Reduced paddings

---

## 🔧 Tích hợp Backend

**Mock API hiện tại:**
- Auto-detect simulation (progress 0→100)
- Face detection: 80% chance khi progress ≥70%
- 10% fail rate cho scan & print

**Để tích hợp real backend:**

```javascript
// Thay mockFetch bằng real API calls
async function performFaceScan(imageData) {
    const response = await fetch('/api/face-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData })
    });
    
    const data = await response.json();
    // Process data.results
}
```

**Backend response format:**
```json
{
  "status": "ok",
  "results": [
    {"id": "IMG_001", "url": "...", "score": 0.95, "price": 20000}
  ]
}
```

---

## ✅ Features Checklist

- [x] Auto face detection với progress
- [x] Face mesh overlay với scanning animation
- [x] Manual capture fallback
- [x] Modern dark theme design
- [x] Responsive mobile + tablet
- [x] Multi-select photos (max 10)
- [x] Single pickup code per job
- [x] Success animation
- [x] Copy to clipboard
- [x] Toast notifications
- [x] Lightbox photo preview
- [x] POS mode toggle
- [x] Fullscreen support
- [x] Keyboard shortcuts (Escape)

---

## 🐛 Troubleshooting

**Camera không hoạt động:**
- Cần HTTPS hoặc localhost
- Check browser permissions
- Fallback: Upload ảnh (đang dev)

**Auto-detect không chạy:**
- Check `CONFIG.AUTO_DETECT_ENABLED = true`
- Sau 10s sẽ show nút manual

**Design không giống ảnh:**
- Clear cache (Ctrl+F5)
- Check CSS đã load đúng

---

## 📊 Stats

- **Files:** 3 (HTML, CSS, JS)
- **Size:** ~53 KB
- **Dependencies:** Font Awesome CDN only
- **Lines:** ~1,500 total

---

**Version:** 2.0 (Auto-Scan)  
**Status:** ✅ Ready for Demo

🎉 **Enjoy scanning!**