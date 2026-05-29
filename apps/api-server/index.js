const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();

// 允许所有来源访问（临时解决 CORS）
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const PORT = process.env.PORT || 5000;

// 数据存储
let orders = [];
let customers = [
  { id: '1', name: '张三', phone: '13800138001', email: 'zhang@example.com', totalSpent: 450, visitCount: 5 },
  { id: '2', name: '李四', phone: '13800138002', email: 'li@example.com', totalSpent: 230, visitCount: 3 },
  { id: '3', name: '王五', phone: '13800138003', email: 'wang@example.com', totalSpent: 680, visitCount: 7 }
];

const services = [
  { id: '1', name: '基础洗车', price: 30, duration: 30, category: '洗车' },
  { id: '2', name: '精洗', price: 60, duration: 60, category: '洗车' },
  { id: '3', name: '打蜡', price: 100, duration: 45, category: '美容' },
  { id: '4', name: '内饰清洁', price: 150, duration: 90, category: '内饰' }
];

// API 路由
app.get('/', (req, res) => {
  res.json({
    message: 'Auto Wash Manager API',
    version: '2.0.0',
    status: 'running'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/services', (req, res) => {
  res.json(services);
});

app.get('/api/customers', (req, res) => {
  res.json(customers);
});

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

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

app.get('/api/dashboard', (req, res) => {
  res.json({
    recentOrders: orders.slice(0, 10),
    topCustomers: [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5),
    servicesPopularity: services.map(s => ({ name: s.name, orders: 0 }))
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
