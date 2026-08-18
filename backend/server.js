const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mysql = require('mysql2/promise');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, 'uploads-dd-beauty');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'dd-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|pdf/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) {
      return cb(null, true);
    }
    cb(new Error('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.'));
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(UPLOAD_DIR));

// -------------------------------------------------------------
// Database Layer (MySQL Connection Pool)
// -------------------------------------------------------------
const mysqlPool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dd_beauty_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDatabase() {
  try {
    const conn = await mysqlPool.getConnection();
    console.log('✅ Connected to MySQL Database Pool: ' + (process.env.DB_NAME || 'dd_beauty_db'));

    // Execute schema & seed data if needed
    const sqlPath = path.join(__dirname, '../sql/database.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf8');
      const queries = sqlContent
        .replace(/CREATE DATABASE[\s\S]*?USE.*?;/i, '')
        .split(/;\s*[\r\n]+/)
        .filter(q => q.trim().length > 0);

      for (const queryStr of queries) {
        try {
          await conn.query(queryStr);
        } catch (e) {
          // Ignore table already exists or duplicate insert errors during init
        }
      }
    }

    // Clean up any existing records with deprecated status or payment_method
    try {
      await conn.query("UPDATE bookings SET status = 'booked' WHERE status = 'on_going'");
      await conn.query("UPDATE bookings SET payment_method = 'qris' WHERE payment_method NOT IN ('qris', 'cash')");
      await conn.query("ALTER TABLE bookings MODIFY COLUMN status ENUM('booked', 'completed', 'cancelled') DEFAULT 'booked'");
      await conn.query("ALTER TABLE bookings MODIFY COLUMN payment_method ENUM('qris', 'cash') DEFAULT 'qris'");
      await conn.query("ALTER TABLE bookings ADD COLUMN IF NOT EXISTS shipping_fee DECIMAL(12, 2) NOT NULL DEFAULT 0.00 AFTER discount_amount");
    } catch (e) {
      // Ignore if column alter is not supported or already modified
    }

    conn.release();
  } catch (err) {
    console.error('❌ MySQL Database Pool Connection Error:', err.message);
  }
}

initDatabase();

// Helper to execute MySQL queries directly via pool
async function query(sql, params = []) {
  const [rows] = await mysqlPool.query(sql, params);
  return rows;
}

// Wrapper for async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// -------------------------------------------------------------
// ROUTES / API ENDPOINTS
// -------------------------------------------------------------

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'DD Beauty Serve API is running smoothly',
    timestamp: new Date(),
  });
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Tidak ada file yang diunggah' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({
    success: true,
    message: 'File berhasil diunggah',
    data: {
      filename: req.file.filename,
      url: fileUrl,
    }
  });
});

// 1. AUTH & PROFILE
app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email dan password wajib diisi' });
  }

  const users = await query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
  const user = users[0];

  if (user) {
    return res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: 'dd-beauty-jwt-token-sample-' + user.id
      }
    });
  }
  res.status(401).json({ success: false, message: 'Email atau password salah' });
}));

app.get('/api/auth/profile', asyncHandler(async (req, res) => {
  const users = await query('SELECT id, name, email, role, phone, avatar FROM users ORDER BY id ASC LIMIT 1');
  if (!users.length) {
    return res.status(404).json({ success: false, message: 'User profile tidak ditemukan' });
  }
  res.json({
    success: true,
    data: users[0]
  });
}));

// 2. STUDIO SETTINGS
app.get('/api/settings', asyncHandler(async (req, res) => {
  const settings = await query('SELECT * FROM studio_settings WHERE id = 1');
  res.json({
    success: true,
    data: settings[0] || {}
  });
}));

app.put('/api/settings', asyncHandler(async (req, res) => {
  const { studio_name, tagline, phone, email, address, instagram, receipt_footer } = req.body;
  await query(
    `INSERT INTO studio_settings (id, studio_name, tagline, phone, email, address, instagram, receipt_footer)
     VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
     studio_name = VALUES(studio_name),
     tagline = VALUES(tagline),
     phone = VALUES(phone),
     email = VALUES(email),
     address = VALUES(address),
     instagram = VALUES(instagram),
     receipt_footer = VALUES(receipt_footer)`,
    [studio_name, tagline, phone, email, address, instagram, receipt_footer]
  );
  const updated = await query('SELECT * FROM studio_settings WHERE id = 1');
  res.json({
    success: true,
    message: 'Pengaturan studio berhasil diperbarui',
    data: updated[0]
  });
}));

