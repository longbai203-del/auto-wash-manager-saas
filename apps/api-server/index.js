const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// ??????
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ?????
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ????
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ????
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DATABASE_URL ? 'configured' : 'not configured'
  });
});

// ???????????????? PostgreSQL?
let orders = [];
let customers = [];
let nextOrderId = 1;
let nextCustomerId = 4;

// ?????
const services = [
  { id: '1', name: '????', price: 30, duration: 30, category: '??' },
  { id: '2', name: '??', price: 60, duration: 60, category: '??' },
  { id: '3', name: '??', price: 100, duration: 45, category: '??' },
  { id: '4', name: '????', price: 150, duration: 90, category: '??' }
];

const initialCustomers = [
  { id: '1', name: '??', phone: '13800138001', email: 'zhang@example.com', totalSpent: 450, visitCount: 5 },
  { id: '2', name: '??', phone: '13800138002', email: 'li@example.com', totalSpent: 230, visitCount: 3 },
  { id: '3', name: '??', phone: '13800138003', email: 'wang@example.com', totalSpent: 680, visitCount: 7 }
];
customers.push(...initialCustomers);

// ========== API ?? ==========

// ??
app.get('/api/services', (req, res) => {
  res.json(services);
});

// ??
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.post('/api/customers', (req, res) => {
  const { name, phone, email } = req.body;
  const newCustomer = {
    id: String(nextCustomerId++),
    name,
    phone,
    email: email || '',
    totalSpent: 0,
    visitCount: 0
  };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// ??
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const { customerId, items, notes } = req.body;
  const customer = customers.find(c => c.id === customerId);
  
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found' });
  }
  
  let subtotal = 0;
  const orderItems = items.map(item => {
    const service = services.find(s => s.id === item.serviceId);
    const total = service.price * item.quantity;
    subtotal += total;
    return {
      serviceId: item.serviceId,
      serviceName: service.name,
      quantity: item.quantity,
      unitPrice: service.price,
      total
    };
  });
  
  const vatRate = process.env.VAT_RATE || 15;
  const vatAmount = subtotal * (vatRate / 100);
  const totalAmount = subtotal + vatAmount;
  
  const order = {
    id: String(nextOrderId++),
    orderNumber: `ORD-${Date.now()}`,
    customerId: customer.id,
    customerName: customer.name,
    items: orderItems,
    subtotal,
    vatAmount,
    totalAmount,
    status: 'pending',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };
  
  orders.unshift(order);
  
  // ??????
  customer.totalSpent += totalAmount;
  customer.visitCount += 1;
  
  res.status(201).json(order);
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.status = status;
  if (status === 'completed') {
    order.completedAt = new Date().toISOString();
  }
  
  res.json(order);
});

// ??
app.get('/api/stats', (req, res) => {
  const today = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
  
  res.json({
    todayOrders: todayOrders.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalCustomers: customers.length,
    activeServices: services.length
  });
});

// ?????
app.get('/api/dashboard', (req, res) => {
  const recentOrders = orders.slice(0, 10);
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  
  res.json({
    recentOrders,
    topCustomers,
    servicesPopularity: services.map(s => ({
      name: s.name,
      orders: orders.filter(o => o.items.some(i => i.serviceName === s.name)).length
    }))
  });
});

// 404 ??
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ????
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ?????
app.listen(PORT, '0.0.0.0', () => {
  console.log(`?? Auto Wash Manager API`);
  console.log(`?? Running on http://0.0.0.0:${PORT}`);
  console.log(`?? Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`?? Data: In-memory (restart will reset)`);
  console.log(`?? Health: http://localhost:${PORT}/health`);
});

module.exports = app;
