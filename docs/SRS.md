# Software Requirements Specification (SRS) - Optimized
## Nemu: Financial Harmony for Your Family, Powered by AI

Dokumen Spesifikasi Kebutuhan Perangkat Lunak (SRS) ini dibuat untuk mendokumentasikan fitur-fitur, arsitektur, formula, dan model data yang diimplementasikan dalam aplikasi **Nemu**.

---

## 1. PENDAHULUAN

### 1.1 Tujuan Dokumen
Dokumen SRS ini bertujuan untuk mendefinisikan persyaratan fungsional dan non-fungsional dari aplikasi **Nemu**. Dokumen ini dirancang sebagai panduan teknis bagi tim pengembang, desainer, dan pemangku kepentingan untuk memahami bagaimana aplikasi bekerja, baik dari segi visual, formula finansial, maupun integrasi database.

### 1.2 Cakupan Produk (Product Scope)
**Nemu** ("Harmoni keuangan keluarga, didukung oleh AI") adalah platform manajemen keuangan premium yang didesain untuk membantu individu, pasangan, dan keluarga dalam mengelola aset, melacak pengeluaran secara kolaboratif, memantau kewajiban utang, mensimulasikan kredit, serta memberikan edukasi keuangan interaktif untuk anak-anak. Platform ini menggunakan teknologi kecerdasan buatan (Gemini AI) untuk bertindak sebagai Pelatih Keuangan Pribadi yang memberikan saran finansial yang berempati dan terukur.

### 1.3 Definisi, Akronim, dan Singkatan
*   **DTI (Debt-to-Income)**: Rasio total pembayaran utang bulanan dibagi dengan total pendapatan kotor bulanan.
*   **KPR (Kredit Pemilikan Rumah)**: Pinjaman jangka panjang untuk pembiayaan rumah.
*   **KTA (Kredit Tanpa Agunan)**: Pinjaman tanpa jaminan dengan suku bunga flat.
*   **Murabahah**: Skema akad pembiayaan syariah menggunakan prinsip jual beli dengan margin keuntungan tetap.
*   **Anuitas**: Metode perhitungan bunga efektif yang menghasilkan angsuran bulanan tetap namun porsi pokok dan bunganya bergeser setiap bulan.
*   **PWA (Progressive Web App)**: Teknologi web yang memungkinkan aplikasi diinstal langsung ke perangkat seluler atau desktop layaknya aplikasi native.

### 1.4 Referensi Teknologi
*   **Frontend**: React, Vite, TypeScript, TailwindCSS.
*   **Animasi**: Framer Motion (`motion/react`) untuk transisi premium.
*   **Ikonografi**: Lucide React.
*   **Backend & Database**: Google Firebase Suite (Authentication & Cloud Firestore).
*   **Kecerdasan Buatan**: SDK `@google/genai` terintegrasi dengan model `gemini-1.5-flash`.
*   **Internasionalisasi**: `i18next` mendukung Bahasa Indonesia (`id`) sebagai bahasa bawaan dan Bahasa Inggris (`en`).

---

## 2. DESKRIPSI KESELURUHAN (OVERALL DESCRIPTION)

### 2.1 Perspektif Produk
Nemu adalah aplikasi berbasis PWA terdistribusi yang terhubung langsung ke Firebase Firestore untuk sinkronisasi data antar-perangkat secara real-time. Nemu mengedepankan estetika premium dengan palet warna natural, kontras tinggi, sudut membulat lebar (glassmorphism/bento grid), serta micro-animations yang dinamis untuk menciptakan pengalaman pengguna yang memikat.

