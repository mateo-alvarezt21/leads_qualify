$src = "C:\Users\Chingoteo\Desktop\LeadQuality"
$dst = "C:\Users\Chingoteo\Desktop\LeadQuality-deploy.zip"
$exclude = @("node_modules", ".next", ".git", "data", "nul", "tsconfig.tsbuildinfo", ".claude", "make-zip.ps1")

if (Test-Path $dst) { Remove-Item $dst -Force }

$files = Get-ChildItem -Path $src -Recurse -File | Where-Object {
    $relPath = $_.FullName.Substring($src.Length + 1)
    $skip = $false
    foreach ($e in $exclude) {
        if ($relPath.StartsWith("$e\") -or $relPath -eq $e) {
            $skip = $true
            break
        }
    }
    -not $skip
}

$files | Compress-Archive -DestinationPath $dst
Write-Host "Done: $($files.Count) files"
