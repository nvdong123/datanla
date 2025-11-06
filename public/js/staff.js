// Check authentication on page load
if (!sessionStorage.getItem('isAuthenticated')) {
    window.location.href = 'login.html';
}

const API_BASE = process.env.BASE_API_URL || 'http://localhost:3002';
let photos = [];
let eventSource = null;
let pollInterval = null;
let currentNotePhotoId = null;
let activeFilter = ''; // '' = all, 'IN_QUEUE', 'PRINTING', 'SUCCESS', 'ERROR', 'DELIVERED'

const el = {
    kpiTotal: document.getElementById('kpiTotal'),
    kpiPrinting: document.getElementById('kpiPrinting'),
    kpiReady: document.getElementById('kpiReady'),
    kpiError: document.getElementById('kpiError'),
    kpiDelivered: document.getElementById('kpiDelivered'),
    
    btnSimulateOrder: document.getElementById('btnSimulateOrder'),
    toggleAutoSimulate: document.getElementById('toggleAutoSimulate'),
    
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
    selectAll: document.getElementById('selectAll'),
    tableBody: document.getElementById('tableBody'),
    
    deliveredToggle: document.getElementById('deliveredToggle'),
    deliveredList: document.getElementById('deliveredList'),
    deliveredCount: document.getElementById('deliveredCount'),
    deliveredTableBody: document.getElementById('deliveredTableBody'),
    
    toastContainer: document.getElementById('toastContainer'),
    
    noteModal: document.getElementById('noteModal'),
    noteInput: document.getElementById('noteInput'),
    closeNoteModal: document.getElementById('closeNoteModal'),
    cancelNote: document.getElementById('cancelNote'),
    saveNote: document.getElementById('saveNote'),
    
    userDropdownBtn: document.getElementById('userDropdownBtn'),
    userDropdownMenu: document.getElementById('userDropdownMenu'),
    adminStatsBtn: document.getElementById('adminStatsBtn'),
    logoutBtn: document.getElementById('logoutBtn')
};

// Initialize
async function init() {
    console.log('Staff Dashboard initialized');
    
    await loadPhotos();
    connectSSE();
    setupEvents();
    setupKPIFilters();
    
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
        
        photos = await response.json();
        render();
        updateKPIs();
        
    } catch (error) {
        console.error('Load error:', error);
        showToast('Lỗi tải dữ liệu', 'error');
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
    };
    
    eventSource.addEventListener('photo_created', (e) => {
        const photo = JSON.parse(e.data);
        photos.push(photo);
        render();
        updateKPIs();
        showToast(`Đơn mới: ${photo.id}`, 'success');
    });
    
    eventSource.addEventListener('photo_updated', (e) => {
        const updatedPhoto = JSON.parse(e.data);
        const index = photos.findIndex(p => p.id === updatedPhoto.id);
        
        if (index !== -1) {
            const oldStatus = photos[index].status;
            photos[index] = updatedPhoto;
            
            // Notify on status change
            if (oldStatus !== updatedPhoto.status) {
                if (updatedPhoto.status === 'SUCCESS') {
                    showToast(`In xong: ${updatedPhoto.id}`, 'success', updatedPhoto.id);
                } else if (updatedPhoto.status === 'ERROR') {
                    showToast(`⚠️ Lỗi in: ${updatedPhoto.id}`, 'error', updatedPhoto.id);
                }
            }
            
            render();
            updateKPIs();
        }
    });
    
    eventSource.onerror = () => {
        console.error('SSE error');
        setTimeout(() => {
            if (!eventSource || eventSource.readyState === EventSource.CLOSED) {
                connectSSE();
            }
        }, 3002);
    };
}

// Setup KPI Filters
function setupKPIFilters() {
    const kpiCards = document.querySelectorAll('.kpi-card');
    
    kpiCards.forEach(card => {
        card.addEventListener('click', () => {
            const filter = card.dataset.filter || '';
            
            // Toggle active state
            if (activeFilter === filter) {
                activeFilter = '';
                kpiCards.forEach(c => c.classList.remove('active'));
            } else {
                activeFilter = filter;
                kpiCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            }
            
            // Update dropdown
            el.filterStatus.value = activeFilter;
            
            render();
        });
    });
}

