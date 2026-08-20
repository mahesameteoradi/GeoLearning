import codecs

def fix_and_convert(filepath):
    try:
        with codecs.open(filepath, 'r', encoding='latin-1') as f:
            content = f.read()
            
        # Fix the syntax error we introduced with backticks escaping
        content = content.replace("const ext = . + f.name.split('.').pop()?.toLowerCase()", "const ext = .")
        content = content.replace("if (!currentTab.accept.includes(ext)) { toast.error(Format tidak didukung untuk tipe  + currentTab.label); return }", "if (!currentTab.accept.includes(ext)) { toast.error(Format tidak didukung untuk tipe ); return }")
        content = content.replace("const path =  ank-materials/ + Date.now() + _ + Math.random().toString(36).substring(2, 8) + . + ext", "const path = ank-materials/_.")
        
        # Write back as utf-8
        with codecs.open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")
    except Exception as e:
        print(f"Error {filepath}: {e}")

fix_and_convert('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend/components/teacher/UploadBankResourceModal.tsx')
fix_and_convert('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend/components/teacher/ResourceBankClient.tsx')
fix_and_convert('d:/SEMESTER 8/geo_LearningMedia/geolearning-frontend/components/teacher/ResourceBankModal.tsx')
