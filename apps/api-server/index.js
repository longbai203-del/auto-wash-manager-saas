const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// ??????
let orders = [];
let customers = [
  { id: '1', name: '??', phone: '13800138001', email: 'zhang@example.com', totalSpent: 450, visitCount: 5 },
  { id: '2', name: '??', phone: '13800138002', email: 'li@example.com', totalSpent: 230, visitCount: 3 },
  { id: '3', name: '??', phone: '13800138003', email: 'wang@example.com', totalSpent: 680, visitCount: 7 }
];

const services = [
  { id: '1', name: '????', price: 30, duration: 30, category: '??' },
  { id: '2', name: '??', price: 60, duration: 60, category: '??' },
  { id: '3', name: '??', price: 100, duration: 45, category: '??' },
  { id: '4', name: '????', price: 150, duration: 90, category: '??' }
];

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
      stats: '/api/stats',
      dashboard: '/api/dashboard'
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
  res.json(services);
});

// ??????
app.get('/api/services/:id', (req, res) => {
  const service = services.find(s => s.id === req.params.id);
  if (service) {
    res.json(service);
  } else {
    res.status(404).json({ error: 'Service not found' });
  }
});

// ????
app.get('/api/customers', (req, res) => {
  res.json(customers);
});

// ??????
app.get('/api/customers/:id', (req, res) => {
  const customer = customers.find(c => c.id === req.params.id);
  if (customer) {
    res.json(customer);
  } else {
    res.status(404).json({ error: 'Customer not found' });
  }
});

// ????
app.post('/api/customers', (req, res) => {
  const { name, phone, email } = req.body;
  const newCustomer = {
    id: String(customers.length + 1),
    name,
    phone,
    email: email || '',
    totalSpent: 0,
    visitCount: 0
  };
  customers.push(newCustomer);
  res.status(201).json(newCustomer);
});

// ????
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

// ??????
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ error: 'Order not found' });
  }
});

// ????
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
      total: total
    };
  });
  
  const vatAmount = subtotal * 0.15; // ?? VAT 15%
  const totalAmount = subtotal + vatAmount;
  
  const order = {
    id: String(orders.length + 1),
    orderNumber: `ORD-${Date.now()}`,
    customerId: customer.id,
    customerName: customer.name,
    items: orderItems,
    subtotal: subtotal,
    vatAmount: vatAmount,
    totalAmount: totalAmount,
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

// ??????
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

// ??????
app.put('/api/orders/:id/payment', (req, res) => {
  const { paymentStatus, paymentMethod } = req.body;
  const order = orders.find(o => o.id === req.params.id);
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  order.paymentStatus = paymentStatus;
  order.paymentMethod = paymentMethod;
  
  res.json(order);
});

// ????
app.delete('/api/orders/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  orders.splice(index, 1);
  res.status(204).send();
});

// ========== ?? API ==========
app.get('/api/stats', (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  
  const stats = {
    todayOrders: todayOrders.length,
    totalOrders: orders.length,
    totalRevenue: orders.reduce((sum, o) => sum + o.totalAmount, 0),
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    totalCustomers: customers.length,
    activeServices: services.length,
    completedOrders: orders.filter(o => o.status === 'completed').length,
    cancelledOrders: orders.filter(o => o.status === 'cancelled').length
  };
  
  res.json(stats);
});

// ========== ??? API ==========
app.get('/api/dashboard', (req, res) => {
  const recentOrders = orders.slice(0, 10);
  const topCustomers = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  
  // ???????
  const servicesPopularity = services.map(service => {
    const orderCount = orders.filter(order => 
      order.items.some(item => item.serviceId === service.id)
    ).length;
    return {
      name: service.name,
      orders: orderCount,
      revenue: orders.reduce((sum, order) => {
        const serviceItems = order.items.filter(item => item.serviceId === service.id);
        const serviceRevenue = serviceItems.reduce((s, item) => s + item.total, 0);
        return sum + serviceRevenue;
      }, 0)
    };
  });
  
  // ??7???
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    const nextDate = new Date(date);
    nextDate.setDate(date.getDate() + 1);
    
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate >= date && orderDate < nextDate;
    });
    
    last7Days.push({
      date: date.toISOString().split('T')[0],
      orders: dayOrders.length,
      revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    });
  }
  
  res.json({
    recentOrders,
    topCustomers,
    servicesPopularity,
    weeklyStats: last7Days
  });
});

// 404 ??
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method,
    message: `The endpoint ${req.method} ${req.path} does not exist`
  });
});

// ????
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`?? Auto Wash Manager API`);
  console.log(`?? Running on http://0.0.0.0:${PORT}`);
  console.log(`?? Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`?? Health: /health`);
  console.log(`?? Services: /api/services`);
  console.log(`?? Orders: /api/orders`);
  console.log(`?? Customers: /api/customers`);
  console.log(`?? Stats: /api/stats`);
});