// 3. CUSTOMERS
app.get('/api/customers', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const member_status = req.query.member_status || '';

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(name LIKE ? OR phone LIKE ? OR email LIKE ? OR customer_code LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (member_status) {
    whereClauses.push('member_status = ?');
    params.push(member_status);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) as total FROM customers ${whereSql}`, params);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  const rows = await query(
    `SELECT * FROM customers ${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, totalPages }
  });
}));

app.get('/api/customers/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const customers = await query('SELECT * FROM customers WHERE id = ?', [id]);
  if (!customers.length) {
    return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
  }

  const medicalRecords = await query('SELECT * FROM medical_records WHERE customer_id = ? ORDER BY record_date DESC', [id]);
  const bookings = await query('SELECT * FROM bookings WHERE customer_id = ? ORDER BY booking_date DESC, booking_time DESC', [id]);

  for (let b of bookings) {
    const items = await query('SELECT * FROM booking_items WHERE booking_id = ?', [b.id]);
    b.items = items;
  }

  res.json({
    success: true,
    data: {
      ...customers[0],
      medical_records: medicalRecords,
      booking_history: bookings
    }
  });
}));

app.post('/api/customers', asyncHandler(async (req, res) => {
  const { name, phone, email, gender, birth_date, address, member_status, notes } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, message: 'Nama dan Nomor HP wajib diisi' });
  }

  const maxIdRow = await query('SELECT MAX(id) as maxId FROM customers');
  const nextId = (maxIdRow[0].maxId || 0) + 1;
  const customer_code = `CUST-${String(nextId).padStart(3, '0')}`;

  const result = await query(
    `INSERT INTO customers (customer_code, name, phone, email, gender, birth_date, address, member_status, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      customer_code,
      name,
      phone,
      email || null,
      gender || 'female',
      birth_date || null,
      address || null,
      member_status || 'regular',
      notes || null
    ]
  );

  const inserted = await query('SELECT * FROM customers WHERE id = ?', [result.insertId]);
  res.status(201).json({
    success: true,
    message: 'Customer baru berhasil ditambahkan',
    data: inserted[0]
  });
}));

app.put('/api/customers/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await query('SELECT * FROM customers WHERE id = ?', [id]);
  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
  }

  const { name, phone, email, gender, birth_date, address, member_status, notes } = req.body;

  await query(
    `UPDATE customers SET
      name = COALESCE(?, name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      gender = COALESCE(?, gender),
      birth_date = COALESCE(?, birth_date),
      address = COALESCE(?, address),
      member_status = COALESCE(?, member_status),
      notes = COALESCE(?, notes)
     WHERE id = ?`,
    [name, phone, email, gender, birth_date, address, member_status, notes, id]
  );

  const updated = await query('SELECT * FROM customers WHERE id = ?', [id]);
  res.json({
    success: true,
    message: 'Data customer berhasil diperbarui',
    data: updated[0]
  });
}));

app.delete('/api/customers/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('DELETE FROM customers WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Customer tidak ditemukan' });
  }
  res.json({ success: true, message: 'Customer berhasil dihapus' });
}));

// 4. MEDICAL RECORDS
app.get('/api/medical-records', asyncHandler(async (req, res) => {
  const { customer_id } = req.query;
  let whereSql = '';
  let params = [];
  if (customer_id) {
    whereSql = 'WHERE m.customer_id = ?';
    params.push(parseInt(customer_id));
  }

  const rows = await query(
    `SELECT m.*, c.name as customer_name, c.phone as customer_phone
     FROM medical_records m
     LEFT JOIN customers c ON m.customer_id = c.id
     ${whereSql}
     ORDER BY m.record_date DESC, m.id DESC`,
    params
  );

  res.json({
    success: true,
    data: rows
  });
}));

app.post('/api/medical-records', asyncHandler(async (req, res) => {
  const {
    customer_id,
    skin_type,
    allergies,
    skin_concerns,
    contraindications,
    treatment_history_notes,
    beautician_notes,
    photo_before,
    photo_after,
    record_date
  } = req.body;

  if (!customer_id) {
    return res.status(400).json({ success: false, message: 'Customer ID wajib diisi' });
  }

  const today = new Date().toISOString().split('T')[0];

  const result = await query(
    `INSERT INTO medical_records 
     (customer_id, skin_type, allergies, skin_concerns, contraindications, treatment_history_notes, beautician_notes, photo_before, photo_after, record_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      parseInt(customer_id),
      skin_type || 'Normal',
      allergies || 'Tidak ada',
      skin_concerns || '',
      contraindications || 'Tidak ada',
      treatment_history_notes || '',
      beautician_notes || '',
      photo_before || null,
      photo_after || null,
      record_date || today
    ]
  );

  const inserted = await query('SELECT * FROM medical_records WHERE id = ?', [result.insertId]);
  res.status(201).json({
    success: true,
    message: 'Rekam medis berhasil disimpan',
    data: inserted[0]
  });
}));