### 2.2 Fungsi Utama & Premium
Aplikasi Nemu terbagi ke dalam sembilan modul utama:
1.  **Modul Autentikasi & Manajemen Ruang Keuangan (Spaces)**: Manajemen ruang pribadi, pasangan, dan keluarga.
2.  **Modul Manajemen Transaksi**: Pencatatan pemasukan/pengeluaran manual.
3.  **Modul Pemindai Struk Pintar (Camera/OCR)**: Pemindaian struk berbasis kamera untuk otomatisasi entri data.
4.  **Mesin Skor Kesehatan Finansial & Rasio DTI**: Penilaian kesehatan keuangan secara dinamis.
5.  **Modul AI Financial Coach (Gemini)**: Konsultasi finansial berbasis AI yang berempati tinggi.
6.  **Modul Pelacak Utang (Debt & DTI Tracker)**: Manajemen liabilitas dan cicilan.
7.  **Modul Simulator Kredit**: Simulasi pembiayaan konvensional dan syariah.
8.  **Modul Peta Jalan Finansial (Roadmap)**: Perencana finansial jangka panjang 3-Fase.
9.  **Modul Edukasi Keuangan Anak (Kids Financial Kit)**: Gamifikasi tugas dan tabungan anak.

### 2.3 Karakteristik Pengguna
*   **Individu (Personal)**: Mengelola anggaran pribadi secara mandiri.
*   **Pasangan (Couple)**: Pasangan belum menikah yang ingin menyatukan visi keuangan dalam "Couple Space".
*   **Keluarga (Married/Parents)**: Orang tua yang mengelola pengeluaran rumah tangga bersama dan mendidik anak-anak mengenai dasar keuangan.
*   **Anak (Child)**: Anggota keluarga dengan hak akses terbatas yang dapat melihat tugas harian dan tabungannya di dalam "Kids Kit".

### 2.4 Batasan-Batasan (Constraints)
*   Integrasi kamera untuk pemindai struk membutuhkan protokol keamanan HTTPS di sisi browser.
*   Pelacak utang (`debts`) disinkronkan secara real-time menggunakan koleksi Firestore `debts` yang difilter berdasarkan `familyId` aktif untuk kolaborasi real-time antar pasangan/anggota keluarga, sekaligus menjaga isolasi data penuh saat berada di Personal Space.
*   Fitur AI membutuhkan koneksi internet aktif untuk melakukan request ke API Gemini Google.

---

## 3. SPESIFIKASI PERSYARATAN FUNGSIONAL

### 3.1 Modul Otentikasi & Ruang Keuangan (Spaces)
*   **ID-F01**: Sistem harus menyediakan metode masuk menggunakan Google Sign-In melalui Firebase Authentication.
*   **ID-F02**: Pengguna dapat beralih di antara tiga mode ruang keuangan:
    *   *Personal Space*: Saldo dan riwayat pengeluaran milik sendiri.
    *   *Couple Space*: Ruang kolaboratif non-pernikahan untuk dua pengguna.
    *   *Family Space*: Ruang keuangan terpadu untuk orang tua dan anak-anak.
*   **ID-F03**: Sistem harus secara dinamis menyesuaikan tampilan dashboard dan navigasi berdasarkan peran pengguna (`parent`, `spouse`, atau `child`).
*   **ID-F26**: Sistem harus memungkinkan pengguna menetapkan nama kustom ruang keuangan aktif, mata uang ruang (IDR, USD, SGD), dan batasan anggaran bulanan per kategori pengeluaran (Makanan, Transportasi, Belanja, Tabungan) melalui dialog pengaturan ruang.
*   **ID-F27**: Sistem harus menampilkan indikator kemajuan anggaran per kategori pada dasbor secara real-time yang berubah warna berdasarkan tingkat konsumsi: Hijau (sehat, < 70%), Oranye (waspada, 70-90%), dan Merah (kritis, > 90%).
*   **ID-F28**: Sistem harus menyajikan lencana status 'Overbudget' pada Balance Hub dasbor jika total alokasi batasan anggaran kategori melebihi total saldo utama yang tersedia.
*   **ID-F29**: Sistem harus menyediakan fitur 'Sembunyikan Saldo' (Privacy Toggle) berbasis tombol Mata (Eye/EyeOff) di Balance Hub. Fitur ini diaktifkan secara bawaan (hidden by default) demi melindungi data privasi keuangan pengguna di ruang publik. Saat aktif, seluruh nominal keuangan (saldo utama, stats bulanan, pagu anggaran kategori, dan daftar aktivitas feed) disamarkan menggunakan masker pelindung (`••••••`).

