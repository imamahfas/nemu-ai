import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "app_name": "Nemu",
      "slogan": "Financial harmony for your family, powered by AI.",
      "shared_balance": "Shared Family Balance",
      "add_income": "Add Income",
      "scan_receipt": "Scan Receipt",
      "financial_coach": "Financial Coach",
      "income": "Income",
      "expenses": "Expenses",
      "recent_activity": "Recent Activity",
      "view_all": "View all",
      "no_transactions": "No transactions yet. Start scanning!",
      "kids_kit": "Kids Financial Kit",
      "coming_soon": "Coming Soon",
      "sign_in_google": "Sign in with Google",
      "smart_scanning": "Smart Scanning",
      "shared_wallets": "Shared Wallets",
      "premium_office": "The Premium Family Office",
      "reading_receipt": "Reading receipt details...",
      "camera_start": "Start Camera",
      "camera_allow": "Please allow camera access to scan receipts.",
      "home": "Home",
      "stats": "Stats",
      "goals": "Goals",
      "kids": "Kids"
    }
  },
  id: {
    translation: {
      "app_name": "Nemu",
      "slogan": "Harmoni keuangan keluarga, didukung oleh AI.",
      "shared_balance": "Saldo Gabungan Keluarga",
      "add_income": "Pemasukan",
      "scan_receipt": "Scan Struk",
      "financial_coach": "Pelatih Keuangan",
      "income": "Pemasukan",
      "expenses": "Pengeluaran",
      "recent_activity": "Aktivitas Terbaru",
      "view_all": "Lihat semua",
      "no_transactions": "Belum ada transaksi. Ayo scan struk!",
      "kids_kit": "Modul Keuangan Anak",
      "coming_soon": "Segera Hadir",
      "sign_in_google": "Masuk dengan Google",
      "smart_scanning": "Scan Pintar",
      "shared_wallets": "Dompet Bersama",
      "premium_office": "Kantor Keuagan Keluarga Premium",
      "reading_receipt": "Membaca detail struk...",
      "camera_start": "Buka Kamera",
      "camera_allow": "Izinkan akses kamera untuk scan struk.",
      "home": "Beranda",
      "stats": "Statistik",
      "goals": "Target",
      "kids": "Anak"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'id',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
