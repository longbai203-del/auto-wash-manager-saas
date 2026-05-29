const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// 日报表
router.get('/daily', async (req, res) => {
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(AVG(total_amount), 0) as avg_order_value
      FROM orders 
      WHERE DATE(created_at) = $1
    `, [targetDate]);
    
    const serviceStats = await pool.query(`
      SELECT 
        s.name as service_name,
        COUNT(oi.id) as times_sold,
        SUM(oi.total) as revenue
      FROM order_items oi
      JOIN services s ON oi.service_id = s.id
      JOIN orders o ON oi.order_id = o.id
      WHERE DATE(o.created_at) = $1
      GROUP BY s.name
      ORDER BY revenue DESC
    `, [targetDate]);
    
    res.json({
      date: targetDate,
      summary: result.rows[0],
      services: serviceStats.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 月报表
router.get('/monthly', async (req, res) => {
  const { year, month } = req.query;
  const targetYear = year || new Date().getFullYear();
  const targetMonth = month || (new Date().getMonth() + 1);
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        SUM(total_amount) as daily_revenue
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = $1 
        AND EXTRACT(MONTH FROM created_at) = $2
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [targetYear, targetMonth]);
    
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        SUM(vat_amount) as total_vat
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = $1 
        AND EXTRACT(MONTH FROM created_at) = $2
    `, [targetYear, targetMonth]);
    
    res.json({
      year: targetYear,
      month: targetMonth,
      summary: summary.rows[0],
      daily: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 客户排行
router.get('/top-customers', async (req, res) => {
  const { limit = 10 } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.name,
        c.phone,
        c.total_spent,
        c.visit_count,
        COUNT(o.id) as orders_count
      FROM customers c
      LEFT JOIN orders o ON c.id = o.customer_id
      GROUP BY c.id
      ORDER BY c.total_spent DESC
      LIMIT $1
    `, [limit]);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 服务排行
router.get('/top-services', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        s.name,
        s.price,
        COUNT(oi.id) as times_sold,
        SUM(oi.total) as total_revenue
      FROM services s
      LEFT JOIN order_items oi ON s.id = oi.service_id
      GROUP BY s.id
      ORDER BY total_revenue DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// VAT 报表
router.get('/vat', async (req, res) => {
  const VAT_RATE = 15;
  
  try {
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(subtotal), 0) as total_net,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COALESCE(SUM(total_amount), 0) as total_gross
      FROM orders
    `);
    
    const daily = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as invoice_count,
        SUM(subtotal) as total_net,
        SUM(vat_amount) as total_vat,
        SUM(total_amount) as total_gross
      FROM orders
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);
    
    res.json({
      vat_rate: VAT_RATE,
      summary: summary.rows[0],
      daily: daily.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
