Write-Host "🚀 启动 Auto Wash Manager 开发环境" -ForegroundColor Cyan

# 启动 PostgreSQL（Docker）
Write-Host "启动 PostgreSQL..." -ForegroundColor Yellow
docker-compose up -d postgres

Start-Sleep -Seconds 5

# 运行数据库迁移
Write-Host "运行数据库迁移..." -ForegroundColor Yellow
cd apps/api-server
alembic upgrade head
cd ../..

# 启动后端
Write-Host "启动后端 API..." -ForegroundColor Yellow
$backendJob = Start-Process -NoNewWindow -PassThru powershell -ArgumentList "-NoExit", "-Command", "cd D:\Projects\Auto-Wash-Manager-SaaS\apps\api-server; uvicorn app.main:app --reload --port 8000"

# 启动前端
Write-Host "启动前端开发服务器..." -ForegroundColor Yellow
$frontendJob = Start-Process -NoNewWindow -PassThru powershell -ArgumentList "-NoExit", "-Command", "cd D:\Projects\Auto-Wash-Manager-SaaS\apps\admin-web-new; npm run dev"

Write-Host "`n✅ 所有服务已启动！" -ForegroundColor Green
Write-Host "📖 API 文档: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "🌐 前端地址: http://localhost:5173" -ForegroundColor Cyan
Write-Host "🔗 健康检查: http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "`n按 Ctrl+C 停止所有服务" -ForegroundColor Yellow

# 等待用户中断
try {
    while ($true) { Start-Sleep -Seconds 1 }
} finally {
    Stop-Process -Id $backendJob.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontendJob.Id -Force -ErrorAction SilentlyContinue
}
