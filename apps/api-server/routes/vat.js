const express = require('express');
const { Pool } = require('pg');

const router = express.Router();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// VAT 税率配置（沙特 15%）
const VAT_RATE = 15;

// VAT 报表
router.get('/vat-report', async (req, res) => {
  const { startDate, endDate } = req.query;
  
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as invoice_count,
        SUM(subtotal) as total_net,
        SUM(vat_amount) as total_vat,
        SUM(total_amount) as total_gross
      FROM orders
      WHERE ($1::date IS NULL OR DATE(created_at) >= $1)
        AND ($2::date IS NULL OR DATE(created_at) <= $2)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, [startDate || null, endDate || null]);
    
    const summary = await pool.query(`
      SELECT 
        COUNT(*) as total_invoices,
        SUM(subtotal) as total_net,
        SUM(vat_amount) as total_vat,
        SUM(total_amount) as total_gross
      FROM orders
      WHERE ($1::date IS NULL OR DATE(created_at) >= $1)
        AND ($2::date IS NULL OR DATE(created_at) <= $2)
    `, [startDate || null, endDate || null]);
    
    res.json({
      vat_rate: VAT_RATE,
      period: { startDate, endDate },
      summary: summary.rows[0],
      daily: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
