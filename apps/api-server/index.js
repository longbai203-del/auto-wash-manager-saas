const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ???
app.get('/', (req, res) => {
  res.json({
    message: 'Auto Wash Manager API',
    version: '2.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      services: '/api/services',
      customers: '/api/customers',
      orders: '/api/orders',
      stats: '/api/stats'
    }
  });
});

// ????
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ????
app.get('/api/services', (req, res) => {
  res.json([
    { id: '1', name: '????', price: 30, duration: 30, category: '??' },
    { id: '2', name: '??', price: 60, duration: 60, category: '??' },
    { id: '3', name: '??', price: 100, duration: 45, category: '??' },
    { id: '4', name: '????', price: 150, duration: 90, category: '??' }
  ]);
});

// ????
app.get('/api/customers', (req, res) => {
  res.json([
    { id: '1', name: '??', phone: '13800138001', totalSpent: 0, visitCount: 0 },
    { id: '2', name: '??', phone: '13800138002', totalSpent: 0, visitCount: 0 }
  ]);
});

// ??
app.get('/api/stats', (req, res) => {
  res.json({
    todayOrders: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    totalCustomers: 2,
    activeServices: 4
  });
});

// 404 ??
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`?? API running on port ${PORT}`);
  console.log(`?? Health: /health`);
  console.log(`?? Services: /api/services`);
});
