/* Datanla Photo Booth - Auto Face Detection */

const CONFIG = {
    MAX_SELECT: 10,
    PRICE_PER_PHOTO: 20000,
    AUTO_DETECT: true,
    DETECT_INTERVAL: 600,
    DETECT_TIMEOUT: 10000
};

const state = {
    page: 'welcome',
    stream: null,
    detectInterval: null,
    detectTimeout: null,
    isScanning: false,
    progress: 0,
    lastCapture: 0,
    selectedPhotos: new Set(),
    photos: [],
    pickupCode: null
};

const el = {
    pageWelcome: document.getElementById('page-welcome'),
    pageScan: document.getElementById('page-scan'),
    pageUpload: document.getElementById('page-upload'),
    pageResults: document.getElementById('page-results'),
    pageConfirmation: document.getElementById('page-confirmation'),
    
    btnStartScan: document.getElementById('btnStartScan'),
    btnUploadPhoto: document.getElementById('btnUploadPhoto'),
    
    btnBackFromScan: document.getElementById('btnBackFromScan'),
    videoPreview: document.getElementById('videoPreview'),
    captureCanvas: document.getElementById('captureCanvas'),
    scanProgress: document.getElementById('scanProgress'),
    progressBar: document.getElementById('progressBar'),
    progressPercent: document.getElementById('progressPercent'),
    progressLabel: document.getElementById('progressLabel'),
    scanGuide: document.getElementById('scanGuide'),
    cameraError: document.getElementById('cameraError'),
    btnManualCapture: document.getElementById('btnManualCapture'),
    
    btnBackFromUpload: document.getElementById('btnBackFromUpload'),
    fileInput: document.getElementById('fileInput'),
    btnSelectFile: document.getElementById('btnSelectFile'),
    uploadPreview: document.getElementById('uploadPreview'),
    uploadPreviewImage: document.getElementById('uploadPreviewImage'),
    btnUploadAndScan: document.getElementById('btnUploadAndScan'),
    
    btnBackFromResults: document.getElementById('btnBackFromResults'),
    photoCount: document.getElementById('photoCount'),
    photosGrid: document.getElementById('photosGrid'),
    actionBar: document.getElementById('actionBar'),
    selectedCount: document.getElementById('selectedCount'),
    btnClear: document.getElementById('btnClear'),
    btnPrint: document.getElementById('btnPrint'),
    
    pickupCodeDisplay: document.getElementById('pickupCodeDisplay'),
    totalPhotos: document.getElementById('totalPhotos'),
    entryTime: document.getElementById('entryTime'),
    totalAmount: document.getElementById('totalAmount'),
    btnCopyCode: document.getElementById('btnCopyCode'),
    btnDone: document.getElementById('btnDone'),
    btnScanMore: document.getElementById('btnScanMore'),
    
    loadingModal: document.getElementById('loadingModal'),
    loadingText: document.getElementById('loadingText'),
    errorModal: document.getElementById('errorModal'),
    errorTitle: document.getElementById('errorTitle'),
    errorMessage: document.getElementById('errorMessage'),
    btnRetry: document.getElementById('btnRetry'),
    btnCancelError: document.getElementById('btnCancelError'),
    
    lightbox: document.getElementById('lightbox'),
    lightboxImage: document.getElementById('lightboxImage'),
    btnCloseLightbox: document.getElementById('btnCloseLightbox'),
    
    toastContainer: document.getElementById('toastContainer'),
    btnTogglePOS: document.getElementById('btnTogglePOS'),
    btnFullscreen: document.getElementById('btnFullscreen')
};

function navigateTo(page) {
    console.log('Navigate to:', page);
    
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pageEl = document.getElementById(`page-${page}`);
    if (pageEl) {
        pageEl.classList.add('active');
        state.page = page;
        
        if (page === 'scan') {
            initCamera();
        } else {
            stopCamera();
        }
    }
}

async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } }
        });
        
        state.stream = stream;
        el.videoPreview.srcObject = stream;
        el.cameraError.classList.add('hidden');
        
        console.log('Camera initialized');
        
        el.videoPreview.addEventListener('loadeddata', () => {
            if (CONFIG.AUTO_DETECT) {
                startAutoDetect();
            } else {
                el.btnManualCapture.classList.remove('hidden');
            }
        }, { once: true });
        
    } catch (error) {
        console.error('Camera error:', error);
        el.cameraError.classList.remove('hidden');
        showToast('Không thể truy cập camera', 'error');
    }
}

function stopCamera() {
    if (state.stream) {
        state.stream.getTracks().forEach(t => t.stop());
        state.stream = null;
    }
    stopAutoDetect();
}

function startAutoDetect() {
    if (state.isScanning) return;
    
    state.isScanning = true;
    state.progress = 0;
    
    el.scanGuide.classList.add('hidden');
    el.scanProgress.classList.remove('hidden');
    updateProgress(0, 'Đang tìm...');
    
    state.detectInterval = setInterval(runDetect, CONFIG.DETECT_INTERVAL);
    
    state.detectTimeout = setTimeout(() => {
        if (state.progress < 100) {
            el.btnManualCapture.classList.remove('hidden');
            updateProgress(state.progress, 'Nhấn nút để chụp');
        }
    }, CONFIG.DETECT_TIMEOUT);
}

