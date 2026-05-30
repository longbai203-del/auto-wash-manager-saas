from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from app.core.database import engine, get_db, Base
from app.core.auth import create_access_token, verify_token, get_current_user
from app.core.security import hash_password, verify_password
from app.models import User, Tenant
from app.routes import orders, reports, expenses
from app.schemas.auth import LoginRequest, LoginResponse, UserResponse

# 创建数据库表
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 FastAPI 启动中...")
    yield
    print("🛑 FastAPI 关闭中...")

app = FastAPI(
    title="Auto Wash Manager API",
    description="企业级洗车店 SaaS 管理系统 API",
    version="3.0.0",
    lifespan=lifespan
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(orders.router, prefix="/api/orders", tags=["订单管理"])
app.include_router(reports.router, prefix="/api/reports", tags=["财务报表"])
app.include_router(expenses.router, prefix="/api/expenses", tags=["支出管理"])

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Auto Wash Manager API is running"}

# 根路径
@app.get("/")
async def root():
    return {
        "message": "Auto Wash Manager API",
        "version": "3.0.0",
        "status": "running",
        "docs": "/docs"
    }

# 登录接口
@app.post("/api/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    token = create_access_token(
        data={
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
            "tenant_id": user.tenant_id
        }
    )
    
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            tenant_id=user.tenant_id
        )
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
