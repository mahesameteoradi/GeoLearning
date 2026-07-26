$frontendPath = "D:\SEMESTER 8\geo_LearningMedia\geolearning-frontend"

$files = Get-ChildItem -Recurse -Include "*.tsx","*.ts" "$frontendPath\app","$frontendPath\components" | 
         Where-Object { -not $_.PSIsContainer }

# ─── Replacement Map: dark-theme → light-theme ───────────────────────────────
$replacements = @(
  # === Backgrounds ===
  @{ From='bg-\[#0A0A14\]';            To='bg-[#F8FAFC]' },
  @{ From='bg-\[#0a0a14\]';            To='bg-[#F8FAFC]' },
  @{ From='bg-\[#050d1a\]';            To='bg-[#F8FAFC]' },
  @{ From='bg-\[#0d0d1a\]';            To='bg-white' },
  @{ From='bg-\[#0f0f1a\]';            To='bg-white' },
  @{ From='bg-\[#0F0F1A\]';            To='bg-[#F8FAFC]' },
  @{ From='bg-\[#181828\]';            To='bg-slate-50' },
  @{ From='bg-\[#13131f\]';            To='bg-white' },
  @{ From='bg-\[#1e1e30\]';            To='bg-slate-50' },
  @{ From='bg-\[#0c0c18\]';            To='bg-white' },
  @{ From='bg-\[#0a0a15\]';            To='bg-[#F8FAFC]' },
  @{ From='bg-\[#0f0f1a\]';            To='bg-white' },
  @{ From='bg-\[#1A1A2E\]';            To='bg-slate-50' },
  @{ From='bg-\[#071628\]';            To='bg-slate-50' },
  @{ From='bg-\[#0c1f38\]';            To='bg-slate-50' },
  @{ From='bg-\[#112244\]';            To='bg-white' },

  # === Semi-transparent whites (dark-mode glass) → proper light surfaces ===
  @{ From="bg-white/\[0\.02\]";        To='bg-slate-50' },
  @{ From="bg-white/\[0\.03\]";        To='bg-slate-50' },
  @{ From="bg-white/\[0\.04\]";        To='bg-slate-100' },
  @{ From="bg-white/\[0\.05\]";        To='bg-slate-100' },
  @{ From="bg-white/\[0\.06\]";        To='bg-slate-100' },
  @{ From="bg-white/\[0\.07\]";        To='bg-slate-100' },
  @{ From="bg-white/\[0\.08\]";        To='bg-slate-100' },
  @{ From='bg-white/10';               To='bg-slate-100' },
  @{ From='bg-white/\[0\.15\]';        To='bg-slate-200' },

  # === Dark borders → light borders ===
  @{ From='border-white/\[0\.05\]';    To='border-slate-100' },
  @{ From='border-white/\[0\.06\]';    To='border-slate-200' },
  @{ From='border-white/\[0\.07\]';    To='border-slate-200' },
  @{ From='border-white/\[0\.08\]';    To='border-slate-200' },
  @{ From='border-white/\[0\.1\]';     To='border-slate-200' },
  @{ From='border-white/10';           To='border-slate-200' },
  @{ From='border-white/\[0\.2\]';     To='border-slate-300' },
  @{ From='border-white/20';           To='border-slate-300' },
  @{ From='border-dashed border-white/10'; To='border-dashed border-slate-200' },
  @{ From='border-dashed border-white/\[0\.06\]'; To='border-dashed border-slate-200' },

  # === Text: light-theme → dark-theme text ===
  @{ From='text-slate-100';            To='text-slate-900' },
  @{ From='text-slate-200';            To='text-slate-800' },

  # === Text-white on non-button elements ===
  # (careful - we don't want to break button text-white)

  # === Placeholder dark → placeholder light ===
  @{ From='placeholder-slate-600';     To='placeholder-slate-400' },
  @{ From='placeholder-slate-500';     To='placeholder-slate-400' },

  # === Violet/purple active states → blue ===
  @{ From='text-violet-400';           To='text-blue-600' },
  @{ From='text-violet-300';           To='text-blue-700' },
  @{ From='text-violet-200';           To='text-blue-800' },
  @{ From='text-fuchsia-600';          To='text-sky-600' },
  @{ From='border-violet-500/50';      To='border-blue-500/50' },
  @{ From='border-violet-500/25';      To='border-blue-300' },
  @{ From='border-violet-500/30';      To='border-blue-300' },
  @{ From='border-violet-500/60';      To='border-blue-500' },
  @{ From='bg-violet-600/20';          To='bg-blue-100' },
  @{ From='bg-violet-600/25';          To='bg-blue-100' },
  @{ From='bg-violet-500/\[0\.08\]';   To='bg-blue-50' },
  @{ From='bg-violet-500/\[0\.15\]';   To='bg-blue-100' },
  @{ From='bg-violet-500/15';          To='bg-blue-100' },
  @{ From='bg-violet-600';             To='bg-blue-600' },
  @{ From='hover:bg-violet-700';       To='hover:bg-blue-700' },
  @{ From='hover:bg-violet-500';       To='hover:bg-blue-500' },
  @{ From='hover:text-violet-400';     To='hover:text-blue-600' },
  @{ From='hover:border-violet-500';   To='hover:border-blue-500' },
  @{ From='hover:border-violet-500/30'; To='hover:border-blue-300' },
  @{ From='hover:border-violet-500/25'; To='hover:border-blue-300' },
  @{ From='ring-violet-500/20';        To='ring-blue-500/20' },
  @{ From='ring-violet-500/50';        To='ring-blue-500/50' },
  @{ From='ring-1 ring-violet-500';    To='ring-1 ring-blue-500' },
  @{ From='shadow-violet-900/30';      To='shadow-blue-600/20' },
  @{ From='focus:border-violet-500';   To='focus:border-blue-500' },
  @{ From='focus:border-violet-500/60'; To='focus:border-blue-500' },
  @{ From='focus:ring-1 focus:ring-violet-500/20'; To='focus:ring-1 focus:ring-blue-500/20' },
  @{ From='from-violet-600';           To='from-blue-600' },
  @{ From='from-violet-600/30';        To='from-blue-600/20' },
  @{ From='to-fuchsia-600';            To='to-sky-500' },
  @{ From='to-fuchsia-600/30';         To='to-sky-500/20' },
  @{ From='border-violet-500/20';      To='border-blue-300' },
  @{ From='bg-violet-500/\[0\.06\]';   To='bg-blue-50' },
  @{ From='text-violet-400';           To='text-blue-600' }
)

$count = 0
foreach ($file in $files) {
  $content = Get-Content -Path $file.FullName -Raw -Encoding UTF8
  $original = $content

  foreach ($r in $replacements) {
    $content = $content -replace $r.From, $r.To
  }

  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($file.Name)"
    $count++
  }
}

Write-Host ""
Write-Host "Done! Updated $count files."
