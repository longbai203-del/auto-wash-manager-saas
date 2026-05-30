#!/usr/bin/env python3
"""
数据库初始化脚本
创建默认租户、管理员用户、基础数据
"""

import os
import sys
from passlib.context import CryptContext

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.models import Tenant, Branch, User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_database():
    db = SessionLocal()
    
    try:
        # 创建默认租户
        tenant = db.query(Tenant).filter(Tenant.code == "DEFAULT").first()
        if not tenant:
            tenant = Tenant(
                name="默认门店",
                code="DEFAULT",
                timezone="Asia/Riyadh",
                currency="SAR",
                vat_rate=15.0,
                status="active"
            )
            db.add(tenant)
            db.flush()
            print("✅ 默认租户已创建")
        
        # 创建默认门店
        branch = db.query(Branch).filter(Branch.name == "主门店").first()
        if not branch:
            branch = Branch(
                name="主门店",
                address="利雅得市中心",
                phone="+966 123456789",
                manager_name="系统管理员",
                tenant_id=tenant.id,
                status="active"
            )
            db.add(branch)
            db.flush()
            print("✅ 默认门店已创建")
        
        # 创建管理员用户
        admin = db.query(User).filter(User.email == "admin@autowash.com").first()
        if not admin:
            admin = User(
                email="admin@autowash.com",
                password_hash=pwd_context.hash("admin123"),
                full_name="系统管理员",
                role="super_admin",
                tenant_id=tenant.id,
                branch_id=branch.id,
                is_active=True
            )
            db.add(admin)
            print("✅ 管理员用户已创建")
            print("   邮箱: admin@autowash.com")
            print("   密码: admin123")
        
        db.commit()
        print("🎉 数据库初始化完成！")
        
    except Exception as e:
        print(f"❌ 初始化失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_database()