function stopAutoDetect() {
    if (state.detectInterval) clearInterval(state.detectInterval);
    if (state.detectTimeout) clearTimeout(state.detectTimeout);
    state.isScanning = false;
    if (el.scanProgress) el.scanProgress.classList.add('hidden');
}

function runDetect() {
    const now = Date.now();
    if (now - state.lastCapture < 3000) return;
    
    state.progress += Math.random() * 12 + 8;
    if (state.progress > 100) state.progress = 100;
    
    updateProgress(state.progress, 'Đang phân tích...');
    
    const threshold = state.progress >= 70 ? 0.8 : 0.2;
    const detected = Math.random() < threshold;
    
    if (detected && state.progress >= 70) {
        console.log('Face detected!');
        updateProgress(100, 'Phát hiện thành công!');
        
        setTimeout(() => {
            captureAndScan();
        }, 600);
    }
}

function updateProgress(percent, label) {
    const circumference = 2 * Math.PI * 52;
    const offset = circumference - (percent / 100) * circumference;
    
    if (el.progressBar) {
        el.progressBar.style.strokeDasharray = `${circumference} ${circumference}`;
        el.progressBar.style.strokeDashoffset = offset;
    }
    if (el.progressPercent) el.progressPercent.textContent = `${Math.round(percent)}%`;
    if (el.progressLabel) el.progressLabel.textContent = label;
}

