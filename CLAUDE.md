# Konteks repo (untuk asisten AI)

- Video **"Bahasa Simetri" — Kimia Kuantum: Simetri Molekul & Grup Titik** (S1 Kimia UNESA, RPS pertemuan 12–13) milik **Yayan** (Septian Anugrah). Mesin disalin dari `video-orbital-poliatomik` (vbC: molekul 3D berputar; moA–D/poA–D: diagram MO). Sebelumnya: MO poliatomik & Hückel. Berikutnya: spektroskopi molekul. Aturan umum & pelajaran teknis: repo `septiananugrah-ship-it/science-intro` → `CLAUDE.md`.
- Gaya seri kuantum Yayan: panggung gelap, aksen **emas–sian**, font Outfit + Source Serif 4 + JetBrains Mono, subtitle kata-per-kata. Tanpa nama di video (aturan video kuantum).
- Benang merah cerita: **karvon mint vs karvon jintan** (bayangan cermin) → unsur & operasi simetri → kiralitas (tanpa Sₙ) → grup titik & diagram alir → tabel karakter (menjelaskan label a₁/b₁ orbital air dari video sebelumnya) → kepolaran, getaran IR, CO₂ gas rumah kaca.
- **Kode warna**: sumbu putar Cₙ = emas `C.gold` (panah putar), bidang cermin σ = sian `C.cyan` transparan, pusat inversi i = merah muda `C.pink` (titik + garis putus melalui pusat), putaran tak wajar Sₙ = ungu `C.violet`, karakter +1 = mint `C.mint`, −1 = merah `C.red`; atom CPK (O merah, N biru, C abu, H putih, F hijau, B merah muda, S kuning). Molekul selalu 3D berputar pelan; operasi simetri dianimasikan sungguhan (atom berpindah lalu tampak sama, dengan atom diberi nomor kecil agar perpindahan terlihat).
- Diagram MO: dua kolom orbital atom di kiri/kanan, MO di tengah, garis putus-putus penghubung, elektron sebagai panah ↑↓ yang diisi bergiliran (Aufbau, Pauli, Hund); energi kualitatif (tidak berskala).
- **Semua adegan harus terus bergerak** (elektron di kotak orbital, vektor L/S berpresesi, tabel mikrostatus yang terkelupas, garis spektrum menyala).
- **Claude tidak menjalankan workflow GitHub Actions.** Setelah merge ke `main`, minta pengguna menekan *Run workflow*.
- Narasi menyusul. Selalu sediakan versi tanpa narasi.

## Aturan konten & tata letak
- Rumus/simbol term utama ≥ 56 px (`Formula`), satu kartu per momen; zona subtitle (bawah 180 px) bebas; margin ≥ 80 px. Komponen HTML di luar `<Stage>`.
- Rumus kimia & hibrida ditulis dengan subskrip/superskrip benar (H₂, sp³; `Sup`/`Sub` di HTML, `tspan baselineShift` di SVG). Orbital 3D digambar dengan proyeksi sederhana dan rotasi pelan. Angka dicek di `naskah/AUDIT.md`.
- Teks TTS terpisah dari subtitle (`tts:` per baris; huruf tunggal dieja di `src/tts.ts`).
- Kemulusan: `EASE` lembut, fade keluar `EASE_IN_OUT`; tanpa ganti berdasarkan ambang (silang-pudar); tanpa CSS blur; tanpa filter pada garis lurus.

## QA
- `CHROME_PATH=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell node scripts/qa-lines.mjs out/x <adegan...>` lalu `python3 scripts/contact.py out/x out/x-s 9`.
- `npm run check` (cek kata `wordOf`), uji kemulusan `node scripts/qa-film.mjs out/a.mp4 0 99999 0.25` lalu `python3 scripts/qa-glitch.py out/a.mp4 0`.