// Setup events
function setupEvents() {
    el.btnSimulateOrder.addEventListener('click', createNewOrder);
    
    el.toggleAutoSimulate.addEventListener('change', async () => {
        const enabled = el.toggleAutoSimulate.checked;
        try {
            await fetch(`${API_BASE}/auto-simulate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enabled })
            });
            showToast(enabled ? 'Bật tự động in' : 'Tắt tự động in', 'success');
        } catch (error) {
            console.error('Auto-simulate error:', error);
        }
    });
    
    el.searchInput.addEventListener('input', render);
    el.filterStatus.addEventListener('change', () => {
        activeFilter = el.filterStatus.value;
        
        // Update KPI cards active state
        document.querySelectorAll('.kpi-card').forEach(card => {
            if (card.dataset.filter === activeFilter) {
                card.classList.add('active');
            } else {
                card.classList.remove('active');
            }
        });
        
        render();
    });
    
    el.deliveredToggle.addEventListener('click', () => {
        el.deliveredList.classList.toggle('hidden');
        el.deliveredToggle.classList.toggle('expanded');
    });
    
    // User dropdown
    el.userDropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        el.userDropdownMenu.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        el.userDropdownMenu.classList.add('hidden');
    });
    
    // Admin stats button
    el.adminStatsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showAdminStats();
        el.userDropdownMenu.classList.add('hidden');
    });
    
    // Logout button
    el.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sessionStorage.removeItem('isAuthenticated');
        sessionStorage.removeItem('username');
        showToast('Đã đăng xuất', 'info');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 500);
    });
    
    el.closeNoteModal.addEventListener('click', closeNoteModal);
    el.cancelNote.addEventListener('click', closeNoteModal);
    el.saveNote.addEventListener('click', saveNoteAction);
}

// Render
function render() {
    const searchTerm = el.searchInput.value.trim().toUpperCase();
    const statusFilter = activeFilter;
    
    // Nếu filter là DELIVERED, hiển thị tất cả photos
    // Nếu không, loại bỏ DELIVERED khỏi main table
    let filteredPhotos = statusFilter === 'DELIVERED' 
        ? photos.filter(p => p.status === 'DELIVERED')
        : photos.filter(p => p.status !== 'DELIVERED');
    
    if (searchTerm) {
        filteredPhotos = filteredPhotos.filter(p => p.id.includes(searchTerm));
    }
    
    if (statusFilter && statusFilter !== 'DELIVERED') {
        filteredPhotos = filteredPhotos.filter(p => p.status === statusFilter);
    }
    
    // Main table
    if (filteredPhotos.length === 0) {
        el.tableBody.innerHTML = '<tr><td colspan="9" class="empty-row">Không có dữ liệu</td></tr>';
    } else {
        el.tableBody.innerHTML = filteredPhotos
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .map(photo => createTableRow(photo))
            .join('');
    }
    
    // Delivered section
    const deliveredPhotos = photos.filter(p => p.status === 'DELIVERED');
    el.deliveredCount.textContent = deliveredPhotos.length;
    
    // Ẩn delivered section khi đang filter DELIVERED
    const deliveredSection = document.querySelector('.delivered-section');
    if (activeFilter === 'DELIVERED') {
        deliveredSection.classList.add('hidden');
    } else {
        deliveredSection.classList.remove('hidden');
    }
    
    if (deliveredPhotos.length === 0) {
        el.deliveredTableBody.innerHTML = '<tr><td colspan="4" class="empty-row">Chưa có đơn đã giao</td></tr>';
    } else {
        el.deliveredTableBody.innerHTML = deliveredPhotos
            .sort((a, b) => new Date(b.received_at) - new Date(a.received_at))
            .map(photo => createDeliveredRow(photo))
            .join('');
    }
}

function createTableRow(photo) {
    const statusClass = `status-${photo.status.toLowerCase().replace('_', '-')}`;
    const statusLabels = {
        'IN_QUEUE': 'Chờ in',
        'PRINTING': 'Đang in',
        'SUCCESS': 'Sẵn sàng',
        'ERROR': 'Lỗi',
        'DELIVERED': 'Đã giao'
    };
    
    const time = new Date(photo.updated_at).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const paidDisabled = photo.paid ? 'disabled' : '';
    const paidOnlineBadge = photo.paid_online ? '<span class="paid-online-badge"><i class="fa-solid fa-circle-check"></i>ONL</span>' : '';
    
    // Chỉ cho phép giao khi đã thanh toán VÀ trạng thái SUCCESS
    const canDeliver = photo.paid && photo.status === 'SUCCESS';
    const deliverDisabled = !canDeliver ? 'disabled' : '';
    const deliverTitle = !photo.paid ? 'Chưa thanh toán' : 
                        photo.status !== 'SUCCESS' ? 'Chưa sẵn sàng' : 
                        'Đánh dấu đã giao';
    
    // Nếu đã giao thì ẩn hết các nút thao tác
    const actionsHtml = photo.status === 'DELIVERED' ? '—' : `
        <div class="row-actions">
            <button class="btn-icon btn-deliver" 
                ${deliverDisabled}
                onclick="markDelivered('${escapeHtml(photo.id)}')"
                title="${deliverTitle}">
                <i class="fa-solid fa-check"></i>
            </button>
            <button class="btn-icon btn-reprint" 
                onclick="reprintPhoto('${escapeHtml(photo.id)}')"
                title="In lại">
                <i class="fa-solid fa-print"></i>
            </button>
            <button class="btn-icon btn-error" 
                onclick="markError('${escapeHtml(photo.id)}')"
                title="Đánh dấu lỗi">
                <i class="fa-solid fa-triangle-exclamation"></i>
            </button>
            <button class="btn-icon btn-note" 
                onclick="openNoteModal('${escapeHtml(photo.id)}')"
                title="Ghi chú">
                <i class="fa-solid fa-note-sticky"></i>
            </button>
        </div>
    `;
    
    return `
        <tr data-id="${escapeHtml(photo.id)}">
            <td>
                <input type="checkbox" class="row-checkbox">
            </td>
            <td><strong>${escapeHtml(photo.id)}</strong></td>
            <td>${escapeHtml(photo.customer_name || '—')}</td>
            <td>${formatPrice(photo.price)}</td>
            <td>
                <input type="checkbox" class="paid-toggle" 
                    ${photo.paid ? 'checked' : ''} 
                    ${paidDisabled}
                    onchange="togglePaid('${escapeHtml(photo.id)}', this.checked)">
                ${paidOnlineBadge}
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${statusLabels[photo.status]}
                </span>
            </td>
            <td>${photo.attempts || 0}</td>
            <td>${time}</td>
            <td>
                ${actionsHtml}
            </td>
        </tr>
    `;
}

function createDeliveredRow(photo) {
    const time = new Date(photo.received_at).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `
        <tr>
            <td><strong>${escapeHtml(photo.id)}</strong></td>
            <td>${escapeHtml(photo.customer_name || '—')}</td>
            <td>${formatPrice(photo.price)}</td>
            <td>${time}</td>
        </tr>
    `;
}

// Update KPIs
function updateKPIs() {
    const today = photos; // In real app, filter by created_at date
    
    el.kpiTotal.textContent = today.length;
    el.kpiPrinting.textContent = today.filter(p => p.status === 'PRINTING').length;
    el.kpiReady.textContent = today.filter(p => p.status === 'SUCCESS').length;
    el.kpiError.textContent = today.filter(p => p.status === 'ERROR').length;
    el.kpiDelivered.textContent = today.filter(p => p.status === 'DELIVERED').length;
}

// Actions
async function createNewOrder() {
    try {
        // Tìm số lớn nhất trong danh sách ID hiện có
        let maxNumber = 0;
        photos.forEach(photo => {
            // Extract số từ ID (P-001 -> 1, P-045 -> 45)
            const match = photo.id.match(/P-(\d+)/);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNumber) {
                    maxNumber = num;
                }
            }
        });
        
        // Tạo ID mới với số lớn hơn
        const newNumber = maxNumber + 1;
        const newId = `P-${String(newNumber).padStart(3, '0')}`;
        
        const response = await fetch(`${API_BASE}/photos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: newId })
        });
        
        if (!response.ok) throw new Error('Failed to create');
        
        const photo = await response.json();
        showToast(`Tạo đơn: ${photo.id}`, 'success');
        
    } catch (error) {
        console.error('Create error:', error);
        showToast('Lỗi tạo đơn', 'error');
    }
}

