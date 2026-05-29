const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 初始化数据库
async function initDatabase() {
  try {
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
    
    const servicesCount = await pool.query('SELECT COUNT(*) FROM services');
    if (parseInt(servicesCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO services (name, price, duration, category) VALUES
        ('基础洗车', 30, 30, '洗车'),
        ('精洗', 60, 60, '洗车'),
        ('打蜡', 100, 45, '美容'),
        ('内饰清洁', 150, 90, '内饰')
      `);
    }
    
    console.log('✅ Database ready');
  } catch (error) {
    console.error('Database init error:', error);
  }
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/services', async (req, res) => {
  const result = await pool.query('SELECT id, name, price, duration, category FROM services WHERE is_active = true');
  res.json(result.rows);
});

app.get('/api/customers', async (req, res) => {
  const result = await pool.query('SELECT id, name, phone, email, total_spent, visit_count FROM customers ORDER BY id');
  res.json(result.rows);
});

app.post('/api/customers', async (req, res) => {
  const { name, phone, email } = req.body;
  const result = await pool.query(
    'INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING *',
    [name, phone, email || '']
  );
  res.status(201).json(result.rows[0]);
});

app.get('/api/orders', async (req, res) => {
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
});

app.post('/api/orders', async (req, res) => {
  const { customerId, items, notes } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
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
    
    const orderResult = await client.query(
      'INSERT INTO orders (order_number, customer_id, subtotal, vat_amount, total_amount, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [orderNumber, customerId, subtotal, vatAmount, totalAmount, notes || '']
    );
    
    for (const item of orderItems) {
      await client.query(
        'INSERT INTO order_items (order_id, service_id, service_name, quantity, unit_price, total) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderResult.rows[0].id, item.serviceId, item.serviceName, item.quantity, item.unitPrice, item.total]
      );
    }
    
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

app.put('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  await pool.query('UPDATE orders SET status = $1, completed_at = $2 WHERE id = $3', 
    [status, status === 'completed' ? new Date() : null, req.params.id]);
  res.json({ id: req.params.id, status });
});

app.get('/api/stats', async (req, res) => {
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
});

app.get('/api/dashboard', async (req, res) => {
  const recentOrders = await pool.query(`
    SELECT o.order_number, c.name as customer_name, o.total_amount, o.status, o.created_at
    FROM orders o
    JOIN customers c ON o.customer_id = c.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `);
  
  res.json({
    recentOrders: recentOrders.rows,
    topCustomers: [],
    servicesPopularity: []
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  await initDatabase();
  console.log(`🚀 Server running on port ${PORT}`);
});

// 财务报表
const reportRoutes = require('./routes/reports');
app.use('/api/reports', reportRoutes);

// VAT 报表
const vatRoutes = require('./routes/vat');
app.use('/api/vat', vatRoutes);