app.put('/api/medical-records/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await query('SELECT * FROM medical_records WHERE id = ?', [id]);
  if (!existing.length) {
    return res.status(404).json({ success: false, message: 'Rekam medis tidak ditemukan' });
  }

  const {
    skin_type,
    allergies,
    skin_concerns,
    contraindications,
    treatment_history_notes,
    beautician_notes,
    photo_before,
    photo_after,
    record_date
  } = req.body;

  await query(
    `UPDATE medical_records SET
      skin_type = COALESCE(?, skin_type),
      allergies = COALESCE(?, allergies),
      skin_concerns = COALESCE(?, skin_concerns),
      contraindications = COALESCE(?, contraindications),
      treatment_history_notes = COALESCE(?, treatment_history_notes),
      beautician_notes = COALESCE(?, beautician_notes),
      photo_before = COALESCE(?, photo_before),
      photo_after = COALESCE(?, photo_after),
      record_date = COALESCE(?, record_date)
     WHERE id = ?`,
    [skin_type, allergies, skin_concerns, contraindications, treatment_history_notes, beautician_notes, photo_before, photo_after, record_date, id]
  );

  const updated = await query('SELECT * FROM medical_records WHERE id = ?', [id]);
  res.json({
    success: true,
    message: 'Rekam medis berhasil diperbarui',
    data: updated[0]
  });
}));

app.delete('/api/medical-records/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('DELETE FROM medical_records WHERE id = ?', [id]);
  if (result.affectedRows === 0) {
    return res.status(404).json({ success: false, message: 'Rekam medis tidak ditemukan' });
  }
  res.json({ success: true, message: 'Rekam medis berhasil dihapus' });
}));

// 5. TREATMENT CATEGORIES
app.get('/api/categories', asyncHandler(async (req, res) => {
  const rows = await query('SELECT * FROM treatment_categories ORDER BY id ASC');
  res.json({ success: true, data: rows });
}));

app.post('/api/categories', asyncHandler(async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Nama kategori wajib diisi' });

  const result = await query(
    'INSERT INTO treatment_categories (name, description, icon) VALUES (?, ?, ?)',
    [name, description || '', icon || 'Sparkles']
  );

  const inserted = await query('SELECT * FROM treatment_categories WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', data: inserted[0] });
}));

app.put('/api/categories/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await query('SELECT * FROM treatment_categories WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });

  const { name, description, icon } = req.body;
  await query(
    `UPDATE treatment_categories SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      icon = COALESCE(?, icon)
     WHERE id = ?`,
    [name, description, icon, id]
  );

  const updated = await query('SELECT * FROM treatment_categories WHERE id = ?', [id]);
  res.json({ success: true, message: 'Kategori berhasil diperbarui', data: updated[0] });
}));

app.delete('/api/categories/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('DELETE FROM treatment_categories WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Kategori tidak ditemukan' });
  res.json({ success: true, message: 'Kategori berhasil dihapus' });
}));

