Write-Host "🚀 启动 Auto Wash Manager..." -ForegroundColor Cyan

# 启动后端 API
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Projects\Auto-Wash-Manager-SaaS\apps\api-server; Write-Host '后端 API 启动中...' -ForegroundColor Yellow; npm run dev"

Start-Sleep -Seconds 3

# 启动前端
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd D:\Projects\Auto-Wash-Manager-SaaS\apps\admin-web; Write-Host '前端服务启动中...' -ForegroundColor Yellow; npx serve -p 3000"

Write-Host ""
Write-Host "✅ 服务启动完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📌 访问地址：" -ForegroundColor Yellow
Write-Host "   前端: http://localhost:3000" -ForegroundColor Cyan
Write-Host "   后端: http://localhost:5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  请保持两个终端窗口打开" -ForegroundColor Gray
