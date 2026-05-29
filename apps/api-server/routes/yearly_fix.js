// 年报表
router.get('/yearly', async (req, res) => {
  const { year } = req.query;
  const targetYear = parseInt(year) || new Date().getFullYear();
  
  try {
    // 获取年度汇总
    const summaryResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(vat_amount), 0) as total_vat,
        COUNT(DISTINCT customer_id) as total_customers
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = $1
    `, [targetYear]);
    
    // 获取月度明细
    const monthlyResult = await pool.query(`
      SELECT 
        EXTRACT(MONTH FROM created_at) as month,
        COUNT(*) as orders_count,
        COALESCE(SUM(total_amount), 0) as monthly_revenue,
        COALESCE(SUM(vat_amount), 0) as monthly_vat
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = $1
      GROUP BY EXTRACT(MONTH FROM created_at)
      ORDER BY month
    `, [targetYear]);
    
    // 格式化月度数据
    const months = [];
    for (let i = 1; i <= 12; i++) {
      const monthData = monthlyResult.rows.find(r => parseInt(r.month) === i);
      months.push({
        month: i,
        orders_count: monthData ? parseInt(monthData.orders_count) : 0,
        monthly_revenue: monthData ? parseFloat(monthData.monthly_revenue) : 0,
        monthly_vat: monthData ? parseFloat(monthData.monthly_vat) : 0
      });
    }
    
    res.json({
      year: targetYear,
      summary: {
        total_orders: parseInt(summaryResult.rows[0].total_orders) || 0,
        total_revenue: parseFloat(summaryResult.rows[0].total_revenue) || 0,
        total_vat: parseFloat(summaryResult.rows[0].total_vat) || 0,
        total_customers: parseInt(summaryResult.rows[0].total_customers) || 0
      },
      monthly: months
    });
  } catch (error) {
    console.error('Yearly report error:', error);
    res.status(500).json({ error: error.message });
  }
});