// 6. TREATMENTS / LAYANAN
app.get('/api/treatments', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';
  const category_id = req.query.category_id;
  const is_active = req.query.is_active;

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(t.name LIKE ? OR t.description LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q);
  }

  if (category_id) {
    whereClauses.push('t.category_id = ?');
    params.push(parseInt(category_id));
  }

  if (is_active !== undefined) {
    whereClauses.push('t.is_active = ?');
    params.push(parseInt(is_active));
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) as total FROM treatments t ${whereSql}`, params);
  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  const rows = await query(
    `SELECT t.*, c.name as category_name
     FROM treatments t
     LEFT JOIN treatment_categories c ON t.category_id = c.id
     ${whereSql}
     ORDER BY t.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows,
    pagination: { page, limit, total, totalPages }
  });
}));

app.get('/api/treatments/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const rows = await query(
    `SELECT t.*, c.name as category_name
     FROM treatments t
     LEFT JOIN treatment_categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Treatment tidak ditemukan' });
  res.json({ success: true, data: rows[0] });
}));

app.post('/api/treatments', asyncHandler(async (req, res) => {
  const { name, category_id, duration_minutes, price, description, image } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ success: false, message: 'Nama dan harga treatment wajib diisi' });
  }

  const result = await query(
    `INSERT INTO treatments (category_id, name, duration_minutes, price, description, image, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
    [
      category_id ? parseInt(category_id) : 1,
      name,
      parseInt(duration_minutes) || 60,
      parseFloat(price) || 0,
      description || '',
      image || null
    ]
  );

  const inserted = await query(
    `SELECT t.*, c.name as category_name
     FROM treatments t
     LEFT JOIN treatment_categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [result.insertId]
  );

  res.status(201).json({ success: true, message: 'Treatment berhasil ditambahkan', data: inserted[0] });
}));

app.put('/api/treatments/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await query('SELECT * FROM treatments WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Treatment tidak ditemukan' });

  const { name, category_id, duration_minutes, price, description, image, is_active } = req.body;

  await query(
    `UPDATE treatments SET
      name = COALESCE(?, name),
      category_id = COALESCE(?, category_id),
      duration_minutes = COALESCE(?, duration_minutes),
      price = COALESCE(?, price),
      description = COALESCE(?, description),
      image = COALESCE(?, image),
      is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [name, category_id, duration_minutes, price, description, image, is_active, id]
  );

  const updated = await query(
    `SELECT t.*, c.name as category_name
     FROM treatments t
     LEFT JOIN treatment_categories c ON t.category_id = c.id
     WHERE t.id = ?`,
    [id]
  );

  res.json({ success: true, message: 'Treatment berhasil diperbarui', data: updated[0] });
}));

app.delete('/api/treatments/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('DELETE FROM treatments WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Treatment tidak ditemukan' });
  res.json({ success: true, message: 'Treatment berhasil dihapus' });
}));

