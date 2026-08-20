import re

with open('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend/components/teacher/ClassDetailClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove 'bank' from UPLOAD_TABS
content = re.sub(r" \| 'bank'", "", content)
content = re.sub(r"  \{ key: 'bank',  label: 'Dari Bank',  icon: BookMarked,   accept: '',                     dbType: 'BANK'  \},\n", "", content)

# Remove bankItems and loadingBank states from UploadMaterialModal
content = re.sub(r"  const \[bankItems, setBankItems\] = useState<any\[\]>\(\[\]\)\n", "", content)
content = re.sub(r"  const \[loadingBank, setLoadingBank\] = useState\(false\)\n", "", content)
content = re.sub(r"  const \[selectedBankItem, setSelectedBankItem\] = useState<any \| null>\(null\)\n", "", content)

# Remove useEffect for fetching bank items
content = re.sub(r"  useEffect\(\(\) => \{\n    if \(tab === 'bank' && teacherId\) \{\n      setLoadingBank\(true\)\n      const supabase = createClient\(\)\n      supabase\.from\('teacher_resources'\)\.select\('\*'\)\.eq\('teacher_id', teacherId\)\.order\('created_at', \{ ascending: false \}\)\n        \.then\(\(\{ data \}\) => \{\n          if \(data\) setBankItems\(data\)\n          setLoadingBank\(false\)\n        \}\)\n    \}\n  \}, \[tab, teacherId\]\)\n\n", "", content)

# Remove isBank var
content = re.sub(r"  const isBank = tab === 'bank'\n", "", content)

# Remove auto-save to bank logic in handleSubmit
auto_save_regex = r"        if \(teacherId && !isBank\).*?\}\n"
content = re.sub(r"        if \(teacherId && !isBank\) \{\n          // Resolve module title for the bank\n          const modTitle = selectedModuleId === 'new' \? newModuleTitle\.trim\(\) : existingModules\.find\(m => m\.id === selectedModuleId\)\?\.title;\n          \n          // Auto-save to TeacherResource bank\n          const \{ error: saveErr \} = await supabase\.from\('teacher_resources'\)\.insert\(\{\n            id: crypto\.randomUUID\(\),\n            teacher_id: teacherId,\n            title: title\.trim\(\),\n            type: finalType,\n            file_url: finalUrl,\n            description: description\.trim\(\) \|\| null,\n            content: \{ chapter: modTitle \|\| 'Tanpa Kategori' \}\n          \}\)\n          if \(saveErr\) console\.error\('Gagal auto-save ke bank:', saveErr\)\n        \}\n", "", content, flags=re.DOTALL)

# Simplify button disabled state
content = re.sub(r"disabled=\{uploading \|\| !title\.trim\(\) \|\| \(isBank \? !selectedBankItem : isLink \? !linkUrl\.trim\(\) : \(\!file && !editMaterial\)\)\}", "disabled={uploading || !title.trim() || (isLink ? !linkUrl.trim() : (!file && !editMaterial))}", content)

# Remove the isBank rendering block
is_bank_block = r"            \{isBank \? \(\n              <div>.*?</div>\n              </div>\n            \) : \(\n              <div \n"
# Actually it's easier to just do it via string replace for the UI part, let's find the exact block.
