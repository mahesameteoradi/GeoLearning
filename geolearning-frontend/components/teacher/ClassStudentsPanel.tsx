'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, UserPlus, UploadCloud, Loader2, Download, Search, Edit2, Trash2 } from 'lucide-react'
import { ImportSiswaModal } from './ImportSiswaModal'
import { AddSiswaModal } from './AddSiswaModal'
import { EditSiswaModal } from './EditSiswaModal'
import toast from 'react-hot-toast'

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
  const [students, setStudents] = useState<ClassStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editStudent, setEditStudent] = useState<ClassStudent | null>(null)
  const [search, setSearch] = useState('')
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)

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
    if (!confirm(`Apakah Anda yakin ingin menghapus ${studentName} dari kelas ini?`)) return
    
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
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedStudents.length} siswa yang dipilih dari kelas ini?`)) return
    
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Daftar Siswa</h2>
          <p className="text-sm text-slate-500">Total: {students.length} siswa</p>
        </div>
        <div className="flex gap-2">
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
                  <tr key={s.id} className={`transition-colors duration-200 hover:bg-slate-100 ${selectedStudents.includes(s.id) ? 'bg-blue-50/30' : ''}`}>
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
    </div>
  )
}
