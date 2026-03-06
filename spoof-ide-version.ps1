# 欺骗服务端版本号 - 安装旧版IDE后执行此脚本
$base           = "C:\Users\Administrator\AppData\Local\Programs\Antigravity\resources\app"
$pkgPath        = "$base\package.json"
$productPath    = "$base\product.json"
$targetIdeVer   = "1.19.6"   # Antigravity 最新版本号

if (-not (Test-Path $pkgPath)) {
    Write-Host "未找到 package.json，请确认IDE已安装" -ForegroundColor Red
    exit 1
}

# 修改 product.json (ideVersion + updateUrl)
if (Test-Path $productPath) {
    $prod = Get-Content $productPath -Raw | ConvertFrom-Json
    $oldIde = $prod.ideVersion
    $prod.ideVersion  = $targetIdeVer
    $prod.updateUrl   = ""   # 禁止检测更新
    $prod | ConvertTo-Json -Depth 100 | Set-Content $productPath -Encoding UTF8
    Write-Output "product.json ideVersion: $oldIde -> $targetIdeVer, updateUrl cleared"
}

Write-Output "Done. Restart IDE to take effect."
