import psycopg2
import bcrypt

# Connect to PostgreSQL
conn = psycopg2.connect(
    host='localhost',
    port=5432,
    database='auto_wash_dev',
    user='postgres',
    password='Gaximu805283768'
)
cur = conn.cursor()

# Insert default tenant with code
cur.execute('''
    INSERT INTO tenants (id, name, code) 
    VALUES (1, 'Default Tenant', 'DEFAULT') 
    ON CONFLICT (id) DO NOTHING
''')

# Hash the password
password = b'admin123'
hashed = bcrypt.hashpw(password, bcrypt.gensalt())

# Insert admin user
cur.execute('''
    INSERT INTO users (email, password_hash, full_name, role, tenant_id) 
    VALUES (%s, %s, %s, %s, %s) 
    ON CONFLICT (email) DO NOTHING
''', ('admin@autowash.com', hashed.decode('utf-8'), '系统管理员', 'admin', 1))

conn.commit()
print('✅ 管理员账号创建成功！')
print('   邮箱: admin@autowash.com')
print('   密码: admin123')
conn.close()
