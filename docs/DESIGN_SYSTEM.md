# Nemu: Brand & UI Design System Specification - Optimized
### "Premium Family Office Aesthetics, Powered by Harmony"

Dokumen ini mendokumentasikan spesifikasi sistem desain (Design System) yang digunakan dalam pengembangan antarmuka **Nemu**. Sistem ini dirancang untuk menciptakan kesan premium, hangat, dan interaktif dengan nuansa modern, ramah pengguna, serta estetis.

---

## 1. PRINSIP DESAIN (DESIGN PRINCIPLES)

1.  **Natural & Empathetic Warmth**: Menghindari warna abu-abu dingin atau latar belakang putih steril. Nemu menggunakan warna latar berbasis krem hangat (`#fdfcfb`) dan teks berbasis batu pasir (`stone-900`) untuk nuansa bumi yang menenang dan organik.
2.  **High-Contrast Premium Typography**: Mengombinasikan huruf Serif yang elegan (`Playfair Display`) dengan huruf Sans-serif modern berdaya baca tinggi (`Inter` & `Outfit`).
3.  **Glassmorphism & Bento Grid Layout**: Menggunakan kartu transparan semi-transparan dengan efek pemburaman latar belakang (*backdrop-blur*) dan tata letak gaya Bento untuk mengelompokkan metrik finansial secara efisien.
4.  **Organic Micro-Animations**: Setiap elemen interaktif harus terasa hidup menggunakan gerakan spring (*spring physics*) dari Framer Motion dan efek penekanan mengecil (`active:scale-95`) yang memberikan sensasi taktil nyata.
5.  **Gamified Education Focus**: Menggunakan elemen visual ceria namun elegan pada modul anak-anak menggunakan skema warna emerald dan ikon yang ramah bagi anak.

---

## 2. PALET WARNA (COLOR PALETTE)

Palet warna Nemu dirancang secara harmonis untuk menyampaikan arti fungsional dengan kontras yang kuat:

### 2.1 Warna Netral Utama (Core Neutrals)
*   **Warm Sand Background**: `#fdfcfb` (Krem natural, memberikan nuansa hangat dan mewah).
*   **Charcoal Stone**: `stone-900` (`#1c1917`) & `stone-800` (Digunakan untuk teks utama, tombol tindakan utama, dan kartu penampil saldo utama).
*   **Clean White**: `#ffffff` (Digunakan untuk latar belakang kartu, *dashboard feed*, dan modal interior).
*   **Stone Accents**: `stone-100` (`#f5f5f4`) & `stone-50` (`#fafaf9`) (Digunakan untuk garis pembatas, latar belakang input, dan tombol sekunder).

### 2.2 Warna Fungsional & Kategori (Functional Colors)

| Peran Fungsional | Kategori Visual | Token Utama | Token Latar Belakang (Soft) | Deskripsi Penggunaan |
| :--- | :--- | :--- | :--- | :--- |
| **Income / Success** | Emerald Green | `emerald-600` (`#059669`) | `emerald-50` / `emerald-100` | Pemasukan keuangan, pelunasan, target tercapai, status aman. |
| **Expense / Danger** | Rose Red | `rose-500` (`#f43f5e`) | `rose-50` / `rose-100` | Pengeluaran keuangan, rasio utang tinggi (bahaya), sisa saldo utang. |
| **Warm Accents** | Brand Orange | `orange-400` (`#fb923c`) | `orange-50` | Tombol utama, logo branding, indikator pelatih finansial AI. |
| **AI & Premium Suite** | Indigo Blue | `indigo-600` (`#4f46e5`) | `indigo-50` | Modul asisten finansial AI, penasihat premium, statistik grafik. |
| **Roadmap / Timeline**| Amber Yellow | `amber-500` (`#f59e0b`) | `amber-50` | Modul Peta Jalan (Roadmap), target investasi, tugas keuangan anak. |

---

## 3. AKSESIBILITAS & USABILITAS (A11Y STANDARDS) - OPTIMIZED

Sebagai perwujudan optimasi sistem analis, Nemu mengadopsi standar aksesibilitas tinggi untuk inklusivitas semua pengguna:

### 3.1 Rasio Kontras Warna (WCAG 2.1 Compliance)
*   **Teks Utama**: Kombinasi warna teks `stone-900` (`#1c1917`) di atas latar belakang `#fdfcfb` menghasilkan **Rasio Kontras 17.5:1** (jauh melampaui ambang batas minimum WCAG AA sebesar 4.5:1 untuk teks normal).
*   **Teks Sekunder**: Kategori atau label dengan warna `stone-500` di atas putih memiliki **Rasio Kontras 4.6:1** (memenuhi batas minimum 4.5:1).

### 3.2 Target Sentuh Minimum (Touch Targets)
*   Untuk mendukung akses PWA pada layar sentuh seluler, semua tombol interaktif, menu, dan tautan wajib memiliki ukuran target sentuh minimum sebesar **44 x 44 CSS pixels (dp)** untuk menghindari salah ketik (*fat-finger errors*).

### 3.3 Status Elemen Interaktif (UI Interactive States)
*   **Hover**: Menggunakan pencerahan transparan atau pergeseran posisi ke atas (`y: -5px` via Framer Motion) untuk memberikan umpan balik visual instan.
*   **Active (Pressed)**: Mengalami pengecilan skala taktil sebesar `scale-95` (`active:scale-95`).
*   **Focus State (Focus-Visible)**: Elemen yang menerima fokus kibor (keyboard focus) wajib menampilkan cincin luar dengan kontras tinggi (`outline outline-2 outline-offset-2 outline-stone-900`) demi mendukung aksesibilitas pembaca layar (*screen readers*).
*   **Disabled**: Komponen non-aktif diturunkan tingkat kejelasannya (`opacity-50`) dan ditonaktifkan interaksinya (`pointer-events-none`).

---

## 4. SISTEM TIPOGRAFI (TYPOGRAPHY SYSTEM)

Tipografi didefinisikan menggunakan tiga keluarga font (font families) yang diimpor dari Google Fonts:

```css
/* Google Fonts Import in index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,900&family=Outfit:wght@300;400;500;600;700&display=swap');
```

### 4.1 Klasifikasi Font
1.  **Sans Font (`font-sans` / Inter)**:
    *   *Karakter*: Netral, modern, legibilitas sangat tinggi di ukuran kecil.
    *   *Penggunaan*: Teks isi (*body copy*), deskripsi transaksi, detail instruksi, formulir teks, komentar feed.
2.  **Brand Font (`font-brand` / Outfit)**:
    *   *Karakter*: Geometris, bersudut elegan, modern futuristik.
    *   *Penggunaan*: Judul modul, penampil angka nominal saldo utama, metrik persentase kesehatan/DTI, judul kartu bento.
3.  **Serif Font (`font-serif` / Playfair Display)**:
    *   *Karakter*: Klasik, mewah, editorial kelas atas.
    *   *Penggunaan*: Huruf inisial logo "**N**" besar, slogan pada *splash screen*, dan judul bab utama.

### 4.2 Hierarki Tipografi
*   **App Logo Banner**: `font-serif italic font-black text-5xl`
*   **Main Balance Display**: `font-brand font-bold text-5xl tracking-tight`
*   **Section Heading**: `font-brand font-bold text-lg text-stone-900 tracking-tight`
*   **Card Title**: `font-bold text-stone-800 text-sm`
*   **Input Labels / Category Tags**: `text-[10px] text-stone-400 font-bold uppercase tracking-widest`
*   **Body Copy**: `text-sm text-stone-600 font-medium leading-relaxed`

---

## 5. RADIUS SUDUT & EFEX (RADIUS & ELEVATION)

Nemu menggunakan gaya melengkung ekstrim (*highly rounded corners*) untuk menghilangkan kesan kaku perbankan tradisional.

