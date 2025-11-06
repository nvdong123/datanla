// Toast notification function
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = '';
    let title = '';
    
    switch(type) {
        case 'success':
            icon = 'fa-circle-check';
            title = 'Thành công';
            break;
        case 'error':
            icon = 'fa-circle-xmark';
            title = 'Lỗi';
            break;
        case 'info':
            icon = 'fa-circle-info';
            title = 'Thông báo';
            break;
    }
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fa-solid ${icon} toast-icon"></i>
            <div class="toast-message">
                <div class="toast-title">${title}</div>
                <div class="toast-body">${message}</div>
            </div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
    
    // Click to remove
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    });
}

// Password toggle functionality
const togglePasswordBtn = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

togglePasswordBtn.addEventListener('click', () => {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    
    const icon = togglePasswordBtn.querySelector('i');
    icon.classList.toggle('fa-eye');
    icon.classList.toggle('fa-eye-slash');
});

// Login form submission
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    // Validation
    if (!username) {
        showToast('Vui lòng nhập tên đăng nhập', 'error');
        return;
    }
    
    if (!password) {
        showToast('Vui lòng nhập mật khẩu', 'error');
        return;
    }
    
    // Disable button during login
    const loginBtn = loginForm.querySelector('.btn-login');
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang đăng nhập...';
    
    try {
        // Send login request to server
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password, rememberMe })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            // Save session if remember me is checked
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('username', username);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('username');
            }
            
            // Save auth token or session
            sessionStorage.setItem('isAuthenticated', 'true');
            sessionStorage.setItem('username', username);
            
            showToast('Đăng nhập thành công!', 'success');
            
            // Redirect to staff page after 1 second
            setTimeout(() => {
                window.location.href = 'staff.html';
            }, 1000);
        } else {
            showToast(data.message || 'Tên đăng nhập hoặc mật khẩu không đúng', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('Không thể kết nối đến server', 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = originalText;
    }
});

// Auto-fill username if remembered
window.addEventListener('DOMContentLoaded', () => {
    const rememberMe = localStorage.getItem('rememberMe');
    const savedUsername = localStorage.getItem('username');
    
    if (rememberMe === 'true' && savedUsername) {
        document.getElementById('username').value = savedUsername;
        document.getElementById('rememberMe').checked = true;
        document.getElementById('password').focus();
    } else {
        document.getElementById('username').focus();
    }
});

// Enter key navigation
document.getElementById('username').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('password').focus();
    }
});