// 7. BOOKINGS & TRANSACTIONS
app.get('/api/bookings', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { search = '', status, payment_status, date, month, year } = req.query;

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(b.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR b.beautician_name LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (status) {
    whereClauses.push('b.status = ?');
    params.push(status);
  }

  if (payment_status) {
    whereClauses.push('b.payment_status = ?');
    params.push(payment_status);
  }

  if (date) {
    whereClauses.push('b.booking_date = ?');
    params.push(date);
  }

  if (month && year) {
    whereClauses.push('MONTH(b.booking_date) = ? AND YEAR(b.booking_date) = ?');
    params.push(parseInt(month), parseInt(year));
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = await query(
    `SELECT COUNT(*) as total
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     ${whereSql}`,
    params
  );

  const total = countResult[0].total;
  const totalPages = Math.ceil(total / limit) || 1;

  const bookings = await query(
    `SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.member_status
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     ${whereSql}
     ORDER BY b.id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  for (let b of bookings) {
    const items = await query('SELECT * FROM booking_items WHERE booking_id = ?', [b.id]);
    b.items = items;
    b.total_items = items.reduce((acc, curr) => acc + curr.quantity, 0);
    b.customer = {
      id: b.customer_id,
      name: b.customer_name,
      phone: b.customer_phone,
      email: b.customer_email,
      member_status: b.member_status
    };
  }

  res.json({
    success: true,
    data: bookings,
    pagination: { page, limit, total, totalPages }
  });
}));

app.get('/api/bookings/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const bookings = await query('SELECT * FROM bookings WHERE id = ?', [id]);
  if (!bookings.length) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

  const booking = bookings[0];
  const customers = await query('SELECT * FROM customers WHERE id = ?', [booking.customer_id]);
  const items = await query('SELECT * FROM booking_items WHERE booking_id = ?', [id]);
  const medicalRecords = await query('SELECT * FROM medical_records WHERE customer_id = ? ORDER BY record_date DESC LIMIT 1', [booking.customer_id]);
  const settings = await query('SELECT * FROM studio_settings WHERE id = 1');

  res.json({
    success: true,
    data: {
      ...booking,
      customer: customers[0] || null,
      items,
      medical_record: medicalRecords[0] || null,
      studio_settings: settings[0] || {}
    }
  });
}));

app.post('/api/bookings', asyncHandler(async (req, res) => {
  const {
    customer_id,
    booking_date,
    booking_time,
    beautician_name,
    items = [],
    discount_type = 'nominal',
    discount_value = 0,
    shipping_fee = 0,
    dp_amount = 0,
    paid_amount = 0,
    payment_method = 'qris',
    customer_notes = '',
    internal_notes = ''
  } = req.body;

  if (!customer_id || !booking_date || !items.length) {
    return res.status(400).json({ success: false, message: 'Customer, tanggal booking, dan minimal 1 treatment wajib diisi' });
  }

  // Calculate Subtotal
  let subtotal = 0;
  const processedItems = items.map(item => {
    const qty = parseInt(item.quantity) || 1;
    const price = parseFloat(item.unit_price) || 0;
    const itemSub = qty * price;
    subtotal += itemSub;
    return {
      treatment_id: item.treatment_id || null,
      treatment_name: item.treatment_name || 'Treatment',
      quantity: qty,
      unit_price: price,
      subtotal: itemSub,
      notes: item.notes || ''
    };
  });

  // Calculate Discount
  let discount_amount = 0;
  const discVal = parseFloat(discount_value) || 0;
  if (discount_type === 'percentage') {
    discount_amount = (subtotal * discVal) / 100;
  } else {
    discount_amount = Math.min(discVal, subtotal);
  }

  const shipFee = parseFloat(shipping_fee) || 0;
  const grand_total = Math.max(0, subtotal - discount_amount) + shipFee;
  const dp = parseFloat(dp_amount) || 0;
  const paid = parseFloat(paid_amount) || dp;
  const remaining_amount = Math.max(0, grand_total - paid);

  let payment_status = 'unpaid';
  if (paid >= grand_total && grand_total > 0) {
    payment_status = 'paid';
  } else if (paid > 0) {
    payment_status = 'dp';
  }

  const maxIdRow = await query('SELECT MAX(id) as maxId FROM bookings');
  const nextId = (maxIdRow[0].maxId || 0) + 1;
  const dateStr = booking_date.replace(/-/g, '');
  const invoice_number = `INV-${dateStr}-${String(nextId).padStart(3, '0')}`;

  const validPaymentMethod = ['qris', 'cash'].includes(payment_method) ? payment_method : 'qris';

  const result = await query(
    `INSERT INTO bookings 
     (invoice_number, customer_id, booking_date, booking_time, status, beautician_name, subtotal, discount_type, discount_value, discount_amount, shipping_fee, grand_total, dp_amount, paid_amount, remaining_amount, payment_status, payment_method, customer_notes, internal_notes)
     VALUES (?, ?, ?, ?, 'booked', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      invoice_number,
      parseInt(customer_id),
      booking_date,
      booking_time || '10:00:00',
      beautician_name || 'Beautician On Duty',
      subtotal,
      discount_type,
      discVal,
      discount_amount,
      shipFee,
      grand_total,
      dp,
      paid,
      remaining_amount,
      payment_status,
      validPaymentMethod,
      customer_notes,
      internal_notes
    ]
  );

  const newBookingId = result.insertId;

  for (let item of processedItems) {
    await query(
      `INSERT INTO booking_items (booking_id, treatment_id, treatment_name, quantity, unit_price, subtotal, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newBookingId, item.treatment_id, item.treatment_name, item.quantity, item.unit_price, item.subtotal, item.notes]
    );
  }

  await query('UPDATE customers SET total_visits = total_visits + 1 WHERE id = ?', [parseInt(customer_id)]);

  const createdBooking = await query('SELECT * FROM bookings WHERE id = ?', [newBookingId]);
  const customer = await query('SELECT * FROM customers WHERE id = ?', [parseInt(customer_id)]);

  res.status(201).json({
    success: true,
    message: 'Booking berhasil dibuat',
    data: {
      ...createdBooking[0],
      customer: customer[0] || null,
      items: processedItems
    }
  });
}));

app.put('/api/bookings/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await query('SELECT * FROM bookings WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

  const current = existing[0];
  const { status, beautician_name, shipping_fee, paid_amount, payment_method, customer_notes, internal_notes } = req.body;

  const validPaymentMethod = payment_method ? (['qris', 'cash'].includes(payment_method) ? payment_method : 'qris') : current.payment_method;
  const validStatus = status === 'on_going' ? 'booked' : status;

  let newShippingFee = current.shipping_fee !== undefined ? parseFloat(current.shipping_fee) : 0;
  if (shipping_fee !== undefined) {
    newShippingFee = parseFloat(shipping_fee) || 0;
  }
  const newGrandTotal = Math.max(0, parseFloat(current.subtotal) - parseFloat(current.discount_amount)) + newShippingFee;

  let newPaidAmount = current.paid_amount;
  if (paid_amount !== undefined) {
    newPaidAmount = parseFloat(paid_amount) || 0;
  }
  let newRemaining = Math.max(0, newGrandTotal - newPaidAmount);
  let newPaymentStatus = newRemaining === 0 && newGrandTotal > 0 ? 'paid' : (newPaidAmount > 0 ? 'dp' : 'unpaid');

  await query(
    `UPDATE bookings SET
      status = COALESCE(?, status),
      beautician_name = COALESCE(?, beautician_name),
      shipping_fee = ?,
      grand_total = ?,
      paid_amount = ?,
      remaining_amount = ?,
      payment_status = ?,
      payment_method = COALESCE(?, payment_method),
      customer_notes = COALESCE(?, customer_notes),
      internal_notes = COALESCE(?, internal_notes)
     WHERE id = ?`,
    [validStatus, beautician_name, newShippingFee, newGrandTotal, newPaidAmount, newRemaining, newPaymentStatus, validPaymentMethod, customer_notes, internal_notes, id]
  );

  const updated = await query('SELECT * FROM bookings WHERE id = ?', [id]);
  res.json({ success: true, message: 'Booking berhasil diperbarui', data: updated[0] });
}));

app.post('/api/bookings/:id/settle-payment', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const bookings = await query('SELECT * FROM bookings WHERE id = ?', [id]);
  if (!bookings.length) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });

  const booking = bookings[0];
  const { payment_method = 'qris', paid_amount } = req.body;
  const validPaymentMethod = ['qris', 'cash'].includes(payment_method) ? payment_method : 'qris';

  const additionalPayment = paid_amount !== undefined ? parseFloat(paid_amount) : booking.remaining_amount;
  const newPaidAmount = booking.paid_amount + additionalPayment;
  const newRemainingAmount = Math.max(0, booking.grand_total - newPaidAmount);
  const newPaymentStatus = newRemainingAmount === 0 ? 'paid' : 'dp';
  let newStatus = booking.status;
  if (booking.status === 'booked') {
    newStatus = 'completed';
  }

  await query(
    `UPDATE bookings SET
      paid_amount = ?,
      remaining_amount = ?,
      payment_method = ?,
      payment_status = ?,
      status = ?
     WHERE id = ?`,
    [newPaidAmount, newRemainingAmount, validPaymentMethod, newPaymentStatus, newStatus, id]
  );

  const updated = await query('SELECT * FROM bookings WHERE id = ?', [id]);
  res.json({
    success: true,
    message: 'Pelunasan pembayaran berhasil dicatat',
    data: updated[0]
  });
}));

app.delete('/api/bookings/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('DELETE FROM bookings WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
  res.json({ success: true, message: 'Booking berhasil dihapus' });
}));

// 8. EXPENSES
app.get('/api/expenses', asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 10);
  const offset = (page - 1) * limit;
  const { search = '', category, month, year } = req.query;

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(title LIKE ? OR expense_number LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q);
  }

  if (category) {
    whereClauses.push('category = ?');
    params.push(category);
  }

  if (month && year) {
    whereClauses.push('MONTH(expense_date) = ? AND YEAR(expense_date) = ?');
    params.push(parseInt(month), parseInt(year));
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countResult = await query(`SELECT COUNT(*) as total, SUM(amount) as totalExpense FROM expenses ${whereSql}`, params);
  const total = countResult[0].total || 0;
  const totalExpense = parseFloat(countResult[0].totalExpense || 0);
  const totalPages = Math.ceil(total / limit) || 1;

  const rows = await query(
    `SELECT * FROM expenses ${whereSql} ORDER BY expense_date DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  res.json({
    success: true,
    data: rows,
    summary: { total_expense: totalExpense },
    pagination: { page, limit, total, totalPages }
  });
}));

app.post('/api/expenses', asyncHandler(async (req, res) => {
  const { category = 'operational', title, amount, expense_date, payment_method = 'transfer', receipt_photo, notes } = req.body;
  if (!title || amount === undefined || !expense_date) {
    return res.status(400).json({ success: false, message: 'Judul, jumlah biaya, dan tanggal pengeluaran wajib diisi' });
  }

  const maxIdRow = await query('SELECT MAX(id) as maxId FROM expenses');
  const nextId = (maxIdRow[0].maxId || 0) + 1;
  const dateStr = expense_date.replace(/-/g, '');
  const expense_number = `EXP-${dateStr}-${String(nextId).padStart(3, '0')}`;

  const result = await query(
    `INSERT INTO expenses (expense_number, category, title, amount, expense_date, payment_method, receipt_photo, notes, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Admin')`,
    [expense_number, category, title, parseFloat(amount) || 0, expense_date, payment_method, receipt_photo || null, notes || '']
  );

  const inserted = await query('SELECT * FROM expenses WHERE id = ?', [result.insertId]);
  res.status(201).json({ success: true, message: 'Pengeluaran berhasil dicatat', data: inserted[0] });
}));

app.put('/api/expenses/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await query('SELECT * FROM expenses WHERE id = ?', [id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });

  const { category, title, amount, expense_date, payment_method, receipt_photo, notes } = req.body;

  await query(
    `UPDATE expenses SET
      category = COALESCE(?, category),
      title = COALESCE(?, title),
      amount = COALESCE(?, amount),
      expense_date = COALESCE(?, expense_date),
      payment_method = COALESCE(?, payment_method),
      receipt_photo = COALESCE(?, receipt_photo),
      notes = COALESCE(?, notes)
     WHERE id = ?`,
    [category, title, amount, expense_date, payment_method, receipt_photo, notes, id]
  );

  const updated = await query('SELECT * FROM expenses WHERE id = ?', [id]);
  res.json({ success: true, message: 'Pengeluaran berhasil diperbarui', data: updated[0] });
}));

