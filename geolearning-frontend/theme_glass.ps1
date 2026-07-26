$frontendPath = "D:\SEMESTER 8\geo_LearningMedia\geolearning-frontend"

$files = Get-ChildItem -Recurse -Include "*.tsx","*.ts" "$frontendPath\app","$frontendPath\components" | 
         Where-Object { -not $_.PSIsContainer }

$count = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  # Replace bg-color-number/opacity with bg-color-50
  $content = [regex]::Replace($content, 'bg-([a-z]+)-[0-9]+/(?:\[[0-9.]+\]|[0-9]+)', 'bg-$1-50')
  
  # Replace border-color-number/opacity with border-color-200
  $content = [regex]::Replace($content, 'border-([a-z]+)-[0-9]+/(?:\[[0-9.]+\]|[0-9]+)', 'border-$1-200')
  
  # Replace text-color-300 or text-color-400 with text-color-600 (since dark theme used lighter text, light theme needs darker text)
  $content = [regex]::Replace($content, 'text-emerald-[34]00', 'text-emerald-600')
  $content = [regex]::Replace($content, 'text-cyan-[34]00', 'text-cyan-600')
  $content = [regex]::Replace($content, 'text-amber-[34]00', 'text-amber-600')
  $content = [regex]::Replace($content, 'text-red-[34]00', 'text-red-600')
  $content = [regex]::Replace($content, 'text-orange-[34]00', 'text-orange-600')
  $content = [regex]::Replace($content, 'text-pink-[34]00', 'text-pink-600')
  $content = [regex]::Replace($content, 'text-sky-[34]00', 'text-sky-600')

  # Clean up hover:bg-color-number/opacity -> hover:bg-color-100
  $content = [regex]::Replace($content, 'hover:bg-([a-z]+)-[0-9]+/(?:\[[0-9.]+\]|[0-9]+)', 'hover:bg-$1-100')

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Updated glassmorphism: $($file.Name)"
    $count++
  }
}

Write-Host "Done glassmorphism! Updated $count files."
