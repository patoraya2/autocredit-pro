import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export const ESTATUS_SOLICITUD_LABELS: Record<string, string> = {
  nueva: 'Nueva',
  preparando: 'Preparando',
  enviada: 'Enviada',
  en_revision: 'En Revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  fondeada: 'Fondeada',
  cancelada: 'Cancelada',
}

export const ESTATUS_SOLICITUD_COLORS: Record<string, string> = {
  nueva: 'bg-slate-100 text-slate-700',
  preparando: 'bg-yellow-100 text-yellow-700',
  enviada: 'bg-blue-100 text-blue-700',
  en_revision: 'bg-purple-100 text-purple-700',
  aprobada: 'bg-green-100 text-green-700',
  rechazada: 'bg-red-100 text-red-700',
  fondeada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-gray-100 text-gray-500',
}

export const ESTATUS_UNIDAD_LABELS: Record<string, string> = {
  disponible: 'Disponible',
  apartada: 'Apartada',
  en_proceso: 'En Proceso',
  vendida: 'Vendida',
}

export const ESTATUS_UNIDAD_COLORS: Record<string, string> = {
  disponible: 'bg-green-100 text-green-700',
  apartada: 'bg-yellow-100 text-yellow-700',
  en_proceso: 'bg-blue-100 text-blue-700',
  vendida: 'bg-gray-100 text-gray-500',
}

export function getNombreCompleto(cliente: { nombre: string; apellido_paterno: string; apellido_materno?: string }): string {
  return [cliente.nombre, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
}
