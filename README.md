# GuruDesk - Aplikasi Manajemen Kelas Digital

Aplikasi manajemen kelas untuk guru dalam mengelola siswa, absensi, dan nilai.

## ✨ Fitur

- **Dashboard** - Statistik lengkap dengan grafik absensi
- **Data Siswa** - Tambah, edit, hapus, cari siswa
- **Absensi** - Rekam absensi per pertemuan (H/S/I/A)
- **Nilai** - Input tugas, kuis, UTS, UAS, remidi
- **Auto Hitung** - Nilai akhir: (Tugas×40%) + (UTS×30%) + (UAS×30%)
- **Ranking** - Peringkat siswa berdasarkan nilai akhir
- **Laporan** - Export PDF & Excel untuk absensi dan nilai

## 🚀 Cara Menggunakan

### Versi Statis (Tanpa Server)
1. Buka file `static-index.html` langsung di browser
2. Data tersimpan di browser (localStorage)
3. Tidak perlu internet setelah halaman dimuat

### Versi dengan Server (Node.js)
```bash
# Install dependencies
npm install

# Jalankan server
npm start

# Buka http://localhost:3000
```

## 📁 Struktur Folder

```
guru-app/
├── static-index.html    # Versi statis (buka langsung di browser)
├── package.json         # Dependencies Node.js
├── README.md            # Dokumentasi ini
├── .gitignore           # File yang diabaikan Git
├── backend/
│   └── server.js        # Express server
├── frontend/
│   ├── dashboard.html   # Halaman dashboard
│   ├── siswa.html       # Halaman data siswa
│   ├── absensi.html     # Halaman absensi
│   ├── nilai.html       # Halaman nilai
│   ├── laporan.html     # Halaman laporan
│   └── style.css        # Styling CSS
└── database/
    └── sekolah.json     # Database JSON
```

## 🌐 Deploy ke GitHub Pages

1. Push project ini ke GitHub
2. Buka Settings → Pages
3. Source: Deploy from a branch
4. Branch: main, Folder: / (root)
5. Save

## 🎨 Tema Warna

- Primary: #1E3A5F (Biru Tua)
- Secondary: #2E5A88 (Biru Medium)
- Accent: #4ECDC4 (Teal)
- Background: #F5F7FA (Abu Muda)

## 📝 Lisensi

MIT License

---

Dibuat dengan ❤️ untuk pendidikan Indonesia
