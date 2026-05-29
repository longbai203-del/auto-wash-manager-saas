const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

// CORS 配置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// 认证路由
const authRoutes = require('./routes/auth'); // Temporarily disabled
app.use('/api/auth', authRoutes); // Temporarily disabled

// 连接 Supabase 数据库
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 初始化数据库表
async function initDatabase() {
  try {
    // 创建客户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100),
        total_spent DECIMAL DEFAULT 0,
        visit_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // 创建服务表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        price DECIMAL NOT NULL,
        duration INT NOT NULL,
        category VARCHAR(50),
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    
    // 创建订单表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        order_number VARCHAR(50) UNIQUE NOT NULL,
        customer_id INT REFERENCES customers(id),
        subtotal DECIMAL,
        vat_amount DECIMAL,
        total_amount DECIMAL,
        status VARCHAR(20) DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    
    // 创建订单项表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id),
        service_id INT REFERENCES services(id),
        service_name VARCHAR(100),
        quantity INT,
        unit_price DECIMAL,
        total DECIMAL
      )
    `);
    
    // 检查是否有初始数据
    const servicesCount = await pool.query('SELECT COUNT(*) FROM services');
    if (parseInt(servicesCount.rows[0].count) === 0) {
      // 插入默认服务
      await pool.query(`
        INSERT INTO services (name, price, duration, category) VALUES
        ('基础洗车', 30, 30, '洗车'),
        ('精洗', 60, 60, '洗车'),
        ('打蜡', 100, 45, '美容'),
        ('内饰清洁', 150, 90, '内饰')
      `);
      console.log('✅ 默认服务已添加');
    }
    
    const customersCount = await pool.query('SELECT COUNT(*) FROM customers');
    if (parseInt(customersCount.rows[0].count) === 0) {
      // 插入默认客户
      await pool.query(`
        INSERT INTO customers (name, phone, email) VALUES
        ('张三', '13800138001', 'zhang@example.com'),
        ('李四', '13800138002', 'li@example.com'),
        ('王五', '13800138003', 'wang@example.com')
      `);
      console.log('✅ 默认客户已添加');
    }
    
    console.log('✅ 数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// API 路由
app.get('/', (req, res) => {
  res.json({ message: 'Auto Wash Manager API', version: '2.0.0', status: 'running', database: 'Supabase' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
});

// 服务列表
app.get('/api/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, price, duration, category FROM services WHERE is_active = true');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 客户列表
app.get('/api/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, phone, email, total_spent, visit_count FROM customers ORDER BY id');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 添加客户
app.post('/api/customers', async (req, res) => {
  const { name, phone, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
      [name, phone, email || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 订单列表
app.get('/api/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, c.name as customer_name,
        COALESCE(json_agg(json_build_object('service_name', oi.service_name, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total', oi.total)) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id, c.name
      ORDER BY o.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 创建订单
app.post('/api/orders', async (req, res) => {
  const { customerId, items, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // 获取服务价格
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const service = await client.query('SELECT name, price FROM services WHERE id = $1', [item.serviceId]);
      const total = service.rows[0].price * item.quantity;
      subtotal += total;
      orderItems.push({
        serviceId: item.serviceId,
        serviceName: service.rows[0].name,
        quantity: item.quantity,
        unitPrice: service.rows[0].price,
        total
      });
    }
    
    const vatAmount = subtotal * 0.15;
    const totalAmount = subtotal + vatAmount;
    const orderNumber = `ORD-${Date.now()}`;
    
    // 创建订单
    const orderResult = await client.query(
      'INSERT INTO orders (order_number, customer_id, subtotal, vat_amount, total_amount, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orderNumber, customerId, subtotal, vatAmount, totalAmount, notes || '']
    );
    
    // 创建订单项
    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (order_id, service_id, service_name, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderResult.rows[0].id, item.serviceId, item.serviceName, item.quantity, item.unitPrice, item.total]
      );
    }
    
    // 更新客户统计
    await client.query('UPDATE customers SET total_spent = total_spent + $1, visit_count = visit_count + 1 WHERE id = $2', [totalAmount, customerId]);
    
    await client.query('COMMIT');
    res.status(201).json(orderResult.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// 更新订单状态
app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  try {
    await pool.query('UPDATE orders SET status = $1, completed_at = $2 WHERE id = $3', 
      [status, status === 'completed' ? new Date() : null, req.params.id]);
    res.json({ id: req.params.id, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 统计数据
app.get('/api/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalOrders, todayOrders, totalRevenue, pendingOrders, totalCustomers, activeServices] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query('SELECT COUNT(*) FROM orders WHERE created_at >= $1', [today]),
      pool.query('SELECT COALESCE(SUM(total_amount), 0) FROM orders'),
      pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', ['pending']),
      pool.query('SELECT COUNT(*) FROM customers'),
      pool.query('SELECT COUNT(*) FROM services WHERE is_active = true')
    ]);
    
    res.json({
      todayOrders: parseInt(todayOrders.rows[0].count),
      totalOrders: parseInt(totalOrders.rows[0].count),
      totalRevenue: parseFloat(totalRevenue.rows[0].coalesce),
      pendingOrders: parseInt(pendingOrders.rows[0].count),
      totalCustomers: parseInt(totalCustomers.rows[0].count),
      activeServices: parseInt(activeServices.rows[0].count)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 仪表盘
app.get('/api/dashboard', async (req, res) => {
  try {
    const recentOrders = await pool.query(`
      SELECT o.order_number, c.name as customer_name, o.total_amount, o.status, o.created_at
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `);
    
    const topCustomers = await pool.query(`
      SELECT id, name, phone, total_spent, visit_count
      FROM customers
      ORDER BY total_spent DESC
      LIMIT 5
    `);
    
    res.json({
      recentOrders: recentOrders.rows,
      topCustomers: topCustomers.rows,
      servicesPopularity: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 启动服务
app.listen(PORT, '0.0.0.0', async () => {
  await initDatabase();
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Health: https://auto-wash-api.onrender.com/health`);
  console.log(`💾 Database: Supabase (PostgreSQL)`);
});





// ========== 认证路由 ==========
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 登录
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const result = await pool.query(
      'SELECT id, email, password_hash, name, role FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 注册（仅管理员可用）
app.post('/api/auth/register', authenticate, requireRole(['admin']), async (req, res) => {
  const { email, password, name, role } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role',
      [email, hashedPassword, name, role || 'staff']
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户信息
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1',
      [req.userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