### 3.2 Modul Manajemen Transaksi & Scan Struk Pintar
*   **ID-F04**: Pengguna dapat mencatat transaksi pemasukan (`income`) dan pengeluaran (`expense`) secara manual dengan mengisi nominal, deskripsi, kategori (Makanan, Transportasi, Belanja, dll.), dan tanggal.
*   **ID-F05**: Sistem harus mendukung pengunggahan struk atau pengambilan foto struk belanja menggunakan kamera perangkat.
*   **ID-F06**: Sistem harus membaca detail struk dan mengisi formulir transaksi secara otomatis (Smart Scanning).

### 3.3 Mesin Skor Kesehatan Finansial (Financial Health Score Engine)
*   **ID-F07**: Sistem harus menghitung skor kesehatan finansial dinamis (skala 10 - 100) berdasarkan algoritma internal berikut:
    
    > [!IMPORTANT]
    > **Algoritma Skor Kesehatan Finansial**:
    > 1. Skor dasar dimulai dari `100`.
    > 2. Dikurangi sebesar nilai Rasio Debt-to-Income (DTI) bulanan (maksimum pengurangan `40` poin).
    > 3. Dievaluasi berdasarkan Rasio Menabung (*Savings Rate*):
    >    $$\text{Savings Rate} = \frac{\text{Total Pendapatan} - \text{Total Pengeluaran}}{\text{Total Pendapatan}} \times 100\%$$
    >    * Jika *Savings Rate* $< 0\%$ (pengeluaran melampaui pemasukan): dikurangi `25` poin.
    >    * Jika *Savings Rate* $< 10\%$: dikurangi `15` poin.
    >    * Jika *Savings Rate* $< 30\%$: dikurangi `5` poin.
    >    * Jika tidak ada pendapatan bulanan tercatat namun terdapat pengeluaran: dikurangi `20` poin.
    > 4. Nilai akhir dibatasi antara batas minimum `10` dan batas maksimum `100`.

*   **ID-F08**: Sistem mengelompokkan skor kesehatan keuangan ke dalam 3 kategori:
    *   Score $\ge 80$: **Excellent / Sempurna** (Hijau)
    *   Score $50 - 79$: **Fair / Cukup Sehat** (Oranye)
    *   Score $< 50$: **Critical / Buruk** (Merah)

### 3.4 Modul AI Financial Coach (Gemini AI Integration)
*   **ID-F09**: AI Coach harus menganalisis data transaksi (hingga 20 transaksi terbaru) dan menghasilkan rekomendasi finansial yang ramah, berempati, dan persuasif dalam satu kalimat (maksimal 25 kata).
*   **ID-F10**: AI Advisor harus menyediakan fitur obrolan interaktif (Chat Interface) di mana pengguna dapat menanyakan rencana keuangan, tips investasi, dan alokasi anggaran dengan konteks transaksi mereka saat ini.
*   **ID-F11**: Jika kunci API tidak terdeteksi atau koneksi gagal, sistem harus mengaktifkan *Smart Client-Side Fallback Engine* untuk memberikan analisis aturan berbasis persentase pengeluaran kategori terbesar.

### 3.5 Modul Pelacak Utang & Rasio DTI (Debt Tracker)
*   **ID-F12**: Pengguna dapat menambahkan kewajiban utang aktif dengan data: Lender/Institusi, Jumlah Pokok, Suku Bunga (% per tahun), Tenor (Bulan), dan Jenis Suku Bunga (Fixed atau Floating).
*   **ID-F13**: Sistem harus mengkalkulasi cicilan bulanan untuk setiap utang terdaftar secara otomatis dengan formula:
    
    $$\text{Total Kewajiban} = \text{Pokok} \times \left(1 + \left(\frac{\text{Bunga}}{100}\right) \times \left(\frac{\text{Tenor}}{12}\right)\right)$$
    $$\text{Cicilan Bulanan} = \frac{\text{Total Kewajiban}}{\text{Tenor}}$$

