import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'IDR') {
  const upperCurrency = (currency || 'IDR').toUpperCase();
  let locale = 'id-ID';
  if (upperCurrency === 'USD') locale = 'en-US';
  else if (upperCurrency === 'SGD') locale = 'en-SG';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: upperCurrency,
    minimumFractionDigits: upperCurrency === 'IDR' ? 0 : 2,
  }).format(amount);
}

export function formatNumberInput(val: string): string {
  const clean = val.replace(/\D/g, '');
  if (!clean) return '';
  return parseInt(clean, 10).toLocaleString('id-ID');
}

export function parseNumberInput(val: string): number {
  const clean = val.replace(/\D/g, '');
  return clean ? parseInt(clean, 10) : 0;
}
