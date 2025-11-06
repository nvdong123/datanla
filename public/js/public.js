const API_BASE = 'http://localhost:3002';
let photos = [];
let eventSource = null;
let pollInterval = null;
let lastUpdateTime = null;
let highlightedId = null;
let highlightTimeout = null;

const el = {
    readyGrid: document.getElementById('readyGrid'),
    printingList: document.getElementById('printingList'),
    readyCount: document.getElementById('readyCount'),
    printingCount: document.getElementById('printingCount'),
    lastUpdate: document.getElementById('lastUpdate'),
    searchInput: document.getElementById('searchInput'),
    clearSearch: document.getElementById('clearSearch'),
    connectionStatus: document.getElementById('connectionStatus')
};

// Initialize
async function init() {
    console.log('Public Display initialized');
    
    await loadPhotos();
    connectSSE();
    setupSearch();
    
    // Fallback polling
    pollInterval = setInterval(() => {
        if (!eventSource || eventSource.readyState !== EventSource.OPEN) {
            loadPhotos();
        }
    }, 5000);
}

// Load photos
async function loadPhotos() {
    try {
        const response = await fetch(`${API_BASE}/photos`);
        if (!response.ok) throw new Error('Failed to fetch');
        
        const newPhotos = await response.json();
        
        // Detect new SUCCESS photos for highlight
        const oldSuccessIds = new Set(photos.filter(p => p.status === 'SUCCESS').map(p => p.id));
        const newSuccessIds = newPhotos.filter(p => p.status === 'SUCCESS').map(p => p.id);
        const brandNewSuccess = newSuccessIds.find(id => !oldSuccessIds.has(id));
        
        photos = newPhotos;
        lastUpdateTime = new Date();
        
        render();
        updateTime();
        hideConnectionError();
        
        // Highlight new success
        if (brandNewSuccess) {
            highlightNewItem(brandNewSuccess);
        }
        
    } catch (error) {
        console.error('Load error:', error);
        showConnectionError();
    }
}

// Connect SSE
function connectSSE() {
    if (eventSource) {
        eventSource.close();
    }
    
    eventSource = new EventSource(`${API_BASE}/events`);
    
    eventSource.onopen = () => {
        console.log('SSE connected');
        hideConnectionError();
    };
    
    eventSource.addEventListener('photo_created', (e) => {
        const photo = JSON.parse(e.data);
        photos.push(photo);
        render();
    });
    
    eventSource.addEventListener('photo_updated', (e) => {
        const updatedPhoto = JSON.parse(e.data);
        const index = photos.findIndex(p => p.id === updatedPhoto.id);
        
        if (index !== -1) {
            const oldStatus = photos[index].status;
            photos[index] = updatedPhoto;
            
            // Highlight if newly SUCCESS
            if (oldStatus !== 'SUCCESS' && updatedPhoto.status === 'SUCCESS') {
                highlightNewItem(updatedPhoto.id);
            }
            
            render();
        }
    });
    
    eventSource.onerror = () => {
        console.error('SSE error');
        showConnectionError();
        
        setTimeout(() => {
            if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
                connectSSE();
            }
        }, 3002);
    };
}

// Render
function render() {
    const searchTerm = el.searchInput ? el.searchInput.value.trim().toUpperCase() : '';
    
    // Filter: exclude DELIVERED, optionally filter by search
    let visiblePhotos = photos.filter(p => p.status !== 'DELIVERED');
    
    if (searchTerm) {
        visiblePhotos = visiblePhotos.filter(p => p.id.includes(searchTerm));
    }
    
    const readyPhotos = visiblePhotos.filter(p => p.status === 'SUCCESS');
    const printingPhotos = visiblePhotos.filter(p => p.status === 'PRINTING');
    
    // Ready section
    el.readyCount.textContent = readyPhotos.length;
    
    if (readyPhotos.length === 0) {
        el.readyGrid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>Chưa có ảnh sẵn sàng</p>
            </div>
        `;
    } else {
        el.readyGrid.innerHTML = readyPhotos
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map(photo => createPhotoCard(photo))
            .join('');
    }
    
    // Printing section
    el.printingCount.textContent = printingPhotos.length;
    
    if (printingPhotos.length === 0) {
        el.printingList.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>Không có ảnh đang in</p>
            </div>
        `;
    } else {
        el.printingList.innerHTML = printingPhotos
            .map(photo => createPrintingItem(photo))
            .join('');
    }
}

function createPhotoCard(photo) {
    const isHighlighted = photo.id === highlightedId;
    const time = new Date(photo.updated_at).toLocaleTimeString('vi-VN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    return `
        <div class="photo-card ${isHighlighted ? 'highlighted' : ''}" data-id="${escapeHtml(photo.id)}">
            <div class="photo-card-icon">
                <i class="fa-solid fa-circle-check"></i>
            </div>
            <div class="photo-card-content">
                <div class="photo-card-id">${escapeHtml(photo.id)}</div>
                <div class="photo-card-time">${time}</div>
            </div>
        </div>
    `;
}

function createPrintingItem(photo) {
    return `
        <div class="printing-item">
            <div class="printing-spinner">
                <i class="fa-solid fa-spinner"></i>
            </div>
            <div class="printing-item-id">${escapeHtml(photo.id)}</div>
        </div>
    `;
}

// Highlight new item
function highlightNewItem(photoId) {
    if (highlightTimeout) clearTimeout(highlightTimeout);
    
    highlightedId = photoId;
    render();
    
    highlightTimeout = setTimeout(() => {
        highlightedId = null;
        render();
    }, 8000);
}

// Search
function setupSearch() {
    if (!el.searchInput || !el.clearSearch) {
        console.log('Search elements not found, skipping search setup');
        return;
    }
    
    el.searchInput.addEventListener('input', () => {
        const hasValue = el.searchInput.value.trim().length > 0;
        el.clearSearch.classList.toggle('hidden', !hasValue);
        render();
    });
    
    el.clearSearch.addEventListener('click', () => {
        el.searchInput.value = '';
        el.clearSearch.classList.add('hidden');
        render();
    });
}

// Update time
function updateTime() {
    if (lastUpdateTime) {
        el.lastUpdate.textContent = lastUpdateTime.toLocaleTimeString('vi-VN');
    }
}

setInterval(updateTime, 1000);

// Connection status
function showConnectionError() {
    if (el.connectionStatus) {
        el.connectionStatus.classList.remove('hidden');
    }
}

function hideConnectionError() {
    if (el.connectionStatus) {
        el.connectionStatus.classList.add('hidden');
    }
}

// Escape HTML
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}