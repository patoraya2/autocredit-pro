export type EstatusUnidad = 'disponible' | 'apartada' | 'en_proceso' | 'vendida'
export type EstatusSolicitud =
  | 'nueva'
  | 'preparando'
  | 'enviada'
  | 'en_revision'
  | 'aprobada'
  | 'rechazada'
  | 'fondeada'
  | 'cancelada'

export interface Banco {
  id: string
  nombre: string
  codigo: string
  color: string
  activo: boolean
  created_at: string
}

export interface Cliente {
  id: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  curp?: string
  rfc?: string
  fecha_nacimiento?: string
  telefono?: string
  telefono_alternativo?: string
  email?: string
  estado_civil?: string
  domicilio?: string
  colonia?: string
  ciudad?: string
  estado?: string
  cp?: string
  ocupacion?: string
  empresa?: string
  ingreso_mensual?: number
  antiguedad_laboral?: string
  tipo_empleado?: string
  nss?: string
  notas?: string
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Unidad {
  id: string
  marca: string
  modelo: string
  anio: number
  version?: string
  color?: string
  numero_serie?: string
  numero_motor?: string
  placas?: string
  precio: number
  precio_lista?: number
  tipo: string
  transmision?: string
  combustible?: string
  kilometraje?: number
  estatus: EstatusUnidad
  imagen_url?: string
  notas?: string
  created_at: string
  updated_at: string
}

export interface Solicitud {
  id: string
  folio: string
  cliente_id: string
  unidad_id: string
  banco_id: string
  precio_venta: number
  enganche: number
  monto_financiar: number
  plazo_meses: number
  tasa_anual?: number
  pago_mensual?: number
  estatus: EstatusSolicitud
  fecha_envio?: string
  fecha_respuesta?: string
  fecha_fondeo?: string
  numero_credito?: string
  observaciones?: string
  pdf_url?: string
  pdf_generado: boolean
  comision?: number
  comision_pagada: boolean
  fecha_pago_comision?: string
  created_at: string
  updated_at: string
}

export interface SolicitudCompleta {
  id: string
  folio: string
  estatus: EstatusSolicitud
  precio_venta: number
  enganche: number
  monto_financiar: number
  plazo_meses: number
  pago_mensual?: number
  comision?: number
  comision_pagada: boolean
  fecha_envio?: string
  fecha_respuesta?: string
  fecha_fondeo?: string
  created_at: string
  cliente_id: string
  cliente_nombre: string
  cliente_telefono?: string
  cliente_email?: string
  unidad_id: string
  unidad_descripcion: string
  numero_serie?: string
  unidad_precio: number
  banco_id: string
  banco_nombre: string
  banco_codigo: string
  banco_color: string
}

export interface SolicitudHistorial {
  id: string
  solicitud_id: string
  estatus_anterior?: string
  estatus_nuevo: string
  nota?: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      bancos: { Row: Banco; Insert: Omit<Banco, 'id' | 'created_at'>; Update: Partial<Banco> }
      clientes: { Row: Cliente; Insert: Omit<Cliente, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Cliente> }
      unidades: { Row: Unidad; Insert: Omit<Unidad, 'id' | 'created_at' | 'updated_at'>; Update: Partial<Unidad> }
      solicitudes: { Row: Solicitud; Insert: Omit<Solicitud, 'id' | 'folio' | 'monto_financiar' | 'created_at' | 'updated_at'>; Update: Partial<Solicitud> }
      solicitud_historial: { Row: SolicitudHistorial; Insert: Omit<SolicitudHistorial, 'id' | 'created_at'>; Update: Partial<SolicitudHistorial> }
    }
    Views: {
      solicitudes_completas: { Row: SolicitudCompleta }
    }
  }
}
