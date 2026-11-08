$ErrorActionPreference = 'Stop'
$taskPreviewUrl = 'http://127.0.0.1:4177'
$taskPreviewResponse = $null
try { $taskPreviewResponse = Invoke-WebRequest -UseBasicParsing -Uri $taskPreviewUrl -TimeoutSec 1 } catch { }
if ($taskPreviewResponse -and -not $taskPreviewResponse.Content.Contains('GILSAN MATERIAL LIBRARY')) {
  throw 'Port 4177 is already used by another app. Close that app or run server.cjs with another PORT.'
}
if (-not $taskPreviewResponse) {
  $taskNode = (Get-Command node -ErrorAction Stop).Source
  Start-Process -FilePath $taskNode -ArgumentList 'server.cjs' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
  for ($taskAttempt = 0; $taskAttempt -lt 12; $taskAttempt++) {
    try { $taskPreviewResponse = Invoke-WebRequest -UseBasicParsing -Uri $taskPreviewUrl -TimeoutSec 1; break } catch { Start-Sleep -Milliseconds 250 }
  }
}
if (-not $taskPreviewResponse -or -not $taskPreviewResponse.Content.Contains('GILSAN MATERIAL LIBRARY')) { throw 'Local preview server did not start.' }
Start-Process $taskPreviewUrl
Write-Output "Preview is ready: $taskPreviewUrl"
