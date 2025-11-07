# 📁 CẤU TRÚC PROJECT - Face Scan Demo

## 🗂️ Tổng quan cấu trúc

```
face-scan-demo/
├── index.html              (5.2 KB)  ← File HTML chính
├── styles.css              (15 KB)   ← Tất cả CSS styling
├── app.js                  (21 KB)   ← Logic và functionality
├── README.md               (5.5 KB)  ← Hướng dẫn sử dụng
└── assets/                           ← Thư mục chứa icons
    ├── camera-icon.svg               ← Icon máy ảnh
    ├── print-icon.svg                ← Icon máy in
    ├── fullscreen-icon.svg           ← Icon toàn màn hình
    ├── pos-icon.svg                  ← Icon chế độ POS
    └── close-icon.svg                ← Icon đóng modal
```

**Tổng dung lượng:** ~47 KB (rất nhẹ, chạy mượt trên mobile)

---

## 📄 Chi tiết từng file

### 1️⃣ `index.html` (5.2 KB)
**Mục đích:** Cấu trúc HTML chính của ứng dụng

**Nội dung chính:**
```html
<header>              ← Logo, nút POS Mode, nút Fullscreen
<main>
  <section camera>    ← Camera preview, nút capture, upload
  <div loading>       ← Spinner "Đang quét..."
  <section results>   ← Grid hiển thị ảnh tìm được
</main>
<div action-bar>      ← Thanh hành động (chọn/in)
<div modal>           ← Modal thông báo
<div toast>           ← Toast notifications
```

**Đặc điểm:**
- ✅ Semantic HTML5
- ✅ ARIA labels đầy đủ (accessibility)
- ✅ Không inline CSS/JS (tách biệt rõ ràng)
- ✅ Link tương đối tới `styles.css` và `app.js`
- ✅ Checklist Acceptance Criteria ở cuối file

---

### 2️⃣ `styles.css` (15 KB)
**Mục đích:** Toàn bộ styling, mobile-first responsive

**Cấu trúc theo sections:**
```css
/* BASE & RESET */           ← Reset mặc định, typography
/* LAYOUT */                 ← Header, main layout
/* CAMERA SECTION */         ← Camera preview, controls
/* LOADING */                ← Spinner animation
/* RESULTS SECTION */        ← Grid layout responsive
/* THUMBNAIL */              ← Styling ảnh, selection overlay
/* ACTION BAR */             ← Fixed bottom bar
/* MODAL */                  ← Modal dialog
/* TOAST */                  ← Toast notifications
/* POS MODE */               ← Tablet/POS adjustments
/* RESPONSIVE BREAKPOINTS */ ← Media queries
```

**Breakpoints:**
- Mobile: `< 600px` → 2 cột
- Tablet: `≥ 600px` → 3 cột
- Desktop: `≥ 900px` → 4 cột
- Large: `≥ 1200px` → 5 cột

**POS Mode:** Tự động scale lên khi bật (tiles lớn hơn, touch targets ≥56px)

---

### 3️⃣ `app.js` (21 KB)
**Mục đích:** Toàn bộ logic, mock API, state management

**Cấu trúc theo modules:**
```javascript
// CONFIGURATION (lines 7-16)
const MAX_SELECT = 10;
const API_FACE_SCAN = '/api/face-scan';
const API_PRINT_JOB = '/api/print-job';
...

// STATE MANAGEMENT (lines 18-26)
const state = {
    stream, selectedImages, scanId, results, ...
}

// DOM ELEMENTS (lines 28-58)
const elements = { video, canvas, buttons, ... }

// CAMERA SETUP (lines 60-80)
initCamera(), stopCamera()

// IMAGE CAPTURE (lines 82-118)
captureImage(), handleFileUpload(), debounce

// API WRAPPER & MOCK (lines 120-198)
mockFetch(), generateMockResults(), apiCall()

// FACE SCAN LOGIC (lines 200-230)
performFaceScan()

// RESULTS RENDERING (lines 232-270)
renderResults(), createThumbnail()

// SELECTION LOGIC (lines 272-316)
toggleSelection(), updateThumbnailSelection(), clearSelection()

// PRINT SIMULATION (lines 318-378)
simulatePrint(), showPrintSuccess(), showPrintError()

// MODAL HANDLING (lines 380-390)
showModal(), closeModal()

// TOAST NOTIFICATIONS (lines 392-410)
showToast()

// UTILITY FUNCTIONS (lines 412-440)
copyToClipboard(), fallbackCopy()

// POS MODE & FULLSCREEN (lines 442-468)
togglePosMode(), toggleFullscreen()

// EVENT LISTENERS (lines 470-520)
initEventListeners()

// INITIALIZATION (lines 522-550)
init(), app startup
```

**Mock API:**
- Trả về 6 ảnh mẫu (SVG với màu khác nhau)
- Simulate latency: 800-1500ms
- Simulate failure: 10% random

---

### 4️⃣ `README.md` (5.5 KB)
**Mục đích:** Hướng dẫn đầy đủ cho developer

**Nội dung:**
- 🚀 Cách chạy project
- ⚙️ Config constants (MAX_SELECT, latency, fail rate)
- 🎯 Danh sách tính năng
- 🔧 Hướng dẫn tùy chỉnh
- 📱 Test trên thiết bị
- ✅ Acceptance criteria checklist
- 🐛 Troubleshooting
- 🔌 Hướng dẫn tích hợp backend thực

---

### 5️⃣ `assets/` (5 files SVG)
**Mục đích:** Icons cho UI

