import { Globe, MapPin, Award, Users } from 'lucide-react'

export default function FiturSection() {
  const features = [
    {
      title: 'Soal Pilihan Ganda',
      description: 'Latih pemahaman dasar dengan kuis interaktif yang memberikan feedback instan dan pembahasan lengkap.',
      icon: <Globe className="w-8 h-8 text-blue-500" />,
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Soal Peta/Lokasi',
      description: 'Tandai titik presisi di atas peta nyata! Skor dihitung otomatis berdasarkan kedekatan jarak jawaban Anda (ala GeoGuessr).',
      icon: <MapPin className="w-8 h-8 text-emerald-500" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Sistem Gamifikasi',
      description: 'Kumpulkan XP dari setiap jawaban benar, penuhi progress bar, dapatkan badge, dan bersaing di papan peringkat kelas.',
      icon: <Award className="w-8 h-8 text-amber-500" />,
      bg: 'bg-amber-50 border-amber-100',
    },
    {
      title: 'Manajemen Kelas Mudah',
      description: 'Guru cukup membagikan kode kelas, dan siswa dapat bergabung dalam satu klik tanpa proses registrasi yang membingungkan.',
      icon: <Users className="w-8 h-8 text-purple-500" />,
      bg: 'bg-purple-50 border-purple-100',
    },
  ]

  return (
    <section id="fitur" className="py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Fitur Unggulan</h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Pengalaman belajar geografi yang dirancang khusus untuk meningkatkan partisipasi dan pemahaman melalui pendekatan bermain (gamifikasi).
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((f, i) => (
            <div key={i} className="group p-8 rounded-3xl bg-white border border-slate-200 hover:border-transparent hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full ${f.bg} opacity-50 -z-10 transition-transform group-hover:scale-110`} />
              <div className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mb-6 group-hover:-translate-y-1 transition-transform border`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
