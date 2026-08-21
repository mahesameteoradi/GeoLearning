'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  LogOut, Users, KeyRound, Loader2, RefreshCw, 
  BookOpen, FileText, ShieldCheck, UserCheck, 
  AlertTriangle, GraduationCap, Clock, Edit, Trash2, X, Eye, EyeOff,
  Folder, FileQuestion, ChevronDown, ChevronUp, Upload, FileSpreadsheet, Download,
  Search, Filter
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import * as XLSX from 'xlsx'

// --- Interfaces ---
interface Teacher {
  id: string; name: string; email: string; nis_nip: string | null;
  verification_status: 'UNVERIFIED' | 'VERIFIED' | 'SUSPENDED'; created_at: string
}
interface Student {
  id: string; name: string; email: string;
  nis_nip: string | null; school_class: string | null; created_at: string;
  enrollments: { class: { name: string } }[]
}
interface ClassModel {
  id: string; name: string; description: string | null;
  teacher: { name: string; email: string } | null; _count: { enrollments: number }
}
interface BankSoalModel {
  id: string; name: string;
  teacher: { name: string; email: string } | null;
  quizzes: { id: string; title: string; _count: { questions: number } }[];
  modules: { id: string; title: string; materials: { id: string; title: string; type: string }[] }[];
}

type TabType = 'dashboard' | 'teachers' | 'students' | 'classes' | 'quizzes'

