# Test Connection to Local Development Server

Write-Host "Testing connection to local development server..." -ForegroundColor Green

Write-Host "`nMethod 1: Using Test-NetConnection" -ForegroundColor Cyan
Write-Host "--------------------------------"
Test-NetConnection -ComputerName localhost -Port 3000 | Format-List

Write-Host "`nMethod 2: Using Invoke-WebRequest with timeout" -ForegroundColor Cyan
Write-Host "--------------------------------"
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "Request succeeded! Status code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers: $($response.Headers | Out-String)"
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nMethod 3: Using .NET WebClient" -ForegroundColor Cyan
Write-Host "--------------------------------"
try {
    $webClient = New-Object System.Net.WebClient
    $webClient.Timeout = 2000
    $content = $webClient.DownloadString("http://localhost:3000")
    Write-Host "Request succeeded!" -ForegroundColor Green
    Write-Host "Content length: $($content.Length) characters"
} catch {
    Write-Host "Request failed: $_" -ForegroundColor Red
}

Write-Host "`nMethod 4: Using .NET TcpClient" -ForegroundColor Cyan
Write-Host "--------------------------------"
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connection = $tcpClient.BeginConnect("localhost", 3000, $null, $null)
    $wait = $connection.AsyncWaitHandle.WaitOne(2000, $false)

    if ($wait) {
        $tcpClient.EndConnect($connection)
        Write-Host "TCP connection successful!" -ForegroundColor Green
    } else {
        Write-Host "TCP connection timed out!" -ForegroundColor Red
    }
    $tcpClient.Close()
} catch {
    Write-Host "TCP connection failed: $_" -ForegroundColor Red
}

Write-Host "`nMethod 5: Using curl.exe" -ForegroundColor Cyan
Write-Host "--------------------------------"
try {
    $result = curl.exe --connect-timeout 2 http://localhost:3000
    Write-Host "curl request result: $result" -ForegroundColor Green
} catch {
    Write-Host "curl request failed: $_" -ForegroundColor Red
}

Write-Host "`nChecking processes on port 3000:" -ForegroundColor Cyan
Write-Host "--------------------------------"
netstat -ano | findstr :3000

Write-Host "`nDone testing connection methods." -ForegroundColor Green
pause 