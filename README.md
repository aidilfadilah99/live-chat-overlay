<div align="center">

# ⚡ LIVE CHAT OVERLAY v3.0
### *Next-Gen Floating Multi-Stream Companion (TikTok & YouTube) for Streamers & Gamers*

[![Version](https://img.shields.io/badge/version-3.0-fe2c55?style=for-the-badge)](https://github.com/aidilfadilah99/live-chat-overlay)
[![Author](https://img.shields.io/badge/Author-Aidil%20Fadilah-00B4D8?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aidilfadilah99)
[![GitHub stars](https://img.shields.io/github/stars/aidilfadilah99/live-chat-overlay?style=for-the-badge&color=ffb703)](https://github.com/aidilfadilah99/live-chat-overlay/stargazers)
[![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078D4?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/aidilfadilah99/live-chat-overlay)
[![Tech Stack](https://img.shields.io/badge/Built%20With-Electron%20%E2%80%A2%20Node.js-2b2d42?style=for-the-badge&logo=electron&logoColor=9FEAF9)](https://electronjs.org/)

<p align="center">
  <b>Baca chat, pantau gift & Super Chat, dan sapa penonton TikTok LIVE serta YouTube LIVE langsung di atas layar game tanpa monitor kedua!</b>
  <br />
  Unified Menu • Multi-Platform • Ringan • Transparan • Anti-Ribet • Tanpa Login Akun
</p>

---

[Fitur Unggulan](#-fitur-unggulan) • 
[Panduan Penggunaan](#-panduan-penggunaan) • 
[Mode Gamer (Click-Through)](#-mode-gamer--click-through) • 
[Instalasi Developer](#-instalasi--pengembangan) • 
[Author](#-author--kontak)

---

</div>

<br />

## 💡 Mengapa Menggunakan Live Chat Overlay?

Sebagai streamer atau content creator dengan setup monitor terbatas yang sering melakukan **multi-stream (restream) ke TikTok dan YouTube sekaligus**, berganti jendela (Alt+Tab) untuk membaca chat di dua platform berbeda sangat memecah fokus gameplay atau siaran.

**Live Chat Overlay v3.0** hadir sebagai solusi all-in-one:
- ⚡ **Satu Menu Terpadu (All-in-One)**: Tidak perlu repot gonta-ganti tab. TikTok LIVE dan YouTube LIVE tersedia berdampingan dalam satu panel. Hubungkan salah satu atau keduanya sekaligus dengan fleksibel!
- 🏷️ **Pembeda Platform Jelas**: Chat TikTok ditandai badge hitam **`TT`** dan chat YouTube ditandai badge merah **`YT`** (dengan teks putih kontras).
- 📊 **Agregasi Statistik Otomatis**: Menampilkan penonton & like dari platform yang aktif, dan otomatis menjumlahkan penonton & likes jika kedua platform terhubung bersamaan.
- 🚀 **Zero Login**: Tidak perlu login akun, password, atau API key. Cukup masukkan username TikTok dan/atau link/handle YouTube publik.
- 🎮 **Gamer Friendly**: Dilengkapi fitur *Click-Through (Tembus Klik)* sehingga cursor mouse tidak akan terhalang saat bermain game.
- 🪶 **Hemat Resource**: Menggunakan filter memori pintar yang membatasi histori chat agar konsumsi RAM dan CPU tetap minimal sepanjang sesi live stream.

<br />

---

## 🎯 Fitur Unggulan

| Kategori | Fitur & Deskripsi |
|---|---|
| 🔀 **Satu Menu Praktis** | Kelola koneksi **TikTok LIVE** dan **YouTube LIVE** langsung dalam 1 menu tanpa perlu berpindah tab. |
| 💬 **Unified Live Chat** | Komentar dari TikTok dan YouTube digabung rapi dalam satu feed dengan badge penanda platform (`TT` hitam / `YT` merah). |
| 💰 **Gifts & Super Chat** | Notifikasi gift TikTok (beserta combo) dan Super Chat YouTube (lengkap dengan nominal donasi). |
| 📊 **Real-time Analytics** | Ticker statistik live cerdas: Menampilkan penonton & like per platform, atau akumulasi gabungan saat mode dual aktif. |
| 👑 **Top Viewers & Joins** | Menampilkan 3 penonton teratas TikTok serta pop-up halus saat penonton baru bergabung. |
| 🎨 **UI Kustomisasi Bebas** | Atur ukuran teks (font size), transparansi latar (opacity), dan pilihan instan ukuran jendela (Kecil, Sedang, Besar). |
| 📌 **Always-On-Top Layer** | Jendela mengambang di atas semua aplikasi aktif, game *borderless*, maupun software OBS Studio. |

<br />

---

## 🚀 Panduan Penggunaan

1. Buka aplikasi **Live Chat Overlay v3.0**.
2. Di bagian atas panel, tersedia input untuk kedua platform:
   - **TikTok LIVE**: Masukkan username (contoh: `@username`) lalu klik **Hubungkan**.
   - **YouTube LIVE**: Masukkan link video (`youtube.com/watch?v=...`), handle channel (`@channel`), atau ID siaran lalu klik **Hubungkan**.
   *(Anda bebas menghubungkan hanya TikTok, hanya YouTube, atau keduanya sekaligus!)*
3. Atur posisi overlay di sudut layar, aktifkan transparansi dan mode klik-tembus jika sedang bermain game.
4. Klik **Putuskan Semua** di footer kapan pun Anda selesai siaran.

<br />

---

## 🎮 Mode Gamer / Click-Through

Fitur **Klik-Tembus (*Click-Through*)** memungkinkan Anda tetap menembakkan senjata di game atau mengklik desktop di area tepat di mana jendela chat berada tanpa sengaja menyeleksi jendela overlay.

> [!IMPORTANT]
> **Shortcut Darurat Pengendali Klik:**
> 
> Tekan kombinasi tombol:
> ### <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd>
> 
> Pintasan ini berfungsi secara global di Windows untuk mengaktifkan atau mematikan mode klik-tembus kapan pun Anda ingin mengatur ulang posisi atau ukuran jendela.

<br />

---

## 🛠️ Instalasi & Pengembangan

Bagi developer yang ingin menjalankan atau memodifikasi kode sumber secara lokal:

### Prasyarat
- Sistem Operasi: **Windows 10 / 11**
- **Node.js**: Versi 20 ke atas
- Package Manager: **npm**

### Langkah Instalasi
```bash
# 1. Clone repository ini
git clone https://github.com/aidilfadilah99/live-chat-overlay.git

# 2. Masuk ke direktori proyek
cd live-chat-overlay

# 3. Install semua dependencies
npm install

# 4. Jalankan aplikasi dalam mode dev
npm start
```

> **Tips Windows:** Anda juga dapat langsung mengklik dua kali file `Jalankan.cmd` yang sudah disediakan di folder utama!

### 📦 Melakukan Build ke Portable Executable (.exe)
Untuk membuat file executable mandiri tanpa perlu terminal:
```bash
npm run pack
```
Hasil build biner portabel:
```text
dist/Live Chat Overlay 3.0.exe
```

<br />

---

## 📁 Struktur Kode

```text
live-chat-overlay/
├── src/
│   ├── main.js         # Process utama Electron, window manager, koneksi TikTok & YouTube
│   ├── preload.cjs     # Context bridge aman untuk komunikasi IPC (renderer <-> node)
│   ├── renderer.js     # Logika UI terpadu, chat feed formatter, agregasi statistik, & event listener
│   ├── index.html      # Struktur visual aplikasi overlay (menu terpadu TikTok & YouTube)
│   ├── styles.css      # Style tema gelap modern, glassmorphism, & badge platform TT/YT
│   └── controls.css    # Style slider kustomisasi, toggle passthrough, & watermark
├── Jalankan.cmd        # Script launcher cepat untuk Windows
├── package.json        # Manifest proyek v3.0 & konfigurasi electron-builder
└── README.md           # Dokumentasi resmi proyek
```

<br />

---

## ⚖️ Penafian (Disclaimer)

Aplikasi ini menggunakan modul pihak ketiga [`tiktok-live-connector`](https://www.npmjs.com/package/tiktok-live-connector) dan [`youtube-chat`](https://www.npmjs.com/package/youtube-chat) untuk membaca stream data siaran publik.

- Proyek ini **tidak terafiliasi, dikelola, atau didukung secara resmi oleh TikTok, ByteDance, YouTube, maupun Google LLC.**
- Aplikasi ini murni bersifat *read-only* untuk siaran langsung publik dan **tidak pernah mengumpulkan, menyimpan, atau meminta password akun pengguna.**
- Segala perubahan protokol atau kebijakan API dari platform terkait dapat memengaruhi kestabilan koneksi.

<br />

---

## 👤 Author & Kontak

Dibuat & dikembangkan oleh:

**Aidil Fadilah**  
- 🌐 GitHub: [@aidilfadilah99](https://github.com/aidilfadilah99)
- 💼 Project Repository: [live-chat-overlay](https://github.com/aidilfadilah99/live-chat-overlay)

---

<div align="center">
  <b>Suka dengan project ini? Jangan lupa tinggalkan ⭐ Star di repositori GitHub!</b>
  <br /><br />
  <sub>Copyright © 2026 Aidil Fadilah. Crafted for creators & streamers.</sub>
</div>
