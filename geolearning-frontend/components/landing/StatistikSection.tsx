export default function StatistikSection() {
  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x divide-slate-200">
          {[
            { label: 'Siswa Aktif', value: '5,000+' },
            { label: 'Kuis Geografi', value: '250+' },
            { label: 'Guru Terdaftar', value: '100+' },
            { label: 'XP Terkumpul', value: '1M+' },
          ].map((stat, i) => (
            <div key={i} className="text-center px-4">
              <div className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-slate-400 mt-8 italic">
          *Statistik di atas adalah data ilustrasi. Data asli akan diupdate secara berkala.
        </p>
      </div>
    </section>
  )
}