app.delete('/api/expenses/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await query('DELETE FROM expenses WHERE id = ?', [id]);
  if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Pengeluaran tidak ditemukan' });
  res.json({ success: true, message: 'Pengeluaran berhasil dihapus' });
}));

// 9. DASHBOARD & FINANCIAL REPORTS
app.get('/api/reports/dashboard', asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Revenue & Receivables this month
  const revRow = await query(
    `SELECT SUM(paid_amount) as totalRevenue, SUM(remaining_amount) as totalReceivables, COUNT(*) as bookingsMonthCount
     FROM bookings
     WHERE MONTH(booking_date) = ? AND YEAR(booking_date) = ? AND status != 'cancelled'`,
    [currentMonth, currentYear]
  );
  const totalRevenue = parseFloat(revRow[0].totalRevenue || 0);
  const totalReceivables = parseFloat(revRow[0].totalReceivables || 0);
  const bookingsMonthCount = revRow[0].bookingsMonthCount || 0;

  // Expenses this month
  const expRow = await query(
    `SELECT SUM(amount) as totalExpense
     FROM expenses
     WHERE MONTH(expense_date) = ? AND YEAR(expense_date) = ?`,
    [currentMonth, currentYear]
  );
  const totalExpense = parseFloat(expRow[0].totalExpense || 0);
  const netProfit = totalRevenue - totalExpense;

  // Counts
  const custCountRow = await query('SELECT COUNT(*) as total FROM customers');
  const treatCountRow = await query('SELECT COUNT(*) as total FROM treatments');
  const todayBookCountRow = await query('SELECT COUNT(*) as total FROM bookings WHERE booking_date = ?', [today]);

  const totalCustomers = custCountRow[0].total || 0;
  const totalTreatments = treatCountRow[0].total || 0;
  const bookingsTodayCount = todayBookCountRow[0].total || 0;

  // Today appointments
  const todayAppointments = await query(
    `SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     WHERE b.booking_date = ?
     ORDER BY b.booking_time ASC`,
    [today]
  );

  for (let b of todayAppointments) {
    const items = await query('SELECT * FROM booking_items WHERE booking_id = ?', [b.id]);
    b.items = items;
    b.customer = {
      id: b.customer_id,
      name: b.customer_name,
      phone: b.customer_phone,
      email: b.customer_email
    };
  }

  // Recent bookings
  const recentBookings = await query(
    `SELECT b.*, c.name as customer_name, c.phone as customer_phone
     FROM bookings b
     LEFT JOIN customers c ON b.customer_id = c.id
     ORDER BY b.id DESC LIMIT 5`
  );

  for (let b of recentBookings) {
    b.customer = {
      id: b.customer_id,
      name: b.customer_name,
      phone: b.customer_phone
    };
  }

  // Recent expenses
  const recentExpenses = await query('SELECT * FROM expenses ORDER BY expense_date DESC, id DESC LIMIT 5');

  res.json({
    success: true,
    data: {
      stats: {
        total_revenue_month: totalRevenue,
        total_expense_month: totalExpense,
        net_profit_month: netProfit,
        total_receivables: totalReceivables,
        total_customers: totalCustomers,
        total_treatments: totalTreatments,
        bookings_today_count: bookingsTodayCount,
        bookings_month_count: bookingsMonthCount,
      },
      today_appointments: todayAppointments,
      recent_bookings: recentBookings,
      recent_expenses: recentExpenses,
    }
  });
}));