window.togglePaid = async function(id, paid) {
    // Nếu đã paid rồi thì không cho uncheck
    const photo = photos.find(p => p.id === id);
    if (photo && photo.paid && !paid) {
        showToast('Không thể bỏ thanh toán đã xác nhận', 'error');
        render(); // Re-render to reset checkbox
        return;
    }
    
    try {
        await fetch(`${API_BASE}/photos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paid })
        });
        
        if (paid) {
            showToast('Đã xác nhận thanh toán', 'success');
        }
    } catch (error) {
        console.error('Toggle paid error:', error);
        showToast('Lỗi cập nhật thanh toán', 'error');
    }
};

window.markDelivered = async function(id) {
    const photo = photos.find(p => p.id === id);
    
    if (!photo.paid) {
        showToast('Khách chưa thanh toán!', 'error');
        return;
    }
    
    if (photo.status !== 'SUCCESS') {
        showToast('Ảnh chưa sẵn sàng!', 'error');
        return;
    }
    
    if (!confirm(`Xác nhận khách đã nhận ảnh ${id}?`)) return;
    
    try {
        await fetch(`${API_BASE}/photos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'DELIVERED' })
        });
        
        showToast(`Đã giao: ${id}`, 'success');
        
    } catch (error) {
        console.error('Deliver error:', error);
        showToast('Lỗi đánh dấu đã giao', 'error');
    }
};

