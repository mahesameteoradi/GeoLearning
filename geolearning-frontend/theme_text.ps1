$frontendPath = "D:\SEMESTER 8\geo_LearningMedia\geolearning-frontend"

$files = Get-ChildItem -Recurse -Include "*.tsx","*.ts" "$frontendPath\app","$frontendPath\components" | 
         Where-Object { -not $_.PSIsContainer }

$replacements = @(
  # Replace header text colors
  @{ From='text-xl font-bold text-white'; To='text-xl font-bold text-slate-900' },
  @{ From='text-xl font-extrabold text-white'; To='text-xl font-extrabold text-slate-900' },
  @{ From='text-2xl font-extrabold tracking-tight text-white'; To='text-2xl font-extrabold tracking-tight text-slate-900' },
  @{ From='text-sm font-bold text-white truncate'; To='text-sm font-bold text-slate-900 truncate' },
  @{ From='text-sm font-bold text-white line-clamp-2'; To='text-sm font-bold text-slate-900 line-clamp-2' },
  @{ From='text-xs font-semibold text-white truncate'; To='text-xs font-semibold text-slate-900 truncate' },
  @{ From='font-bold text-white group-hover'; To='font-bold text-slate-900 group-hover' },
  @{ From='text-white flex items-center gap-2'; To='text-slate-900 flex items-center gap-2' },
  
  # Replace generic text colors that were white on dark bg
  @{ From='text-slate-200'; To='text-slate-700' },
  @{ From='text-slate-300'; To='text-slate-700' },
  @{ From='text-slate-400'; To='text-slate-500' },
  @{ From='text-slate-500'; To='text-slate-500' } # just for alignment
)

$count = 0
foreach ($file in $files) {
  $content = [System.IO.File]::ReadAllText($file.FullName)
  $original = $content

  foreach ($r in $replacements) {
    $content = $content -replace $r.From, $r.To
  }

  if ($content -ne $original) {
    [System.IO.File]::WriteAllText($file.FullName, $content)
    Write-Host "Updated text colors: $($file.Name)"
    $count++
  }
}

Write-Host "Done text colors! Updated $count files."
