export function hitungJarakMeter(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // radius bumi dalam meter
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export function hitungSkorPeta(
  jarakMeter: number,
  radiusToleransi: number,
  radiusMaksimal: number,
  poinMaksimal: number
): number {
  if (jarakMeter <= radiusToleransi) return poinMaksimal
  if (jarakMeter >= radiusMaksimal) return 0

  // Normalisasi posisi jarak antara radiusToleransi..radiusMaksimal (0 sampai 1)
  const proporsi = (jarakMeter - radiusToleransi) / (radiusMaksimal - radiusToleransi)

  // Exponential decay (kuadratik) agar penurunan halus di awal, tajam di akhir
  const faktor = Math.pow(1 - proporsi, 2)

  return Math.round(poinMaksimal * faktor)
}
