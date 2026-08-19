import http from 'k6/http';
import { sleep, check } from 'k6';

// Konfigurasi pengujian k6
export const options = {
  vus: 50,             // 40 Virtual Users (user bersamaan)
  duration: '20m',      // Durasi pengujian selama 1 menit
};

export default function () {
  // Ganti URL ini dengan endpoint yang ingin Anda test.
  // Misalnya halaman utama web Anda (Frontend)
  const url = 'http://localhost:3000';

  // Jika ingin mengetest API backend, Anda bisa menggantinya menjadi seperti:
  // const url = 'http://localhost:5000/api/some-endpoint';

  const res = http.get(url);

  // Memeriksa apakah respon dari server adalah 200 (OK)
  check(res, {
    'status is 200': (r) => r.status === 200,
  });

  // Jeda 1 detik antar request dari setiap user
  sleep(1);
}
