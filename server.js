const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// SSE clients storage
let sseClients = [];

// Auto-simulate printing state
let autoSimulateEnabled = false;
let autoSimulateInterval = null;

// Helper: Read data
async function readData() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    return { photos: [] };
  }
}

// Helper: Write data atomically
async function writeData(data) {
  const tempFile = DATA_FILE + '.tmp';
  await fs.writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tempFile, DATA_FILE);
}

// Helper: Emit SSE event
function emitEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(client => {
    try {
      client.write(payload);
    } catch (err) {
      console.error('SSE write error:', err);
    }
  });
}

// Helper: Add log entry
function addLog(photo, action, message) {
  photo.logs = photo.logs || [];
  photo.logs.push({
    ts: new Date().toISOString(),
    action,
    message
  });
}

// Helper: Simulate printing
async function simulatePrinting(photoId) {
  const delay = Math.floor(Math.random() * 12000) + 3000; // 3-15s
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  const data = await readData();
  const photo = data.photos.find(p => p.id === photoId);
  
  if (!photo || photo.status !== 'PRINTING') return;
  
  photo.attempts = (photo.attempts || 0) + 1;
  const success = Math.random() < 0.8; // 80% success
  
  if (success) {
    photo.status = 'SUCCESS';
    addLog(photo, 'PRINT_SUCCESS', `In thành công (lần ${photo.attempts})`);
  } else {
    photo.status = 'ERROR';
    addLog(photo, 'PRINT_ERROR', `Lỗi in (lần ${photo.attempts})`);
  }
  
  photo.updated_at = new Date().toISOString();
  
  await writeData(data);
  emitEvent('photo_updated', photo);
}

// GET /health
app.get('/health', (req, res) => {
  res.json({ status: 'ok', autoSimulate: autoSimulateEnabled });
});

// GET /photos
app.get('/photos', async (req, res) => {
  try {
    const data = await readData();
    res.json(data.photos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /photos
app.post('/photos', async (req, res) => {
  try {
    const data = await readData();
    
    // Sử dụng ID từ request hoặc tạo tự động
    let photoId;
    if (req.body.id) {
      photoId = req.body.id;
    } else {
      // Tìm số lớn nhất trong danh sách
      let maxNumber = 0;
      data.photos.forEach(photo => {
        const match = photo.id.match(/P-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) {
            maxNumber = num;
          }
        }
      });
      photoId = `P-${String(maxNumber + 1).padStart(3, '0')}`;
    }
    
    const newPhoto = {
      id: photoId,
      status: 'IN_QUEUE',
      price: Math.floor(Math.random() * 3 + 1) * 20000,
      paid: Math.random() < 0.7,
      paid_online: false,
      customer_name: `Khách ${Math.floor(Math.random() * 100)}`,
      thumbnail: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      attempts: 0,
      logs: [{
        ts: new Date().toISOString(),
        action: 'CREATED',
        message: 'Đơn được tạo'
      }],
      received_at: null
    };
    
    data.photos.push(newPhoto);
    await writeData(data);
    
    emitEvent('photo_created', newPhoto);
    res.json(newPhoto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /photos/:id
app.patch('/photos/:id', async (req, res) => {
  try {
    const data = await readData();
    const photo = data.photos.find(p => p.id === req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    const updates = req.body;
    
    if (updates.status) {
      photo.status = updates.status;
      addLog(photo, 'STATUS_CHANGED', `Trạng thái: ${updates.status}`);
      
      if (updates.status === 'DELIVERED') {
        photo.received_at = new Date().toISOString();
        addLog(photo, 'DELIVERED', 'Khách đã nhận ảnh');
      }
    }
    
    if (updates.paid !== undefined) {
      photo.paid = updates.paid;
      addLog(photo, 'PAYMENT_UPDATED', `Đã thanh toán: ${updates.paid ? 'Có' : 'Chưa'}`);
    }
    
    if (updates.note) {
      addLog(photo, 'NOTE_ADDED', updates.note);
    }
    
    photo.updated_at = new Date().toISOString();
    
    await writeData(data);
    emitEvent('photo_updated', photo);
    
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /photos/:id/print
app.post('/photos/:id/print', async (req, res) => {
  try {
    const data = await readData();
    const photo = data.photos.find(p => p.id === req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    photo.status = 'PRINTING';
    photo.updated_at = new Date().toISOString();
    addLog(photo, 'PRINT_STARTED', 'Bắt đầu in');
    
    await writeData(data);
    emitEvent('photo_updated', photo);
    
    // Start async printing simulation
    simulatePrinting(photo.id);
    
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /photos/:id/reprint
app.post('/photos/:id/reprint', async (req, res) => {
  try {
    const data = await readData();
    const photo = data.photos.find(p => p.id === req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    photo.status = 'PRINTING';
    photo.updated_at = new Date().toISOString();
    addLog(photo, 'REPRINT_STARTED', `Bắt đầu in lại (lần ${photo.attempts + 1})`);
    
    await writeData(data);
    emitEvent('photo_updated', photo);
    
    // Start async printing simulation
    simulatePrinting(photo.id);
    
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /auto-simulate
app.post('/auto-simulate', async (req, res) => {
  autoSimulateEnabled = req.body.enabled;
  
  if (autoSimulateEnabled && !autoSimulateInterval) {
    autoSimulateInterval = setInterval(async () => {
      const data = await readData();
      const queuedPhotos = data.photos.filter(p => p.status === 'IN_QUEUE');
      
      if (queuedPhotos.length > 0) {
        const randomPhoto = queuedPhotos[Math.floor(Math.random() * queuedPhotos.length)];
        
        randomPhoto.status = 'PRINTING';
        randomPhoto.updated_at = new Date().toISOString();
        addLog(randomPhoto, 'AUTO_PRINT_STARTED', 'Tự động bắt đầu in');
        
        await writeData(data);
        emitEvent('photo_updated', randomPhoto);
        
        simulatePrinting(randomPhoto.id);
      }
    }, Math.floor(Math.random() * 5000) + 5000); // 5-10s
  } else if (!autoSimulateEnabled && autoSimulateInterval) {
    clearInterval(autoSimulateInterval);
    autoSimulateInterval = null;
  }
  
  res.json({ autoSimulate: autoSimulateEnabled });
});

// GET /events (SSE)
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  sseClients.push(res);
  
  res.write('data: {"type":"connected"}\n\n');
  
  req.on('close', () => {
    sseClients = sseClients.filter(client => client !== res);
  });
});

// POST /api/login - Simple authentication endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded credentials (in production, use database + bcrypt)
    const VALID_USERS = {
      'datanla-admin': '@dmin123',
      'datanla-staff': 'st@ff123'
    };
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng nhập đầy đủ thông tin' 
      });
    }
    
    if (VALID_USERS[username] && VALID_USERS[username] === password) {
      res.json({ 
        success: true, 
        message: 'Đăng nhập thành công',
        user: {
          username: username,
          role: username === 'admin' ? 'admin' : 'staff'
        }
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: 'Tên đăng nhập hoặc mật khẩu không đúng' 
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Lỗi server' 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Public Display: http://localhost:${PORT}/public.html`);
  console.log(`Staff Dashboard: http://localhost:${PORT}/staff.html`);
  console.log(`Login Page: http://localhost:${PORT}/login.html`);
});