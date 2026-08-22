'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, UserPlus, UploadCloud, Loader2, Download, Search, Edit2, Trash2, Unlock } from 'lucide-react'
import { ImportSiswaModal } from './ImportSiswaModal'
import { AddSiswaModal } from './AddSiswaModal'
import { EditSiswaModal } from './EditSiswaModal'
import { UnlockModuleModal } from './UnlockModuleModal'
import { LogoLoader } from '@/components/ui/LogoLoader'
import toast from 'react-hot-toast'
import { useConfirm } from '@/components/ui/ConfirmProvider'

interface ClassStudent {
  id: string
  no_absen: number | null
  joined_at: string
  student: {
    id: string
    name: string
    email: string
    nis_nip: string | null
  }
}

export function ClassStudentsPanel({ classId }: { classId: string }) {
  const { confirm } = useConfirm()
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editStudent, setEditStudent] = useState<ClassStudent | null>(null)
  const [unlockStudent, setUnlockStudent] = useState<ClassStudent | null>(null)
  const [search, setSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const [teacherId, setTeacherId] = useState<string | null>(null)

  useEffect(() => {
    const getTeacherId = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setTeacherId(data.user.id)
      }
    }
    getTeacherId()
  }, [])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('class_students')
      .select(`
        id, no_absen, joined_at,
        student:users!student_id(id, name, email, nis_nip)
      `)
      .eq('class_id', classId)
      .order('no_absen', { ascending: true })

    if (!error && data) {
      setStudents(data as unknown as ClassStudent[])
    }
    setLoading(false)
  }, [classId])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const filteredStudents = students.filter(s => 
    s.student.name.toLowerCase().includes(search.toLowerCase()) ||
    s.student.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.student.nis_nip && s.student.nis_nip.toLowerCase().includes(search.toLowerCase()))
  )

  const handleDelete = async (studentId: string, studentName: string) => {
    const isConfirmed = await confirm({
      title: 'Keluarkan Siswa',
      message: `Apakah Anda yakin ingin mengeluarkan ${studentName} dari kelas ini?`,
      confirmText: 'Ya, Keluarkan',
      variant: 'danger'
    })
    if (!isConfirmed) return
    
    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kelas/${classId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        }
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal menghapus siswa')
      }

      toast.success('Siswa berhasil dihapus dari kelas')
      setSelectedStudents(prev => prev.filter(id => id !== studentId))
      fetchStudents()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return
    const isConfirmed = await confirm({
      title: 'Keluarkan Siswa Terpilih',
      message: `Apakah Anda yakin ingin mengeluarkan ${selectedStudents.length} siswa yang dipilih dari kelas ini?`,
      confirmText: 'Ya, Keluarkan',
      variant: 'danger'
    })
    if (!isConfirmed) return
    
    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { data: sessionData } = await supabase.auth.getSession()
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/kelas/${classId}/students/bulk-delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionData.session?.access_token && { 'Authorization': `Bearer ${sessionData.session.access_token}` })
        },
        body: JSON.stringify({ studentIds: selectedStudents })
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || 'Gagal menghapus siswa')
      }

      toast.success(`${selectedStudents.length} siswa berhasil dihapus dari kelas`)
      setSelectedStudents([])
      fetchStudents()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const toggleSelectStudent = (id: string) => {
    if (selectedStudents.includes(id)) {
      setSelectedStudents(prev => prev.filter(sId => sId !== id))
    } else {
      setSelectedStudents(prev => [...prev, id])
    }
  }

  const [isExporting, setIsExporting] = useState(false)

  const handleExportFinalGrades = async () => {
    if (students.length === 0) {
      toast.error('Belum ada siswa di kelas ini.')
      return
    }

    setIsExporting(true)
    const toastId = toast.loading('Mengambil data nilai...')
    try {
      const supabase = createClient()
      
      // 1. Ambil data tugas proyek dan nilainya
      const { data: projects } = await supabase
        .from('project_assignments')
        .select('id, title, is_group_project')
        .eq('class_id', classId)
        .order('created_at', { ascending: true })

      const projectIds = projects?.map(p => p.id) || []
      let projectSubmissions: any[] = []
      if (projectIds.length > 0) {
        const { data: pSubs } = await supabase
          .from('project_submissions')
          .select('user_id, assignment_id, score, group_members')
          .in('assignment_id', projectIds)
        projectSubmissions = pSubs || []
      }

      // 2. Ambil data kuis dan nilainya (pastikan relasi kuis terhubung ke kelas jika ada)
      // Karena quiz terhubung via class_modules -> quizzes, kita ambil semua kuis di kelas ini
      const { data: modules } = await supabase
        .from('class_modules')
        .select('id')
        .eq('class_id', classId)
      
      const moduleIds = modules?.map(m => m.id) || []
      let quizzes: any[] = []
      let quizSubmissions: any[] = []
      
      if (moduleIds.length > 0) {
        const { data: qz } = await supabase
          .from('quizzes')
          .select('id, title')
          .in('module_id', moduleIds)
          .order('created_at', { ascending: true })
        quizzes = qz || []
        
        const quizIds = quizzes.map(q => q.id)
        if (quizIds.length > 0) {
          const { data: qSubs } = await supabase
            .from('quiz_submissions')
            .select('user_id, quiz_id, final_score')
            .in('quiz_id', quizIds)
          quizSubmissions = qSubs || []
        }
      }

      // 3. Susun data CSV
      // Baris Pertama (Header)
      const headers = [
        'No. Absen',
        'Nama Siswa',
        'NIS',
        ...projects!.map(p => `Tugas: ${p.title}`),
        'Rata-rata Tugas',
        ...quizzes.map(q => `Kuis: ${q.title}`),
        'Rata-rata Kuis',
        'NILAI AKHIR'
      ]

      const rows = [headers]

      // Helper untuk mencari nilai tugas (individu & kelompok)
      const getProjectScore = (studentId: string, projectId: string, isGroup: boolean) => {
        if (!isGroup) {
          const sub = projectSubmissions.find(s => s.assignment_id === projectId && s.user_id === studentId)
          return sub?.score ?? null
        }
        // Group logic
        const sub = projectSubmissions.find(s => {
          if (s.assignment_id !== projectId) return false
          if (s.user_id === studentId) return true
          if (s.group_members) {
            try {
              const members = typeof s.group_members === 'string' ? JSON.parse(s.group_members) : s.group_members
              if (Array.isArray(members) && members.includes(studentId)) return true
              if (members.members && Array.isArray(members.members) && members.members.includes(studentId)) return true
            } catch (e) {}
          }
          return false
        })
        return sub?.score ?? null
      }

      // Helper untuk mencari nilai kuis (ambil nilai tertinggi jika ada beberapa submission)
      const getQuizScore = (studentId: string, quizId: string) => {
        const subs = quizSubmissions.filter(s => s.quiz_id === quizId && s.user_id === studentId)
        if (subs.length === 0) return null
        return Math.max(...subs.map(s => s.final_score || 0))
      }

      // Map tiap siswa ke baris CSV
      students.forEach(s => {
        const sData = s.student
        
        let totalProjectScore = 0
        let projectCount = 0
        const projectColumns = projects!.map(p => {
          const score = getProjectScore(sData.id, p.id, p.is_group_project)
          if (score !== null) {
            totalProjectScore += score
            projectCount++
          }
          return score !== null ? score : '0'
        })
        const avgProject = projectCount > 0 ? (totalProjectScore / projects!.length) : 0

        let totalQuizScore = 0
        let quizCount = 0
        const quizColumns = quizzes.map(q => {
          const score = getQuizScore(sData.id, q.id)
          if (score !== null) {
            totalQuizScore += score
            quizCount++
          }
          return score !== null ? score : '0'
        })
        const avgQuiz = quizzes.length > 0 ? (totalQuizScore / quizzes.length) : 0

        // Asumsi Nilai Akhir = (Rata-rata Tugas + Rata-rata Kuis) / 2
        // Jika kuis tidak ada, murni dari tugas (dan sebaliknya)
        let finalScore = 0
        if (projects!.length > 0 && quizzes.length > 0) {
          finalScore = (avgProject + avgQuiz) / 2
        } else if (projects!.length > 0) {
          finalScore = avgProject
        } else if (quizzes.length > 0) {
          finalScore = avgQuiz
        }

        rows.push([
          s.no_absen?.toString() ?? '-',
          sData.name,
          sData.nis_nip ?? '-',
          ...projectColumns,
          avgProject.toFixed(2),
          ...quizColumns,
          avgQuiz.toFixed(2),
          finalScore.toFixed(2)
        ])
      })

      // Generate CSV file
      const csv = rows.map(r => r.map(c => `"${c.toString().replace(/"/g, '""')}"`).join(',')).join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rekap_Nilai_Kelas.csv`
      a.click()
      URL.revokeObjectURL(url)

      toast.success('Nilai akhir berhasil diekspor!', { id: toastId })
    } catch (error: any) {
      toast.error('Gagal mengekspor nilai: ' + error.message, { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daftar Siswa</h2>
          <p className="text-sm text-slate-500">Total: {students.length} siswa</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          {selectedStudents.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-50"
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Hapus {selectedStudents.length} Terpilih
            </button>
          )}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 hover:shadow-sm active:scale-95"
          >
            <UserPlus className="h-4 w-4" />
            Tambah Siswa
          </button>
          <button 
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95"
          >
            <UploadCloud className="h-4 w-4" />
            Import Siswa
          </button>
        </div>
      </div>
      <LogoLoader isOpen={isExporting} message="Mengekspor Data Nilai..." onCancel={() => setIsExporting(false)} />

      <div className="mb-4 relative max-w-sm">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input 
          type="text"
          placeholder="Cari nama, email, atau NIS..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white"
        />
      </div>

      {loading ? (
        <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-widest text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3 w-10">
                  <input 
                    type="checkbox" 
                    checked={filteredStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="px-5 py-3">No. Absen</th>
                <th className="px-5 py-3">Nama Siswa</th>
                <th className="px-5 py-3">NIS</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Bergabung Pada</th>
                <th className="px-5 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((s, idx) => (
                  <tr key={s.id} className={`transition-colors duration-200 hover:bg-slate-50 ${selectedStudents.includes(s.id) ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-5 py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(s.id)}
                        onChange={() => toggleSelectStudent(s.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-700">{s.no_absen ?? '-'}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{s.student.name}</td>
                    <td className="px-5 py-3">{s.student.nis_nip ?? '-'}</td>
                    <td className="px-5 py-3">{s.student.email}</td>
                    <td className="px-5 py-3">{new Date(s.joined_at).toLocaleDateString('id-ID')}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setUnlockStudent(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-amber-50 hover:text-amber-600 transition-colors"
                          title="Buka Akses Bab"
                        >
                          <Unlock className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditStudent(s)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                          title="Edit Siswa"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, s.student.name)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    {search ? 'Siswa tidak ditemukan.' : 'Belum ada siswa di kelas ini.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showImportModal && (
        <ImportSiswaModal 
          classId={classId} 
          onClose={() => setShowImportModal(false)} 
          onSuccess={fetchStudents} 
        />
      )}

      {showAddModal && (
        <AddSiswaModal
          classId={classId}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => { setShowAddModal(false); fetchStudents(); }}
        />
      )}

      {editStudent && (
        <EditSiswaModal
          classId={classId}
          student={editStudent}
          onClose={() => setEditStudent(null)}
          onSuccess={() => { setEditStudent(null); fetchStudents(); }}
        />
      )}

      {unlockStudent && teacherId && (
        <UnlockModuleModal
          classId={classId}
          studentId={unlockStudent.student.id}
          studentName={unlockStudent.student.name}
          teacherId={teacherId}
          onClose={() => setUnlockStudent(null)}
          onSuccess={() => setUnlockStudent(null)}
        />
      )}
    </div>
  )
}