window.reprintPhoto = async function(id) {
    try {
        await fetch(`${API_BASE}/photos/${id}/reprint`, {
            method: 'POST'
        });
        
        showToast(`Đang in lại: ${id}`, 'success');
        
    } catch (error) {
        console.error('Reprint error:', error);
        showToast('Lỗi in lại', 'error');
    }
};

window.markError = async function(id) {
    const reason = prompt('Lý do lỗi:');
    if (!reason) return;
    
    try {
        await fetch(`${API_BASE}/photos/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: 'ERROR',
                note: `Lỗi: ${reason}`
            })
        });
        
        showToast(`Đánh dấu lỗi: ${id}`, 'success');
        
    } catch (error) {
        console.error('Mark error:', error);
        showToast('Lỗi cập nhật', 'error');
    }
};

window.openNoteModal = function(id) {
    currentNotePhotoId = id;
    el.noteInput.value = '';
    el.noteModal.classList.remove('hidden');
};

function closeNoteModal() {
    el.noteModal.classList.add('hidden');
    currentNotePhotoId = null;
}

async function saveNoteAction() {
    const note = el.noteInput.value.trim();
    if (!note || !currentNotePhotoId) return;
    
    try {
        await fetch(`${API_BASE}/photos/${currentNotePhotoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note })
        });
        
        showToast('Đã lưu ghi chú', 'success');
        closeNoteModal();
        
    } catch (error) {
        console.error('Save note error:', error);
        showToast('Lỗi lưu ghi chú', 'error');
    }
}