*   **ID-F14**: Sistem harus menghitung Rasio Debt-to-Income (DTI) bulanan:
    
    $$\text{Rasio DTI} = \text{Round}\left(\frac{\text{Total Cicilan Bulanan}}{\text{Pendapatan Bulanan}} \times 100\right)$$
    *(Jika pendapatan bulanan nihil, sistem menggunakan benchmark pendapatan standar Nemu sebesar Rp 12.500.000).*

*   **ID-F15**: DTI diklasifikasikan ke dalam 3 tingkat risiko:
    *   $\text{DTI} < 30\%$: **Aman / Healthy** (Hijau)
    *   $30\% \le \text{DTI} \le 50\%$: **Siaga / Warning** (Oranye)
    *   $\text{DTI} > 50\%$: **Bahaya / Danger** (Merah)
*   **ID-F16**: Pengguna dapat membayar cicilan utang langsung dari saldo Nemu, yang otomatis mengurangi total saldo berjalan dan memperbarui sisa utang berjalan (*outstanding balance*).

### 3.6 Modul Simulator Kredit (Credit Simulator)
*   **ID-F17**: Menyediakan simulasi kredit yang dapat beralih ke 5 instrumen: KPR Konvensional, KPR Syariah, Kredit Mobil (Flat), Kredit Motor (Flat), dan KTA (Flat).
*   **ID-F18**: Implementasi formula simulasi kredit harus mengikuti standar perbankan berikut:

    > [!NOTE]
    > **A. KPR Konvensional (Anuitas Efektif + Masa Mengambang)**
    > *   **Masa Tetap (Tahun 1-3)**: Menggunakan formula cicilan anuitas efektif.
    >     $$M_{\text{fixed}} = P \times \frac{r_{\text{fixed}} \times (1 + r_{\text{fixed}})^N}{(1 + r_{\text{fixed}})^N - 1}$$
    >     di mana $P$ = Pokok Pinjaman, $r_{\text{fixed}}$ = Suku bunga bulanan tetap $\left(\frac{\text{Suku Bunga}}{100 \times 12}\right)$, $N$ = Total tenor dalam bulan.
    > *   **Masa Mengambang (Tahun 4+)**: Bunga diasumsikan melonjak $+4.5\%$ p.a.
    >     Sisa utang pokok setelah 36 bulan dihitung dengan rumus amortisasi sisa:
    >     $$P_{\text{outstanding}} = P \times \frac{(1 + r_{\text{fixed}})^N - (1 + r_{\text{fixed}})^{36}}{(1 + r_{\text{fixed}})^N - 1}$$
    >     Cicilan bulanan mengambang kemudian dihitung menggunakan sisa tenor $(N - 36)$ bulan:
    >     $$M_{\text{floating}} = P_{\text{outstanding}} \times \frac{r_{\text{floating}} \times (1 + r_{\text{floating}})^{N-36}}{(1 + r_{\text{floating}})^{N-36} - 1}$$
    > 
    > **B. KPR Syariah (Murabahah - Angsuran Tetap Terkunci)**
    > *   Keuntungan bank ditentukan menggunakan margin tetap di awal yang disepakati bersama.
    >     $$\text{Total Margin} = P \times \left(\frac{\text{Margin Bunga p.a.}}{100}\right) \times \text{Tenor (Tahun)}$$
    >     $$\text{Total Pembayaran Kembali (Harga Beli)} = P + \text{Total Margin}$$
    >     $$M_{\text{syariah}} = \frac{\text{Total Pembayaran Kembali}}{\text{Total Tenor (Bulan)}}$$
    > *   Angsuran terkunci dan konstan dari bulan pertama hingga lunas tanpa ada fluktuasi bunga pasar.
    >
    > **C. Kredit Mobil / Motor (Flat Rate)**
    > *   Menggunakan perhitungan bunga flat standar pembiayaan otomotif.
    >     $$\text{Total Bunga Flat} = P \times \left(\frac{\text{Suku Bunga p.a.}}{100}\right) \times \text{Tenor (Tahun)}$$
    >     $$M_{\text{flat}} = \frac{P + \text{Total Bunga Flat}}{\text{Total Tenor (Bulan)}}$$
    >
    > **D. KTA (Kredit Tanpa Agunan - Tenor Bulanan)**
    > *   Menggunakan flat rate dengan input tenor berbasis bulan langsung.
    >     $$\text{Total Bunga KTA} = P \times \left(\frac{\text{Suku Bunga p.a.}}{100}\right) \times \left(\frac{\text{Tenor (Bulan)}}{12}\right)$$
    >     $$M_{\text{kta}} = \frac{P + \text{Total Bunga KTA}}{\text{Tenor (Bulan)}}$$

