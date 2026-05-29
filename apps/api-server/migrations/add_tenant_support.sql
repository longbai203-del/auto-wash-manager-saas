-- 创建租户表
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  vat_rate DECIMAL DEFAULT 15,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- 添加租户列
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES tenants(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES tenants(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS tenant_id INT REFERENCES tenants(id);

-- 创建默认租户
INSERT INTO tenants (name, code, vat_rate) VALUES ('默认门店', 'DEFAULT', 15)
ON CONFLICT (code) DO NOTHING;

-- 更新现有数据
UPDATE customers SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE orders SET tenant_id = 1 WHERE tenant_id IS NULL;
UPDATE services SET tenant_id = 1 WHERE tenant_id IS NULL;