// Toast
function showToast(message, type = 'success', photoId = null) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation';
    
    toast.innerHTML = `
        <div class="toast-content">
            <div class="toast-icon">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="toast-message">
                <div class="toast-title">${escapeHtml(message)}</div>
                ${photoId ? `<div class="toast-body">Click để xem chi tiết</div>` : ''}
            </div>
        </div>
    `;
    
    if (photoId) {
        toast.style.cursor = 'pointer';
        toast.addEventListener('click', () => {
            highlightRow(photoId);
            toast.remove();
        });
    }
    
    el.toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function highlightRow(photoId) {
    const row = el.tableBody.querySelector(`[data-id="${photoId}"]`);
    if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.style.background = 'rgba(22, 163, 74, 0.1)';
        setTimeout(() => {
            row.style.background = '';
        }, 2000);
    }
}

// Utils
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { 
        style: 'currency', 
        currency: 'VND' 
    }).format(price);
}

// Admin Stats
function showAdminStats() {
    const totalRevenue = photos
        .filter(p => p.paid)
        .reduce((sum, p) => sum + p.price, 0);
    
    const deliveredRevenue = photos
        .filter(p => p.status === 'DELIVERED')
        .reduce((sum, p) => sum + p.price, 0);
    
    const errorPhotos = photos.filter(p => p.status === 'ERROR');
    const errorCount = errorPhotos.length;
    
    // Thống kê lỗi
    const errorStats = {};
    errorPhotos.forEach(photo => {
        const errorMsg = photo.note || 'Không rõ lý do';
        errorStats[errorMsg] = (errorStats[errorMsg] || 0) + 1;
    });
    
    const errorList = Object.entries(errorStats)
        .map(([msg, count]) => `<li><strong>${count}x</strong> - ${escapeHtml(msg)}</li>`)
        .join('') || '<li>Không có lỗi</li>';
    
    const statsHtml = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3><i class="fa-solid fa-chart-line"></i> Thống kê & Báo cáo</h3>
                <button class="btn-close" onclick="closeAdminStats()">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                    <div>
                        <h4 style="color: var(--primary); margin-bottom: 0.5rem;">
                            <i class="fa-solid fa-sack-dollar"></i> Doanh thu
                        </h4>
                        <p style="font-size: 1.25rem; margin: 0;">
                            <strong>Đã thanh toán:</strong> ${formatPrice(totalRevenue)}
                        </p>
                        <p style="font-size: 1.25rem; margin: 0.25rem 0 0 0;">
                            <strong>Đã giao:</strong> ${formatPrice(deliveredRevenue)}
                        </p>
                    </div>
                    
                    <div>
                        <h4 style="color: var(--info); margin-bottom: 0.5rem;">
                            <i class="fa-solid fa-chart-pie"></i> KPI
                        </h4>
                        <p style="margin: 0;">
                            <strong>Tổng đơn:</strong> ${photos.length}
                        </p>
                        <p style="margin: 0.25rem 0 0 0;">
                            <strong>Hoàn thành:</strong> ${photos.filter(p => p.status === 'DELIVERED').length} 
                            (${((photos.filter(p => p.status === 'DELIVERED').length / photos.length) * 100 || 0).toFixed(1)}%)
                        </p>
                        <p style="margin: 0.25rem 0 0 0;">
                            <strong>Tỷ lệ lỗi:</strong> ${errorCount} 
                            (${((errorCount / photos.length) * 100 || 0).toFixed(1)}%)
                        </p>
                    </div>
                    
                    <div>
                        <h4 style="color: var(--danger); margin-bottom: 0.5rem;">
                            <i class="fa-solid fa-triangle-exclamation"></i> Thống kê lỗi (${errorCount})
                        </h4>
                        <ul style="margin: 0; padding-left: 1.5rem;">
                            ${errorList}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-primary" onclick="closeAdminStats()">Đóng</button>
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'adminStatsModal';
    modal.innerHTML = statsHtml;
    document.body.appendChild(modal);
}

window.closeAdminStats = function() {
    const modal = document.getElementById('adminStatsModal');
    if (modal) modal.remove();
};

// Start
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}