*   **ID-F19**: Simulator harus menampilkan diagram batang visual perbandingan rasio total pokok terhadap total bunga/margin.

### 3.7 Modul Peta Jalan Finansial (Emergency & Wealth Roadmap)
*   **ID-F20**: Menyediakan peta jalan interaktif yang terdiri dari 3 fase berkelanjutan:
    *   *Fase 1: Dana Darurat*: Menghitung target minimal sebesar 6 kali pengeluaran bulanan rata-rata. Menunjukkan bar persentase pencapaian berdasarkan saldo keluarga berjalan.
    *   *Fase 2: Bebas Utang*: Target melunasi seluruh kewajiban utang aktif (Rasio DTI = 0%). Dilengkapi tombol interaktif penanda pelunasan.
    *   *Fase 3: Membangun Kekayaan*: Target investasi jangka panjang berbasis akumulasi aset dengan slider target yang dapat disesuaikan (Rp 10 juta hingga Rp 1 miliar).

### 3.8 Modul Edukasi Keuangan Anak (Kids Financial Kit)
*   **ID-F21**: Hanya aktif pada *Married/Family Space*. Orang tua dapat menambahkan profil anak, membuat tugas dengan imbalan finansial tertentu (misal: "Membersihkan kamar" senilai Rp 10.000), serta membuat target tabungan impian anak (misal: "Membeli Sepeda").
*   **ID-F22**: Anak-anak dapat melihat tugas mereka dan mengeklik tombol "Klaim". Aksi ini mengubah status tugas menjadi `'claimed'` (menunggu persetujuan). Orang tua (pengguna dengan `role === 'parent'`) melihat antrean persetujuan tugas anak. Jika disetujui (Approve), sistem memicu transaksi atomik untuk memotong saldo utama ruang keluarga, menyetor nominal imbalan ke saldo dompet anak (`kidWallet`), mencatat log aktivitas pengeluaran, dan mengubah status tugas menjadi `'completed'`. Jika ditolak (Reject), status tugas dikembalikan ke `'pending'` dan informasi pengklaim dihapus.
*   **ID-F23**: Visualisasi tabungan anak harus menampilkan persentase progress saldo anak terhadap target tabungan impian mereka.

### 3.9 Modul Komunitas Sosial (Financial Community Feed)
*   **ID-F24**: Pengguna dapat mempublikasikan cerita, keluh kesah, atau tips finansial ke feed komunitas finansial internal.
*   **ID-F25**: Feed bersifat interaktif di mana pengguna lain dapat menyukai (*like*) postingan dan memberikan komentar/balasan secara real-time.

---

## 4. SKENARIO BATASAN EKSTREM & PENANGANAN KESALAHAN (EDGE CASES & ERROR HANDLING)

Sebagai bentuk optimasi sistem analis, berikut dijabarkan penanganan skenario ekstrem demi menjaga stabilitas data transaksi:

### 4.1 Kegagalan Sinkronisasi Offline & Resolusi Konflik (Conflict Resolution)
*   Ketika pengguna melakukan transaksi dalam kondisi luring (offline), Firebase Firestore secara otomatis akan menyimpan mutasi pada cache lokal (*offline persistence*).
*   **Kebijakan Resolusi Konflik**: Apabila terjadi tabrakan pembaruan saldo (*race condition*) ketika jaringan kembali pulih (online), sistem menerapkan strategi **Last-Write-Wins (LWW)** berdasarkan stempel waktu server (`serverTimestamp`), namun mutasi individual pengeluaran/pemasukan tetap di-append secara kronologis untuk menjamin integritas data (tidak ada transaksi yang terhapus).

