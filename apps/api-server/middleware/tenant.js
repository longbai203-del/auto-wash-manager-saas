// 租户中间件
const tenantMiddleware = (req, res, next) => {
  req.tenantId = req.headers['x-tenant-id'] || 'default';
  next();
};

module.exports = { tenantMiddleware };