function captureAndScan() {
    state.lastCapture = Date.now();
    
    const canvas = el.captureCanvas;
    const ctx = canvas.getContext('2d');
    
    canvas.width = el.videoPreview.videoWidth;
    canvas.height = el.videoPreview.videoHeight;
    ctx.drawImage(el.videoPreview, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg', 0.85);
    
    console.log('Captured, scanning...');
    stopAutoDetect();
    
    performFaceScan(imageData);
}

async function performFaceScan(imageData) {
    showLoading('Đang quét khuôn mặt...');
    
    try {
        await delay(Math.random() * 600 + 900);
        
        if (Math.random() < 0.1) {
            throw new Error('Không tìm thấy khuôn mặt');
        }
        
        const photos = generateMockPhotos();
        state.photos = photos;
        
        hideLoading();
        showToast(`Tìm thấy ${photos.length} ảnh!`, 'success');
        
        navigateTo('results');
        renderPhotos();
        
    } catch (error) {
        console.error('Scan error:', error);
        hideLoading();
        showError('Quét thất bại', error.message, () => {
            hideError();
            navigateTo('scan');
        });
    }
}

function generateMockPhotos() {
    const photos = [];
    
    for (let i = 1; i <= 6; i++) {
        // Sử dụng ảnh demo từ thư mục assets/images
        const imageUrl = `/assets/images/demo${i}.svg`;
        
        photos.push({
            id: `IMG_${String(i).padStart(3,'0')}`,
            url: imageUrl,
            score: (0.95 - (i-1) * 0.05).toFixed(2),
            price: CONFIG.PRICE_PER_PHOTO
        });
    }
    
    return photos;
}

async function submitPrintJob() {
    if (state.selectedPhotos.size === 0) return;
    
    showLoading('Đang gửi lệnh in...');
    
    try {
        await delay(Math.random() * 600 + 900);
        
        if (Math.random() < 0.1) {
            throw new Error('Máy in đang bận');
        }
        
        const codes = ['P-A12', 'P-A13', 'P-B05', 'P-B06', 'P-C07'];
        state.pickupCode = codes[Math.floor(Math.random() * codes.length)];
        
        hideLoading();
        showConfirmation();
        
    } catch (error) {
        console.error('Print error:', error);
        hideLoading();
        showError('In thất bại', error.message, submitPrintJob);
    }
}

function renderPhotos() {
    el.photoCount.textContent = `${state.photos.length} ảnh`;
    el.photosGrid.innerHTML = '';
    
    state.photos.forEach(photo => {
        const card = createPhotoCard(photo);
        el.photosGrid.appendChild(card);
    });
}

function createPhotoCard(photo) {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.dataset.id = photo.id;
    
    card.innerHTML = `
        <img src="${photo.url}" alt="${photo.id}" loading="lazy">
        <div class="photo-score">${Math.round(photo.score * 100)}%</div>
        <div class="photo-id">${photo.id}</div>
        <div class="photo-price">${formatPrice(photo.price)}</div>
        <div class="photo-overlay">
            <div class="check-icon">
                <i class="fa-solid fa-check"></i>
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => togglePhoto(photo.id));
    
    const img = card.querySelector('img');
    img.addEventListener('click', (e) => {
        e.stopPropagation();
        showLightbox(photo.url);
    });
    
    return card;
}

function togglePhoto(id) {
    if (state.selectedPhotos.has(id)) {
        state.selectedPhotos.delete(id);
    } else {
        if (state.selectedPhotos.size >= CONFIG.MAX_SELECT) {
            showToast(`Chỉ chọn tối đa ${CONFIG.MAX_SELECT} ảnh`, 'error');
            return;
        }
        state.selectedPhotos.add(id);
    }
    
    updatePhotoSelection(id);
    updateActionBar();
}

function updatePhotoSelection(id) {
    const card = el.photosGrid.querySelector(`[data-id="${id}"]`);
    if (!card) return;
    
    if (state.selectedPhotos.has(id)) {
        card.classList.add('selected');
    } else {
        card.classList.remove('selected');
    }
}

function updateActionBar() {
    const count = state.selectedPhotos.size;
    
    if (count > 0) {
        el.actionBar.classList.remove('hidden');
        el.selectedCount.textContent = `${count} ảnh đã chọn`;
    } else {
        el.actionBar.classList.add('hidden');
    }
}

function clearSelection() {
    state.selectedPhotos.clear();
    el.photosGrid.querySelectorAll('.photo-card').forEach(card => {
        card.classList.remove('selected');
    });
    updateActionBar();
}

function showConfirmation() {
    const count = state.selectedPhotos.size;
    const total = count * CONFIG.PRICE_PER_PHOTO;
    const now = new Date();
    
    el.pickupCodeDisplay.textContent = state.pickupCode;
    el.totalPhotos.textContent = `${count} ảnh`;
    el.entryTime.textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    el.totalAmount.textContent = formatPrice(total);
    
    navigateTo('confirmation');
}

function showLoading(text) {
    el.loadingText.textContent = text;
    el.loadingModal.classList.remove('hidden');
}

function hideLoading() {
    el.loadingModal.classList.add('hidden');
}

function showError(title, message, retryFn) {
    el.errorTitle.textContent = title;
    el.errorMessage.textContent = message;
    el.errorModal.classList.remove('hidden');
    
    if (retryFn) {
        el.btnRetry.onclick = () => {
            hideError();
            retryFn();
        };
        el.btnRetry.style.display = 'inline-flex';
    } else {
        el.btnRetry.style.display = 'none';
    }
}

function hideError() {
    el.errorModal.classList.add('hidden');
}

function showLightbox(url) {
    el.lightboxImage.src = url;
    el.lightbox.classList.remove('hidden');
}

function hideLightbox() {
    el.lightbox.classList.add('hidden');
}

function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    el.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Đã sao chép mã!', 'success');
        });
    } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Đã sao chép mã!', 'success');
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function delay(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Vui lòng chọn file ảnh', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        el.uploadPreviewImage.src = e.target.result;
        el.uploadPreview.classList.remove('hidden');
        el.btnUploadAndScan.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
}

function initEvents() {
    el.btnStartScan.addEventListener('click', () => navigateTo('scan'));
    el.btnUploadPhoto.addEventListener('click', () => navigateTo('upload'));
    
    el.btnBackFromScan.addEventListener('click', () => {
        stopCamera();
        navigateTo('welcome');
    });
    el.btnManualCapture.addEventListener('click', captureAndScan);
    
    el.btnBackFromUpload.addEventListener('click', () => navigateTo('welcome'));
    el.btnSelectFile.addEventListener('click', () => el.fileInput.click());
    el.fileInput.addEventListener('change', handleFileUpload);
    el.btnUploadAndScan.addEventListener('click', () => {
        const imgSrc = el.uploadPreviewImage.src;
        if (imgSrc) {
            performFaceScan(imgSrc);
        }
    });
    
    el.btnBackFromResults.addEventListener('click', () => {
        clearSelection();
        navigateTo('scan');
    });
    el.btnClear.addEventListener('click', clearSelection);
    el.btnPrint.addEventListener('click', submitPrintJob);
    
    el.btnCopyCode.addEventListener('click', () => copyToClipboard(state.pickupCode));
    el.btnDone.addEventListener('click', () => {
        clearSelection();
        navigateTo('welcome');
    });
    el.btnScanMore.addEventListener('click', () => {
        clearSelection();
        navigateTo('scan');
    });
    
    el.btnCancelError.addEventListener('click', hideError);
    el.btnCloseLightbox.addEventListener('click', hideLightbox);
    el.lightbox.addEventListener('click', (e) => {
        if (e.target === el.lightbox) hideLightbox();
    });
    
    el.btnTogglePOS.addEventListener('click', () => {
        document.body.classList.toggle('pos-mode');
        showToast('POS Mode toggled', 'success');
    });
    
    el.btnFullscreen.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!el.lightbox.classList.contains('hidden')) {
                hideLightbox();
            } else if (!el.errorModal.classList.contains('hidden')) {
                hideError();
            }
        }
    });
}

function init() {
    console.log('=== Datanla Photo Booth v2.0 ===');
    console.log('Auto detection:', CONFIG.AUTO_DETECT);
    initEvents();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}