app.get('/api/reports/monthly-financial', asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  const monthsData = [];

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  const revRows = await query(
    `SELECT MONTH(booking_date) as monthNum, SUM(paid_amount) as rev
     FROM bookings
     WHERE YEAR(booking_date) = ? AND status != 'cancelled'
     GROUP BY MONTH(booking_date)`,
    [year]
  );
  const revMap = {};
  revRows.forEach(r => { revMap[r.monthNum] = parseFloat(r.rev || 0); });

  const expRows = await query(
    `SELECT MONTH(expense_date) as monthNum, SUM(amount) as exp
     FROM expenses
     WHERE YEAR(expense_date) = ?
     GROUP BY MONTH(expense_date)`,
    [year]
  );
  const expMap = {};
  expRows.forEach(r => { expMap[r.monthNum] = parseFloat(r.exp || 0); });

  for (let m = 1; m <= 12; m++) {
    const rev = revMap[m] || 0;
    const exp = expMap[m] || 0;
    monthsData.push({
      month_index: m,
      month_name: monthNames[m - 1],
      revenue: rev,
      expense: exp,
      net_profit: rev - exp
    });
  }

  const totalYearRevenue = monthsData.reduce((acc, c) => acc + c.revenue, 0);
  const totalYearExpense = monthsData.reduce((acc, c) => acc + c.expense, 0);
  const totalYearProfit = totalYearRevenue - totalYearExpense;

  res.json({
    success: true,
    data: {
      year,
      summary: {
        total_revenue: totalYearRevenue,
        total_expense: totalYearExpense,
        total_net_profit: totalYearProfit,
      },
      monthly_breakdown: monthsData
    }
  });
}));

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 DD Beauty Serve Backend Server running on http://localhost:${PORT}`);
});