### 5.1 Border Radius (Skema Tailwind V4)
*   `rounded-xl`: `12px` (Digunakan untuk tombol kecil, tag status, input formulir).
*   `rounded-2xl`: `16px` / `1rem` (Digunakan untuk kartu profil, tombol navigasi floating, preset pertanyaan).
*   `rounded-3xl` (`--radius-3xl`): `24px` / `1.5rem` (Digunakan untuk pesan obrolan AI, avatar profil utama).
*   `rounded-4xl` (`--radius-4xl`): `32px` / `2rem` (Digunakan untuk kartu bento statistik, kartu riwayat transaksi, kontainer utama).
*   `rounded-5xl` (`--radius-5xl`): `40px` / `2.5rem` (Digunakan untuk modal laci bawah/bottom drawer, kartu saldo utama).

### 5.2 Efek Bayangan & Transparansi (Shadow & Translucency)
*   **Neo Shadow (`.neo-shadow`)**:
    ```css
    box-shadow: 0 10px 30px -10px rgba(0,0,0,0.05), 0 4px 10px -5px rgba(0,0,0,0.02);
    ```
    (Memberikan bayangan ambient yang sangat halus sehingga kartu terlihat melayang anggun di atas permukaan krem).
*   **Glassmorphic Card (`.glass`)**:
    ```css
    @apply bg-white/70 backdrop-blur-xl border border-white/40;
    ```
    (Digunakan untuk tombol bahasa, laci navigasi, dan panel kontrol atas agar latar belakang krem tetap terlihat membayang di bawah kartu).

---

## 6. POLA KOMPONEN UI (UI COMPONENT PATTERNS)

### 6.1 Balance Hub Container (Kartu Saldo Utama)
Elemen visual terpenting di Dashboard. Terdiri dari kartu solid berwarna `stone-900` yang diputar secara estetik menggunakan Framer Motion sebesar `-rotate-1` dengan kartu bayangan di bawahnya untuk menciptakan kesan fisik bertumpuk yang mewah.
*   *Struktur*:
    *   Kartu belakang: `absolute inset-0 bg-stone-900 rounded-[3rem] shadow-2xl transform -rotate-1 scale-[0.98]`
    *   Kartu depan: `relative bg-stone-900 text-white rounded-[3rem] p-8 space-y-8 overflow-hidden`

### 6.2 Bento Grid Quick Stats
Pembagian statistik *Income* & *Expenses* menggunakan petak bento simetris dua kolom dengan transisi hover halus.
*   *Hover Effect*: `hover:shadow-md hover:border-emerald-300 transition-all active:scale-[0.99] cursor-pointer`

### 6.3 Bottom-Drawer Modals (Laci Geser Bawah)
Semua modal premium (AI Advisor, Simulator Kredit, Debt Tracker, dll.) menggunakan rancangan laci geser bawah (*bottom drawers*) untuk memaksimalkan kenyamanan pengguna seluler.
*   *Spesifikasi*:
    *   Lebar penuh di perangkat seluler (`w-full`), menyempit di layar desktop (`max-w-md` atau `max-w-lg`).
    *   Bentuk membulat hanya di bagian atas (`rounded-t-[2.5rem]`).
    *   Ketinggian tetap di `h-[85vh]` untuk mencegah pemotongan layar tidak disengaja dengan area konten yang memiliki properti `overflow-y-auto`.

---

## 7. SPESIFIKASI GERAKAN & ANIMASI (MOTION SYSTEM)

Nemu menggunakan pustaka Framer Motion (`motion/react`) untuk menggerakkan antarmuka secara intuitif.

### 7.1 Karakteristik Transisi
*   **Spring Physics (Fisika Pegas)**: Digunakan untuk masuknya elemen atau modal agar terasa taktil dan elastis.
    *   *Stiffness*: `50` (lembut) atau `100` (sedang).
    *   *Damping*: `15` hingga `20` (meminimalisir getaran berlebih).
*   **Fade and Scale (Pudar & Skala)**: Digunakan untuk transisi masuknya ikon status atau overlay pembatalan.

### 7.2 Animasi Kustom
*   **Spin Slow (`animate-spin-slow`)**: Perputaran 360 derajat konstan dengan durasi 8 detik (`linear infinite`) pada tombol kompas roadmap finansial atau cincin skor kesehatan.
*   **Taktil Click (`active:scale-95`)**: Skala pengecilan instan saat pengguna menekan tombol atau kartu, mensimulasikan penekanan tombol fisik asli.
