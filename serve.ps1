# serve.ps1 - Lightweight .NET HTTP Server in PowerShell
$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Server running at http://localhost:$port/"
Write-Host "Press Ctrl+C to stop the server."

$currentDir = Get-Location

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/") { $urlPath = "/index.html" }
        
        # Resolve file path relative to the script directory
        $filePath = Join-Path $currentDir $urlPath.TrimStart('/')
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $extension = [System.IO.Path]::GetExtension($filePath).ToLower()
            
            $contentType = "text/html"
            if ($extension -eq ".css") { $contentType = "text/css" }
            elseif ($extension -eq ".js") { $contentType = "application/javascript" }
            elseif ($extension -eq ".png") { $contentType = "image/png" }
            elseif ($extension -eq ".jpg" -or $extension -eq ".jpeg") { $contentType = "image/jpeg" }
            elseif ($extension -eq ".webp") { $contentType = "image/webp" }
            
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 File Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
