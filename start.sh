#!/bin/bash

echo "🚀 启动 Auto Wash Manager 开发环境"

# 启动 PostgreSQL
echo "启动 PostgreSQL..."
docker-compose up -d postgres

sleep 5

# 运行数据库迁移
echo "运行数据库迁移..."
cd apps/api-server
alembic upgrade head
cd ../..

# 启动后端
echo "启动后端 API..."
cd apps/api-server
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ../..

# 启动前端
echo "启动前端开发服务器..."
cd apps/admin-web-new
npm run dev &
FRONTEND_PID=$!
cd ../..

echo ""
echo "✅ 所有服务已启动！"
echo "📖 API 文档: http://localhost:8000/docs"
echo "🌐 前端地址: http://localhost:5173"
echo "🔗 健康检查: http://localhost:8000/health"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待中断
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