| File | Mục đích | Sử dụng ở |
|------|----------|-----------|
| `camera-icon.svg` | Icon máy ảnh | Logo, nút capture |
| `print-icon.svg` | Icon máy in | Nút in ảnh |
| `fullscreen-icon.svg` | Icon toàn màn hình | Nút fullscreen |
| `pos-icon.svg` | Icon POS | Nút chế độ POS |
| `close-icon.svg` | Icon đóng | Đóng modal |

**Đặc điểm SVG:**
- Vector (scale không mất chất lượng)
- Kích thước nhỏ (~300-400 bytes/icon)
- Dùng `currentColor` (thay đổi màu dễ dàng)

---

## 🔗 Mối quan hệ giữa các file

```
index.html
   ↓ link rel="stylesheet"
styles.css ────────────────┐
   ↓ <script src>          │
app.js                     │
   ↓ tham chiếu            │
assets/*.svg               │
                           │
                     Tạo UI hoàn chỉnh
```

**Workflow:**
1. Browser load `index.html`
2. Parse và load `styles.css` → render UI
3. Load và execute `app.js` → attach event listeners
4. `app.js` tham chiếu icons từ `assets/`
5. User tương tác → `app.js` xử lý → update DOM

---

## 🚀 Cách hoạt động khi chạy

### Bước 1: Mở `index.html`
```
Browser đọc HTML → Load CSS → Load JS → Init camera
```

### Bước 2: User chụp ảnh
```
Click "Quét khuôn mặt" 
  → app.js: captureImage() 
  → Canvas capture video frame
  → performFaceScan(imageData)
  → Mock API: generateMockResults()
  → renderResults()
  → Show grid 6 ảnh
```

### Bước 3: User chọn ảnh
```
Click thumbnail
  → app.js: toggleSelection(imageId)
  → Update state.selectedImages (Set)
  → Add class "selected"
  → Show action bar
```

### Bước 4: User nhấn "In"
```
Click "In (Simulate)"
  → app.js: simulatePrint()
  → Show modal progress
  → Mock API: /api/print-job
  → Simulate latency 800-1500ms
  → showPrintSuccess()
  → Display printCodes (P-A12, P-A13, ...)
```

---

## 📦 Dependencies

**KHÔNG CẦN EXTERNAL LIBRARIES!**

✅ Vanilla JavaScript (ES6+)
✅ Native CSS (no frameworks)
✅ Native APIs:
- `navigator.mediaDevices.getUserMedia`
- `canvas.getContext('2d')`
- `document.querySelector/All`
- `fetch` API (mocked)
- `navigator.clipboard`
- `Fullscreen API`

**→ Kết quả:** Project chạy hoàn toàn offline, không cần internet!

---

## 🎨 Customization Guide

### Thay đổi số ảnh tối đa chọn
**File:** `app.js` (line 10)
```javascript
const MAX_SELECT = 10;  // ← Đổi thành 5, 20, v.v.
```

### Thay đổi màu chủ đạo
**File:** `styles.css` (search `#2563eb`)
```css
/* Primary blue: #2563eb */
/* Thay tất cả #2563eb thành màu khác */
```

### Thay đổi số lượng ảnh mock
**File:** `app.js` function `generateMockResults()` (line ~140)
```javascript
for (let i = 1; i <= 6; i++) {  // ← Đổi 6 thành 10, 20, v.v.
```

### Thay đổi latency mock API
**File:** `app.js` (lines 13-14)
```javascript
const MIN_LATENCY = 800;   // ← Nhanh hơn: 300
const MAX_LATENCY = 1500;  // ← Nhanh hơn: 800
```

### Thay đổi grid columns
**File:** `styles.css` (line ~230)
```css
.results-grid {
    grid-template-columns: repeat(2, 1fr);  /* Mobile */
}

@media (min-width: 600px) {
    grid-template-columns: repeat(3, 1fr);  /* Tablet */
}
```

---

## 🔌 Tích hợp Backend

### Bước 1: Sửa `app.js`
Xóa function `mockFetch()` và để `apiCall()` dùng `fetch` thật:

```javascript
async function apiCall(url, options = {}) {
    const response = await fetch(url, {  // ← Fetch thật, không mock
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        ...options
    });
    
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
}
```

### Bước 2: Backend phải trả đúng format

**POST `/api/face-scan`**
```json
{
  "status": "ok",
  "scanId": "scan_20250127_143022",
  "results": [
    {
      "id": "img_01",
      "url": "https://cdn.example.com/photo1.jpg",
      "score": 0.95
    }
  ]
}
```

**POST `/api/print-job`**
```json
{
  "status": "ok",
  "printed": [
    {
      "id": "img_01",
      "printCode": "P-A12"
    }
  ]
}
```

### Bước 3: Deploy
- Upload folder lên web server
- Đảm bảo server chạy HTTPS (camera cần HTTPS)
- Config CORS nếu API ở domain khác

---

## ✅ Checklist trước khi deploy

- [ ] Test camera trên mobile thực
- [ ] Test upload fallback
- [ ] Test multi-select (chọn đủ MAX_SELECT)
- [ ] Test print simulation
- [ ] Test POS mode trên tablet
- [ ] Test fullscreen
- [ ] Test error handling (mock fail 10%)
- [ ] Test keyboard navigation (Tab + Enter)
- [ ] Test trên nhiều browser (Chrome, Safari, Firefox)
- [ ] Kiểm tra responsive ở các breakpoint
- [ ] Kiểm tra accessibility (screen reader)

---

## 📞 Support

Nếu cần hỗ trợ:
1. Đọc kỹ `README.md`
2. Check browser console (F12) để xem logs
3. Verify tất cả files trong đúng folder
4. Đảm bảo relative paths đúng

**Happy coding! 🚀**