export function AdminClient({ user }: { user: any }) {
  const router = useRouter()
  const supabase = createClient()
  
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<ClassModel[]>([])
  const [quizzes, setQuizzes] = useState<BankSoalModel[]>([])
  
  const [expandedClasses, setExpandedClasses] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const [showAddTeacher, setShowAddTeacher] = useState(false)
  const [newTeacher, setNewTeacher] = useState({ name: '', email: '', password: '', nis_nip: '' })
  const [creatingTeacher, setCreatingTeacher] = useState(false)

  const [editingTeacher, setEditingTeacher] = useState<Teacher & { password?: string } | null>(null)
  const [updatingTeacher, setUpdatingTeacher] = useState(false)
  const [showEditPassword, setShowEditPassword] = useState(false)
  
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null)
  const [deletingTeacher, setDeletingTeacher] = useState(false)

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, success: 0, failed: 0 })

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterClass, setFilterClass] = useState('ALL')
  const [filterTeacher, setFilterTeacher] = useState('ALL')

  useEffect(() => {
    setSearchQuery('')
    setFilterStatus('ALL')
    setFilterClass('ALL')
    setFilterTeacher('ALL')
  }, [activeTab])

  const fetchAllData = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true)
    setIsRefreshing(true)
    
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (!token) return

    try {
      const [tRes, sRes, cRes, qRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/quizzes`, { headers: { Authorization: `Bearer ${token}` } })
      ])

      if (tRes.ok) setTeachers(await tRes.json())
      if (sRes.ok) setStudents(await sRes.json())
      if (cRes.ok) setClasses(await cRes.json())
      if (qRes.ok) setQuizzes(await qRes.json())
      
      setLastRefresh(new Date())
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat sebagian data')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [supabase])

  // Initial load and polling
  useEffect(() => {
    fetchAllData(true)
    // Poll every 10 seconds seamlessly
    const interval = setInterval(() => fetchAllData(false), 10000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  // --- API Actions ---
  async function performAction(url: string, method: string, successMsg: string, body?: any) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    try {
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          ...(body ? { 'Content-Type': 'application/json' } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      })
      if (res.ok) {
        toast.success(successMsg)
        fetchAllData(false)
      } else {
        const err = await res.json()
        toast.error(err.message || 'Gagal melakukan aksi')
      }
    } catch (err) {
      toast.error('Terjadi kesalahan jaringan')
    }
  }

  const verifyTeacher = (id: string) => performAction(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers/${id}/verify`, 'POST', 'Guru diverifikasi!')
  const suspendTeacher = (id: string) => performAction(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers/${id}/suspend`, 'POST', 'Guru ditangguhkan!')

  async function createTeacher(e: React.FormEvent) {
    e.preventDefault()
    setCreatingTeacher(true)
    await performAction(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers`, 'POST', 'Akun guru berhasil dibuat!', newTeacher)
    setNewTeacher({ name: '', email: '', password: '', nis_nip: '' })
    setShowAddTeacher(false)
    setCreatingTeacher(false)
  }

  async function updateTeacherData(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTeacher) return
    setUpdatingTeacher(true)
    
    // Only send password if it was typed
    const payload = { ...editingTeacher }
    if (!payload.password) delete payload.password
    
    await performAction(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers/${editingTeacher.id}`, 'PUT', 'Data guru berhasil diperbarui!', payload)
    setEditingTeacher(null)
    setUpdatingTeacher(false)
  }

  async function deleteTeacherAccount() {
    if (!teacherToDelete) return
    setDeletingTeacher(true)
    await performAction(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers/${teacherToDelete.id}`, 'DELETE', 'Akun guru berhasil dihapus!')
    setTeacherToDelete(null)
    setDeletingTeacher(false)
  }

  // --- Excel Import Actions ---
  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      { "Nama Lengkap": "Budi Santoso", "NIP": "198001012005011003", "Email": "budi@sekolah.sch.id", "Kata Sandi": "password123" },
      { "Nama Lengkap": "Siti Aminah", "NIP": "", "Email": "siti.aminah@gmail.com", "Kata Sandi": "rahasia123" }
    ])
    // Make columns wider
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 30 }, { wch: 20 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Template Guru")
    XLSX.writeFile(wb, "Template_Import_Guru.xlsx")
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws)
        if (data.length === 0) return toast.error("File Excel kosong!")
        
        // Map excel columns to expected keys
        const mappedData = data.map((row: any) => ({
          name: row['Nama Lengkap'] || row['NAMA LENGKAP'] || row['name'] || '',
          nis_nip: row['NIP'] || row['NIP / NUPTK'] || row['nis_nip'] || '',
          email: row['Email'] || row['EMAIL'] || row['email'] || '',
          password: row['Kata Sandi'] || row['KATA SANDI'] || row['password'] || ''
        })).filter(row => row.name && row.email && row.password) // Filter out empty rows
        
        if (mappedData.length === 0) {
          return toast.error("Format tidak valid! Pastikan ada kolom Nama Lengkap, Email, dan Kata Sandi.")
        }
        
        setImportPreview(mappedData)
      } catch (err) {
        toast.error("Gagal membaca file Excel")
      }
    }
    reader.readAsBinaryString(file)
  }

  async function processImport() {
    if (importPreview.length === 0) return
    setIsImporting(true)
    setImportProgress({ current: 0, total: importPreview.length, success: 0, failed: 0 })
    
    let successCount = 0
    let failCount = 0

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    for (let i = 0; i < importPreview.length; i++) {
      setImportProgress(prev => ({ ...prev, current: i + 1 }))
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/teachers`, {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(importPreview[i])
        })
        if (res.ok) successCount++
        else failCount++
      } catch {
        failCount++
      }
    }

    setImportProgress(prev => ({ ...prev, success: successCount, failed: failCount }))
    setIsImporting(false)
    fetchAllData(false)
    if (failCount === 0) {
      toast.success(`Berhasil mengimpor ${successCount} guru!`)
      setTimeout(() => closeImportModal(), 1500)
    } else {
      toast.error(`${successCount} berhasil, ${failCount} gagal. Email mungkin sudah terdaftar.`)
    }
  }

  function closeImportModal() {
    setShowImportModal(false)
    setImportPreview([])
    setIsImporting(false)
    setImportProgress({ current: 0, total: 0, success: 0, failed: 0 })
  }

  // --- UI Components ---
  const unverifiedCount = teachers.filter(t => t.verification_status === 'UNVERIFIED').length

  // --- Derived Filtered Data ---
  const filteredTeachers = teachers.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = filterStatus === 'ALL' || t.verification_status === filterStatus
    return matchSearch && matchFilter
  })

  const filteredStudents = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = filterClass === 'ALL' || s.enrollments.some(e => e.class.name === filterClass)
    return matchSearch && matchFilter
  })

  const filteredClasses = classes.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchFilter = filterTeacher === 'ALL' || c.teacher?.name === filterTeacher
    return matchSearch && matchFilter
  })

  const filteredQuizzes = quizzes.filter(cls => {
    const matchSearch = cls.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cls.quizzes.some(q => q.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      cls.modules.some(m => m.materials.some(mat => mat.title.toLowerCase().includes(searchQuery.toLowerCase())))
    return matchSearch
  })

  const uniqueStudentClasses = Array.from(new Set(students.flatMap(s => s.enrollments.map(e => e.class.name))))
  const uniqueTeachers = Array.from(new Set(classes.map(c => c.teacher?.name).filter(Boolean)))

  const StatCard = ({ title, value, icon: Icon, colorClass, gradient }: any) => (
    <div className={`relative overflow-hidden rounded-2xl border border-white/40 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full ${gradient} opacity-20 blur-2xl transition-all group-hover:opacity-40`} />
      <div className="flex items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass} bg-opacity-10 backdrop-blur-sm`}>
          <Icon className={`h-7 w-7 ${colorClass.replace('bg-', 'text-').replace('-100', '-600')}`} />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-3xl font-black text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  )

  const NavItem = ({ id, label, icon: Icon, badge }: any) => {
    const active = activeTab === id
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 transition-all ${
          active 
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
        }`}
      >
        <div className="flex items-center gap-3 font-semibold">
          <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
          {label}
        </div>
        {badge > 0 && (
          <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
            active ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
          }`}>
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
      
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-600 to-rose-500 shadow-lg shadow-red-500/30">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-800">Super Admin</h1>
              <p className="text-xs font-medium text-slate-500">System Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1.5 px-4 py-2 overflow-y-auto">
          <NavItem id="dashboard" label="Overview" icon={Clock} />
          <div className="pt-4 pb-2 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Pengguna</div>
          <NavItem id="teachers" label="Manajemen Guru" icon={UserCheck} badge={unverifiedCount} />
          <NavItem id="students" label="Manajemen Siswa" icon={GraduationCap} />
          <div className="pt-4 pb-2 px-4 text-xs font-bold uppercase tracking-wider text-slate-400">Akademik</div>
          <NavItem id="classes" label="Data Kelas" icon={BookOpen} />
          <NavItem id="quizzes" label="Bank Soal" icon={FileText} />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 font-semibold text-slate-600 transition-all hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="flex h-20 items-center justify-between px-8 bg-white/60 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
            {activeTab === 'dashboard' ? 'Dashboard Overview' : 
             activeTab === 'teachers' ? 'Manajemen Guru' :
             activeTab === 'students' ? 'Manajemen Siswa' :
             activeTab === 'classes' ? 'Data Master Kelas' :
             'Bank Soal Sistem'}
          </h2>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              Live Sync
            </span>
            <span className="text-xs text-slate-400">
              Diperbarui {formatDistanceToNow(lastRefresh, { locale: idLocale, addSuffix: true })}
            </span>
            <button
              onClick={() => fetchAllData(false)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-blue-600 focus:outline-none"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {loading && teachers.length === 0 ? (
             <div className="flex h-64 items-center justify-center">
               <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
             </div>
          ) : (
            <div className="mx-auto max-w-6xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Dashboard Stats */}
              {(activeTab === 'dashboard' || activeTab === 'teachers' || activeTab === 'students') && (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard title="Total Guru" value={teachers.length} icon={UserCheck} colorClass="bg-blue-100" gradient="bg-blue-400" />
                  <StatCard title="Total Siswa" value={students.length} icon={GraduationCap} colorClass="bg-green-100" gradient="bg-green-400" />
                  <StatCard title="Total Kelas" value={classes.length} icon={BookOpen} colorClass="bg-amber-100" gradient="bg-amber-400" />
                  <StatCard title="Total Kuis" value={quizzes.length} icon={FileText} colorClass="bg-purple-100" gradient="bg-purple-400" />
                </div>
              )}

              {/* Teachers Tab */}
              {activeTab === 'teachers' && (
                <div className="space-y-6">
                  {showAddTeacher && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-slate-800">Generate Akun Guru</h3>
                      </div>
                      <form onSubmit={createTeacher} className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Nama Lengkap</label>
                          <input type="text" required value={newTeacher.name} onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="Budi Santoso, S.Pd" />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">NIP / NUPTK (Opsional)</label>
                          <input type="text" value={newTeacher.nis_nip} onChange={e => setNewTeacher({ ...newTeacher, nis_nip: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="1980XXXX..." />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Alamat Email</label>
                          <input type="email" required value={newTeacher.email} onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="budi@sekolah.sch.id" />
                        </div>
                        <div>
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Kata Sandi</label>
                          <input type="password" required value={newTeacher.password} onChange={e => setNewTeacher({ ...newTeacher, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="••••••••" minLength={6} />
                        </div>
                        <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                          <button type="button" onClick={() => setShowAddTeacher(false)} className="rounded-xl px-6 py-3 font-bold text-slate-600 transition hover:bg-slate-50">Batal</button>
                          <button type="submit" disabled={creatingTeacher} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
                            {creatingTeacher ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buat Akun'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-white flex justify-between items-center">
                      <h3 className="font-bold text-slate-800">Daftar Guru Terdaftar</h3>
                      <div className="flex gap-2">
                        <button onClick={() => setShowImportModal(true)} className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-2 text-sm font-bold text-green-600 transition hover:bg-green-100 border border-green-200">
                          <FileSpreadsheet className="h-4 w-4" /> Import Excel
                        </button>
                        <button onClick={() => setShowAddTeacher(!showAddTeacher)} className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800 shadow-md shadow-slate-800/20">
                          + Tambah Guru
                        </button>
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type="text" placeholder="Cari nama atau email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition" />
                      </div>
                      <div className="relative sm:max-w-[240px]">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm appearance-none bg-white transition cursor-pointer">
                          <option value="ALL">Semua Status</option>
                          <option value="VERIFIED">Terverifikasi</option>
                          <option value="UNVERIFIED">Belum Verifikasi</option>
                          <option value="SUSPENDED">Ditangguhkan</option>
                        </select>
                      </div>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Informasi Guru</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Tgl Daftar</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredTeachers.length > 0 ? filteredTeachers.map(teacher => (
                          <tr key={teacher.id} className="transition-colors hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{teacher.name}</div>
                              <div className="text-slate-500">{teacher.email}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                                teacher.verification_status === 'VERIFIED' ? 'bg-green-100 text-green-700' :
                                teacher.verification_status === 'UNVERIFIED' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {teacher.verification_status === 'UNVERIFIED' && <AlertTriangle className="h-3 w-3" />}
                                {teacher.verification_status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {new Date(teacher.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingTeacher(teacher)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100" title="Edit">
                                  <Edit className="h-4 w-4" />
                                </button>
                                {teacher.verification_status !== 'VERIFIED' && (
                                  <button onClick={() => verifyTeacher(teacher.id)} className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-bold text-green-600 transition hover:bg-green-100">
                                    Verifikasi
                                  </button>
                                )}
                                {teacher.verification_status !== 'SUSPENDED' && (
                                  <button onClick={() => suspendTeacher(teacher.id)} className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100">
                                    Tangguhkan
                                  </button>
                                )}
                                <button onClick={() => setTeacherToDelete(teacher)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100" title="Hapus">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">Tidak ada guru ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              )}

              {/* Students Tab */}
              {activeTab === 'students' && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800">Daftar Siswa Terdaftar</h3>
                  </div>
                  <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="text" placeholder="Cari nama atau email siswa..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition" />
                    </div>
                    <div className="relative sm:max-w-[240px]">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm appearance-none bg-white transition cursor-pointer">
                        <option value="ALL">Semua Kelas</option>
                        {uniqueStudentClasses.map((c, i) => (
                          <option key={i} value={c as string}>{c as string}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Informasi Siswa</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">NIS</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Kelas Terdaftar</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Tgl Daftar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredStudents.length > 0 ? filteredStudents.map(student => (
                          <tr key={student.id} className="transition-colors hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{student.name}</div>
                              <div className="text-slate-500">{student.email}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600 font-medium">{student.nis_nip || '-'}</td>
                            <td className="px-6 py-4">
                              {student.enrollments.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {student.enrollments.map((e, i) => (
                                    <span key={i} className="rounded-md bg-blue-50 border border-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                                      {e.class?.name || 'Unknown'}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic">Belum masuk kelas</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-slate-500 font-medium">
                              {new Date(student.created_at).toLocaleDateString('id-ID')}
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 font-medium">Tidak ada siswa ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Classes Tab */}
              {activeTab === 'classes' && (
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-slate-100 bg-white">
                    <h3 className="font-bold text-slate-800">Daftar Kelas</h3>
                  </div>
                  <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="text" placeholder="Cari nama kelas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition" />
                    </div>
                    <div className="relative sm:max-w-[240px]">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <select value={filterTeacher} onChange={(e) => setFilterTeacher(e.target.value)} className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm appearance-none bg-white transition cursor-pointer">
                        <option value="ALL">Semua Guru</option>
                        {uniqueTeachers.map((t, i) => (
                          <option key={i} value={t as string}>{t as string}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Nama Kelas</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Guru Pengampu</th>
                          <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Jumlah Siswa</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredClasses.length > 0 ? filteredClasses.map(cls => (
                          <tr key={cls.id} className="transition-colors hover:bg-slate-50/50">
                            <td className="px-6 py-4">
                              <div className="font-bold text-slate-800">{cls.name}</div>
                              <div className="text-xs text-slate-500 truncate max-w-[300px] mt-0.5">{cls.description || 'Tidak ada deskripsi'}</div>
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-700">
                              {cls.teacher?.name ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold">
                                    {cls.teacher.name.charAt(0)}
                                  </div>
                                  {cls.teacher.name}
                                </div>
                              ) : 'Tidak ada'}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 font-bold text-slate-700">
                                <Users className="h-3 w-3 text-slate-400" />
                                {cls._count.enrollments}
                              </span>
                            </td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Tidak ada kelas ditemukan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Quizzes / Bank Soal Tab */}
              {activeTab === 'quizzes' && (
                <div className="space-y-6">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input type="text" placeholder="Cari bank soal berdasarkan nama kelas, judul kuis, atau materi..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 bg-white shadow-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition font-medium" />
                  </div>
                  {filteredQuizzes.length > 0 ? filteredQuizzes.map(cls => (
                    <div key={cls.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
                      <div 
                        className="flex cursor-pointer items-center justify-between p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedClasses(prev => ({ ...prev, [cls.id]: !prev[cls.id] }))}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shadow-inner">
                            <Folder className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-slate-800">{cls.name}</h3>
                            <p className="text-sm font-medium text-slate-500 mt-0.5">
                              Guru: <span className="text-blue-600 font-bold">{cls.teacher?.name || 'Tidak ada'}</span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 font-bold text-blue-700 text-xs border border-blue-100">
                              {cls.quizzes.length} Kuis
                            </span>
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 font-bold text-green-700 text-xs border border-green-100">
                              {cls.modules.reduce((acc, m) => acc + m.materials.length, 0)} Materi
                            </span>
                          </div>
                          {expandedClasses[cls.id] ? <ChevronUp className="h-5 w-5 text-slate-400" /> : <ChevronDown className="h-5 w-5 text-slate-400" />}
                        </div>
                      </div>

                      {expandedClasses[cls.id] && (
                        <div className="border-t border-slate-100 p-6 space-y-6 bg-white animate-in slide-in-from-top-2 duration-300">
                          
                          {/* Daftar Kuis */}
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                              <FileQuestion className="h-4 w-4" /> Daftar Kuis & Soal
                            </h4>
                            {cls.quizzes.length > 0 ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {cls.quizzes.map(quiz => (
                                  <div key={quiz.id} className="flex items-center justify-between rounded-xl border border-slate-100 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">
                                    <div className="font-bold text-slate-700">{quiz.title}</div>
                                    <span className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-600">
                                      {quiz._count.questions} Butir Soal
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm italic text-slate-400">Belum ada kuis di kelas ini.</p>
                            )}
                          </div>

                          {/* Daftar Materi */}
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" /> Daftar Modul & Materi
                            </h4>
                            {cls.modules.length > 0 ? (
                              <div className="space-y-4">
                                {cls.modules.map(module => (
                                  <div key={module.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                    <div className="font-bold text-slate-800 mb-2">{module.title}</div>
                                    {module.materials.length > 0 ? (
                                      <div className="flex flex-col gap-2">
                                        {module.materials.map(mat => (
                                          <div key={mat.id} className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                              <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                              <div className="text-sm font-semibold text-slate-700">{mat.title}</div>
                                              <div className="text-[10px] font-bold uppercase text-slate-400">{mat.type}</div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs italic text-slate-400">Modul ini belum memiliki materi.</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm italic text-slate-400">Belum ada modul di kelas ini.</p>
                            )}
                          </div>

                        </div>
                      )}
                    </div>
                  )) : (
                    <div className="flex h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
                      <Folder className="h-10 w-10 text-slate-300 mb-3" />
                      <p className="font-medium text-slate-500">Tidak ada bank soal ditemukan.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center bg-slate-800/40 p-4 py-8 md:py-12 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">Edit Data Guru</h3>
              <button onClick={() => setEditingTeacher(null)} className="text-slate-400 hover:text-slate-600 transition">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={updateTeacherData} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Nama Lengkap</label>
                  <input type="text" required value={editingTeacher.name} onChange={e => setEditingTeacher({ ...editingTeacher, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">NIP / NUPTK</label>
                  <input type="text" value={editingTeacher.nis_nip || ''} onChange={e => setEditingTeacher({ ...editingTeacher, nis_nip: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Alamat Email</label>
                  <input type="email" required value={editingTeacher.email} onChange={e => setEditingTeacher({ ...editingTeacher, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 transition" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Kata Sandi (Kosongkan untuk menggunakan sandi lama)</label>
                  <div className="relative">
                    <input type={showEditPassword ? 'text' : 'password'} value={editingTeacher.password || ''} onChange={e => setEditingTeacher({ ...editingTeacher, password: e.target.value })} className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-10 outline-none focus:border-blue-500 transition" placeholder="••••••••" minLength={6} />
                    <button type="button" tabIndex={-1} onClick={() => setShowEditPassword(!showEditPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                      {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">Status Akun</label>
                  <select value={editingTeacher.verification_status} onChange={e => setEditingTeacher({ ...editingTeacher, verification_status: e.target.value as any })} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500 transition">
                    <option value="VERIFIED">Terverifikasi</option>
                    <option value="UNVERIFIED">Belum Verifikasi</option>
                    <option value="SUSPENDED">Ditangguhkan</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingTeacher(null)} className="rounded-xl px-6 py-3 font-bold text-slate-600 transition hover:bg-slate-50">Batal</button>
                <button type="submit" disabled={updatingTeacher} className="rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70">
                  {updatingTeacher ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Teacher Modal */}
      {teacherToDelete && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center bg-slate-800/40 p-4 py-8 md:py-12 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black text-slate-800">Hapus Akun Guru?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Anda yakin ingin menghapus <b>{teacherToDelete.name}</b>? Tindakan ini akan mencabut akses masuk mereka. Data kelas dan soal akan dipindahtangankan ke Super Admin.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => setTeacherToDelete(null)} className="flex-1 rounded-xl bg-slate-50 py-3 font-bold text-slate-700 transition hover:bg-slate-200">
                Batal
              </button>
              <button onClick={deleteTeacherAccount} disabled={deletingTeacher} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-70">
                {deletingTeacher ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-start overflow-y-auto justify-center bg-slate-800/40 p-4 py-8 md:py-12 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100 text-green-600">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Import Data Guru (Excel)</h3>
              </div>
              {!isImporting && (
                <button onClick={closeImportModal} className="text-slate-400 hover:text-slate-600 transition">
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {!isImporting && importPreview.length === 0 && (
                <div className="space-y-6">
                  <div className="rounded-2xl bg-blue-50 p-4 border border-blue-100">
                    <h4 className="font-bold text-blue-800 mb-1">Langkah 1: Unduh Template</h4>
                    <p className="text-sm text-blue-600 mb-3">Gunakan template Excel standar kami untuk memastikan data terbaca dengan sempurna.</p>
                    <button onClick={downloadTemplate} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-blue-600 shadow-sm transition hover:bg-blue-600 hover:text-white border border-blue-200">
                      <Download className="h-4 w-4" /> Unduh Template .xlsx
                    </button>
                  </div>

                  <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center hover:bg-slate-50 transition">
                    <Upload className="mx-auto h-10 w-10 text-slate-400 mb-3" />
                    <h4 className="font-bold text-slate-700 mb-1">Langkah 2: Unggah File Excel</h4>
                    <p className="text-sm text-slate-500 mb-4">Pilih file .xlsx yang sudah Anda isi</p>
                    <label className="cursor-pointer inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 shadow-md shadow-green-600/20">
                      Pilih File
                      <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                </div>
              )}

              {!isImporting && importPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-800">Pratinjau Data ({importPreview.length} Guru)</h4>
                    <button onClick={() => setImportPreview([])} className="text-sm font-semibold text-red-500 hover:text-red-700">Pilih File Lain</button>
                  </div>
                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold uppercase">Nama</th>
                          <th className="px-4 py-3 font-semibold uppercase">Email</th>
                          <th className="px-4 py-3 font-semibold uppercase">Sandi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {importPreview.slice(0, 5).map((row, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                            <td className="px-4 py-3 text-slate-500">{row.email}</td>
                            <td className="px-4 py-3 text-slate-400">••••••••</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreview.length > 5 && (
                      <div className="bg-slate-50 px-4 py-2 text-center text-xs font-semibold text-slate-500 border-t border-slate-100">
                        + {importPreview.length - 5} data lainnya...
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700 border border-amber-200 flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p>Pastikan email belum terdaftar sebelumnya. Data akan diimpor secara sekuensial.</p>
                  </div>
                </div>
              )}

              {isImporting && (
                <div className="py-12 text-center space-y-6">
                  <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
                  <div>
                    <h4 className="text-lg font-black text-slate-800">Sedang Mengimpor...</h4>
                    <p className="text-slate-500 mt-1">Mohon jangan tutup halaman ini.</p>
                  </div>
                  <div className="max-w-xs mx-auto">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                      <span>Proses: {importProgress.current} / {importProgress.total}</span>
                      <span>{Math.round((importProgress.current / (importProgress.total || 1)) * 100)}%</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(importProgress.current / (importProgress.total || 1)) * 100}%` }}
                      />
                    </div>
                    {(importProgress.success > 0 || importProgress.failed > 0) && (
                      <div className="flex justify-center gap-4 mt-4 text-sm font-semibold">
                        <span className="text-green-600">{importProgress.success} Sukses</span>
                        <span className="text-red-500">{importProgress.failed} Gagal</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isImporting && importPreview.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button onClick={closeImportModal} className="rounded-xl px-6 py-3 font-bold text-slate-600 transition hover:bg-slate-200">
                  Batal
                </button>
                <button onClick={processImport} className="rounded-xl bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700 shadow-lg shadow-green-600/30">
                  Mulai Import {importPreview.length} Guru
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
