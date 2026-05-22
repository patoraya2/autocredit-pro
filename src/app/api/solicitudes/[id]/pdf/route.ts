import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from '@/lib/supabase/server'

function safeSetText(form: ReturnType<PDFDocument['getForm']>, fieldName: string, value: string) {
  try {
    form.getTextField(fieldName).setText(value)
  } catch {}
}

function safeSetDropdown(form: ReturnType<PDFDocument['getForm']>, fieldName: string, value: string) {
  try {
    form.getDropdown(fieldName).select(value)
  } catch {}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fillBanorte(templateBytes: Buffer, data: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const { cliente, solicitud } = data

  safeSetText(form, 'NOMBRES', String(cliente.nombre ?? ''))
  safeSetText(form, 'APELLIDO PATERNO', String(cliente.apellido_paterno ?? ''))
  safeSetText(form, 'APELLIDO MATERNO', String(cliente.apellido_materno ?? ''))
  safeSetText(form, 'RFC con homoclave si cuenta con ella', String(cliente.rfc ?? ''))
  safeSetText(form, 'CURP', String(cliente.curp ?? ''))
  safeSetText(form, 'DOMICILIO calle número exterior e interior', String(cliente.domicilio ?? ''))
  safeSetText(form, 'COLONIA', String(cliente.colonia ?? ''))
  safeSetText(form, 'POBLACIÓN', String(cliente.ciudad ?? ''))
  safeSetText(form, 'ESTADO', String(cliente.estado ?? ''))
  safeSetText(form, 'CÓDIGO POSTAL', String(cliente.cp ?? ''))
  safeSetText(form, 'TELÉFONO CELULAR', String(cliente.telefono ?? ''))
  safeSetText(form, 'DIRECCIÓN DE CORREO ELECTRÓNICO EMAIL', String(cliente.email ?? ''))
  safeSetText(form, 'nombre de la empresa', String(cliente.empresa ?? ''))
  safeSetText(form, 'puesto empresa 00', String(cliente.ocupacion ?? ''))
  safeSetText(form, 'ingreso bruto del sin', cliente.ingreso_mensual ? String(cliente.ingreso_mensual) : '')
  safeSetText(form, 'importe del crediyo', solicitud.monto_financiar ? String(solicitud.monto_financiar) : '')
  safeSetText(form, 'seguro socila numero', String(cliente.nss ?? ''))

  return pdfDoc.save()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fillBBVA(templateBytes: Buffer, data: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const { cliente } = data
  const now = new Date()

  safeSetText(form, 'Primer Nombre', String(cliente.nombre ?? ''))
  safeSetText(form, 'Apellido Paterno', String(cliente.apellido_paterno ?? ''))
  safeSetText(form, 'Apellido materno', String(cliente.apellido_materno ?? ''))
  safeSetText(form, 'RFC', String(cliente.rfc ?? ''))
  safeSetText(form, 'curp', String(cliente.curp ?? ''))
  safeSetText(form, 'Celular', String(cliente.telefono ?? ''))
  safeSetText(form, 'Domicilio', String(cliente.domicilio ?? ''))
  safeSetText(form, 'código Postal', String(cliente.cp ?? ''))
  safeSetText(form, 'Colonia o fraccionamiento', String(cliente.colonia ?? ''))
  safeSetText(form, 'Ciudad', String(cliente.ciudad ?? ''))
  safeSetDropdown(form, 'Dropdown1', String(cliente.estado ?? 'Sinaloa'))
  safeSetText(form, 'correo electrónico', String(cliente.email ?? ''))
  safeSetText(form, 'ingreso mensual (pesos), antes de deducciones', cliente.ingreso_mensual ? String(cliente.ingreso_mensual) : '')
  safeSetText(form, 'nombre de la empresa (razón social/ nombre comercial)', String(cliente.empresa ?? ''))
  safeSetText(form, 'cargo o puesto', String(cliente.ocupacion ?? ''))
  safeSetText(form, 'Día', String(now.getDate()).padStart(2, '0'))
  safeSetText(form, 'Mes', String(now.getMonth() + 1).padStart(2, '0'))
  safeSetText(form, 'Año', String(now.getFullYear()))

  return pdfDoc.save()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fillScotiabank(templateBytes: Buffer, data: any): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(templateBytes)
  const form = pdfDoc.getForm()
  const { cliente, solicitud, unidad } = data

  safeSetText(form, 'Nombre', String(cliente.nombre ?? ''))
  safeSetText(form, 'Apellido P', String(cliente.apellido_paterno ?? ''))
  safeSetText(form, 'Apellido M', String(cliente.apellido_materno ?? ''))

  const rfc = String(cliente.rfc ?? '').toUpperCase()
  for (let i = 0; i < 13; i++) {
    safeSetText(form, `RFC${i + 1}`, rfc[i] ?? '')
  }

  const curp = String(cliente.curp ?? '').toUpperCase()
  for (let i = 0; i < 18; i++) {
    safeSetText(form, `CURP${i + 1}`, curp[i] ?? '')
  }

  safeSetText(form, 'Celular', String(cliente.telefono ?? ''))
  safeSetText(form, 'Correo Electrónico', String(cliente.email ?? ''))
  safeSetText(form, 'Domicilio', String(cliente.domicilio ?? ''))
  safeSetText(form, 'Colonia', String(cliente.colonia ?? ''))
  safeSetText(form, 'Ciudad', String(cliente.ciudad ?? ''))
  safeSetText(form, 'Estado', String(cliente.estado ?? ''))
  safeSetText(form, 'CP', String(cliente.cp ?? ''))
  safeSetText(form, 'Nombre Empresa', String(cliente.empresa ?? ''))
  safeSetText(form, 'Puesto', String(cliente.ocupacion ?? ''))
  safeSetText(form, 'Ingresos', cliente.ingreso_mensual ? String(cliente.ingreso_mensual) : '')

  safeSetText(form, 'Marca', String(unidad.marca ?? ''))
  safeSetText(form, 'Tipo', String(unidad.modelo ?? ''))
  safeSetText(form, 'Valor Factura', solicitud.precio_venta ? String(solicitud.precio_venta) : '')
  safeSetText(form, 'Monto Enganche', solicitud.enganche ? String(solicitud.enganche) : '')
  safeSetText(form, 'Monto a Financiar', solicitud.monto_financiar ? String(solicitud.monto_financiar) : '')
  safeSetText(form, 'Plazo a Meses', solicitud.plazo_meses ? String(solicitud.plazo_meses) : '')

  return pdfDoc.save()
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = (await createClient()) as any

  const { data: sol, error } = await supabase
    .from('solicitudes')
    .select('*, clientes(*), unidades(*), bancos(*)')
    .eq('id', id)
    .single()

  if (error || !sol) {
    return NextResponse.json({ error: 'Solicitud no encontrada' }, { status: 404 })
  }

  const bankCode = String(sol.bancos?.codigo ?? '').toUpperCase()

  let templateName: string
  if (bankCode === 'BANORTE') templateName = 'BANORTE.pdf'
  else if (bankCode === 'BBVA') templateName = 'BBVA.pdf'
  else if (bankCode === 'SCOTIABANK') templateName = 'SCOTIABANK.pdf'
  else return NextResponse.json({ error: `Banco "${bankCode}" no soportado` }, { status: 400 })

  const templateBytes = readFileSync(join(process.cwd(), 'public', 'templates', templateName))

  let filledBytes: Uint8Array

  if (bankCode === 'BANORTE') {
    filledBytes = await fillBanorte(templateBytes, { cliente: sol.clientes, solicitud: sol })
  } else if (bankCode === 'BBVA') {
    filledBytes = await fillBBVA(templateBytes, { cliente: sol.clientes, solicitud: sol })
  } else {
    filledBytes = await fillScotiabank(templateBytes, {
      cliente: sol.clientes,
      solicitud: sol,
      unidad: sol.unidades,
    })
  }

  const filename = `solicitud-${sol.folio}-${bankCode}.pdf`

  return new NextResponse(Buffer.from(filledBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