### 4.2 Kegagalan Kamera & OCR Scanner
*   **Kasus**: Ketiadaan hak akses kamera, gambar struk buram, atau total belanja tidak terbaca.
*   **Penanganan**: Sistem akan menampilkan overlay petunjuk khusus untuk mengizinkan kamera secara manual. Jika OCR gagal mengekstrak data dari struk, sistem akan mengalihkan pengguna ke formulir entri data manual dengan menampilkan pemberitahuan informatif, menjaga agar alur kerja pengguna tidak terputus (*graceful degradation*).

### 4.3 Quota Exceeded / Gemini API Timeouts
*   **Kasus**: Kehabisan kuota kueri AI atau waktu respons Gemini melampaui batas waktu (*timeout*).
*   **Penanganan**: AI Advisor beralih secara otomatis dalam waktu kurang dari 1.2 detik ke *Smart Client-Side Fallback Engine* untuk menghasilkan analisis heuristic terstruktur berbasis persentase kategori pengeluaran terbesar yang dihitung langsung dari transaksi lokal klien.

---

## 5. PERSYARATAN NON-FUNGSIONAL (NON-FUNCTIONAL REQUIREMENTS)

### 5.1 Kinerja & Latency Budgets
*   **ID-NF01**: Waktu respons render awal aplikasi harus kurang dari 2 detik menggunakan optimasi Vite dan pembagian bundel (*code-splitting*).
*   **ID-NF02**: Kecepatan pemrosesan transaksi dan kalkulasi kalkulator harus instan di sisi klien tanpa jeda visual.
*   **ID-NF03**: Batasan waktu respons (Latency Budgets):
    *   Respons Obrolan AI (Gemini API): $< 3500\text{ ms}$
    *   Sinkronisasi Firestore Offline-to-Online: $< 1000\text{ ms}$ setelah koneksi pulih
    *   Operasi Kalkulator Simulator Kredit: $< 50\text{ ms}$

### 5.2 Keamanan (Security)
*   **ID-NF04**: Semua interaksi dengan Firestore dilindungi oleh aturan keamanan Firestore (*Firestore Security Rules*) yang memvalidasi bahwa pengguna hanya dapat membaca/menulis data milik keluarga mereka sendiri (`request.auth.uid != null`).
*   **ID-NF05**: Kunci API untuk Gemini AI harus disimpan secara aman di variabel lingkungan (`.env.local` atau Cloud Environment) dan tidak pernah diekspos secara publik di repositori Git.

### 5.3 Keandalan & Ketersediaan (Reliability & Availability)
*   **ID-NF06**: Aplikasi harus dirancang agar tetap dapat diakses secara offline melalui konfigurasi Progressive Web App (PWA) dengan strategi caching aset statis dan service worker.
*   **ID-NF07**: Sistem obrolan AI harus menangani kesalahan kegagalan jaringan secara elegan dengan beralih ke analisis lokal (*client-side fallback*) untuk menghindari error pada antarmuka pengguna.

### 5.4 Usabilitas & Estetika (Usability & Design Aesthetics)
*   **ID-NF08**: Antarmuka harus mengadopsi prinsip desain premium: latar belakang bernuansa krem lembut (`#fdfcfb`), tombol bersudut membulat ekstrim (`rounded-[2.5rem]`), tipografi modern sans-serif, gradien lembut, dan efek kartu melayang (*glassmorphism*).
*   **ID-NF09**: Desain antarmuka harus sepenuhnya responsif, teroptimasi dengan sempurna baik pada perangkat seluler layar vertikal maupun desktop layar lebar.

---

## 6. STRUKTUR DATA & SKEMA DATABASE

Nemu menggunakan skema database dokumen non-relasional pada Google Cloud Firestore. Berikut adalah spesifikasi koleksi utama:

### 6.1 Koleksi `users`
Koleksi ini menyimpan metadata profil pengguna individu.
*   `uid` (String, Key): ID unik pengguna dari Firebase Auth.
*   `name` (String): Nama lengkap pengguna.
*   `email` (String): Alamat email terdaftar.
*   `photoURL` (String): Tautan foto profil Google.
*   `familyId` (String): ID keluarga/ruang aktif tempat pengguna bernaung.
*   `role` (String): Peran pengguna (`parent` / `spouse` / `child`).
*   `createdAt` (Timestamp): Tanggal akun dibuat.

### 6.2 Koleksi `families`
Koleksi ini merepresentasikan "Ruang Keuangan" (Space) bersama.
*   `familyId` (String, Key): ID unik grup keluarga.
*   `name` (String, optional): Nama kustom ruang keuangan aktif.
*   `spaceType` (String): Jenis ruang (`personal` / `unmarried` / `married`).
*   `totalBalance` (Number): Total saldo gabungan berjalan.
*   `currency` (String): Mata uang aktif per ruang (`IDR` / `USD` / `SGD`).
*   `budgetLimits` (Map, optional): Pemetaan batasan anggaran bulanan per kategori (contoh: `{ Food: 100000, Shopping: 50000 }`).
*   `updatedAt` (Timestamp): Waktu pembaruan terakhir.

### 6.3 Koleksi `transactions`
Koleksi ini mencatat seluruh aktivitas pengeluaran dan pemasukan finansial dalam ruang.
*   `transactionId` (String, Key): ID unik transaksi.
*   `familyId` (String): Referensi ke ruang keluarga pemilik transaksi.
*   `userId` (String): ID pengguna yang membuat transaksi.
*   `amount` (Number): Nominal uang transaksi.
*   `type` (String): Jenis transaksi (`expense` / `income`).
*   `category` (String): Kategori transaksi (contoh: `Food`, `Transport`, `Shopping`, `Savings`).
*   `description` (String): Keterangan transaksi.
*   `date` (ISOString): Tanggal terjadinya transaksi.
*   `approved` (Boolean): Status persetujuan transaksi (bawaan: `true`).
*   `createdAt` (ISOString): Waktu pencatatan di database.

### 6.4 Koleksi Modul Anak (`kidWallets`, `tasks`, `savingGoals`)
Koleksi terdedikasi untuk operasional modul keuangan anak.
*   `kidWallets` (Dokumen):
    *   `id` (Key)
    *   `familyId` (String)
    *   `name` (String): Nama anak.
    *   `balance` (Number): Saldo tabungan anak saat ini.
*   `tasks` (Dokumen):
    *   `id` (Key)
    *   `familyId` (String)
    *   `title` (String): Judul tugas.
    *   `rewardAmount` (Number): Imbalan yang dijanjikan.
    *   `status` (String): Status pengerjaan tugas (`pending` / `claimed` / `completed`).
    *   `claimedByKidWalletId` (String): ID dompet anak yang mengklaim tugas (jika status `claimed`).
    *   `claimedByKidName` (String): Nama anak yang mengklaim tugas (jika status `claimed`).
*   `savingGoals` (Dokumen):
    *   `id` (Key)
    *   `familyId` (String)
    *   `title` (String): Nama barang impian anak.
    *   `targetAmount` (Number): Target harga barang.

### 6.5 Koleksi `debts`
Koleksi ini menyimpan kewajiban utang aktif untuk sinkronisasi kolaboratif lintas perangkat dalam ruang.
*   `id` (String, Key): ID unik utang (auto-generated).
*   `familyId` (String): Referensi ke ruang aktif.
*   `lender` (String): Pemberi pinjaman/institusi.
*   `principal` (Number): Nominal pokok utang.
*   `interestRate` (Number): Suku bunga tahunan (% p.a.).
*   `interestType` (String): Jenis bunga (`fixed` / `floating`).
*   `tenor` (Number): Durasi cicilan (bulan).
*   `paidAmount` (Number): Total cicilan yang sudah dibayarkan.
*   `createdAt` (ISOString): Tanggal penambahan utang.
*   `updatedAt` (ISOString): Tanggal pembaruan pembayaran utang terakhir (opsional).
