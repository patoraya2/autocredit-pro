import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ——————————————————————————————————————————
// Herramientas del agente (tool use)
// ——————————————————————————————————————————
const tools: Anthropic.Tool[] = [
  {
    name: 'registrar_cliente',
    description: 'Registra un nuevo cliente en el sistema de crédito automotriz',
    input_schema: {
      type: 'object' as const,
      properties: {
        nombre: { type: 'string', description: 'Nombre(s) del cliente' },
        apellido_paterno: { type: 'string', description: 'Apellido paterno' },
        apellido_materno: { type: 'string', description: 'Apellido materno (opcional)' },
        telefono: { type: 'string', description: 'Teléfono celular' },
        telefono_alternativo: { type: 'string', description: 'Teléfono alternativo' },
        email: { type: 'string', description: 'Correo electrónico' },
        curp: { type: 'string', description: 'CURP (18 caracteres)' },
        rfc: { type: 'string', description: 'RFC con homoclave' },
        nss: { type: 'string', description: 'Número de Seguro Social' },
        fecha_nacimiento: { type: 'string', description: 'Fecha de nacimiento en formato YYYY-MM-DD' },
        estado_civil: { type: 'string', description: 'Estado civil: Soltero/a, Casado/a, Divorciado/a, Viudo/a, Unión libre' },
        domicilio: { type: 'string', description: 'Calle y número' },
        colonia: { type: 'string', description: 'Colonia' },
        ciudad: { type: 'string', description: 'Ciudad o municipio' },
        estado: { type: 'string', description: 'Estado de la república' },
        cp: { type: 'string', description: 'Código postal' },
        ingreso_mensual: { type: 'number', description: 'Ingreso mensual en pesos' },
        empresa: { type: 'string', description: 'Empresa donde trabaja' },
        ocupacion: { type: 'string', description: 'Ocupación o puesto' },
        tipo_empleado: { type: 'string', description: 'Tipo: asalariado, independiente, empresario, pensionado' },
        antiguedad_laboral: { type: 'string', description: 'Antigüedad laboral (ej: 2 años)' },
        notas: { type: 'string', description: 'Notas adicionales' },
      },
      required: ['nombre', 'apellido_paterno'],
    },
  },
  {
    name: 'registrar_unidad',
    description: 'Registra una nueva unidad/vehículo en el inventario',
    input_schema: {
      type: 'object' as const,
      properties: {
        marca: { type: 'string', description: 'Marca del vehículo (Ford, Chevrolet, etc.)' },
        modelo: { type: 'string', description: 'Modelo del vehículo (Lobo, Suburban, etc.)' },
        anio: { type: 'number', description: 'Año del vehículo' },
        version: { type: 'string', description: 'Versión o trim (Platinum, XLT, etc.)' },
        precio: { type: 'number', description: 'Precio de venta en pesos mexicanos' },
        numero_serie: { type: 'string', description: 'Número de serie (VIN)' },
        color: { type: 'string', description: 'Color del vehículo' },
        tipo: { type: 'string', description: 'nuevo o seminuevo' },
        transmision: { type: 'string', description: 'automatica o manual' },
        kilometraje: { type: 'number', description: 'Kilometraje (default 0 para nuevos)' },
      },
      required: ['marca', 'modelo', 'anio', 'precio'],
    },
  },
  {
    name: 'buscar_clientes',
    description: 'Busca clientes por nombre, apellido, RFC o teléfono',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Texto a buscar' },
      },
      required: ['query'],
    },
  },
  {
    name: 'buscar_unidades',
    description: 'Busca unidades disponibles por marca, modelo o número de serie',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Texto a buscar (marca, modelo, año)' },
        solo_disponibles: { type: 'boolean', description: 'Si true, solo muestra unidades disponibles' },
      },
      required: ['query'],
    },
  },
  {
    name: 'crear_solicitud',
    description: 'Crea una nueva solicitud de crédito automotriz',
    input_schema: {
      type: 'object' as const,
      properties: {
        cliente_id: { type: 'string', description: 'ID del cliente' },
        unidad_id: { type: 'string', description: 'ID de la unidad' },
        banco_nombre: { type: 'string', description: 'Nombre del banco: Scotiabank, BBVA o Banorte' },
        enganche: { type: 'number', description: 'Monto de enganche en pesos' },
        plazo_meses: { type: 'number', description: 'Plazo en meses (12, 24, 36, 48, 60, 72)' },
        precio_venta: { type: 'number', description: 'Precio de venta acordado' },
        notas: { type: 'string', description: 'Observaciones adicionales' },
      },
      required: ['cliente_id', 'unidad_id', 'banco_nombre'],
    },
  },
  {
    name: 'actualizar_estatus_solicitud',
    description: 'Actualiza el estatus de una solicitud de crédito',
    input_schema: {
      type: 'object' as const,
      properties: {
        solicitud_id: { type: 'string', description: 'ID o folio de la solicitud' },
        nuevo_estatus: {
          type: 'string',
          description: 'Nuevo estatus: nueva, preparando, enviada, en_revision, aprobada, rechazada, fondeada, cancelada',
        },
        nota: { type: 'string', description: 'Nota sobre el cambio de estatus' },
      },
      required: ['solicitud_id', 'nuevo_estatus'],
    },
  },
  {
    name: 'actualizar_cliente',
    description: 'Actualiza los datos de un cliente ya registrado',
    input_schema: {
      type: 'object' as const,
      properties: {
        cliente_id: { type: 'string', description: 'ID del cliente a actualizar' },
        nombre: { type: 'string' },
        apellido_paterno: { type: 'string' },
        apellido_materno: { type: 'string' },
        telefono: { type: 'string' },
        telefono_alternativo: { type: 'string' },
        email: { type: 'string' },
        curp: { type: 'string' },
        rfc: { type: 'string' },
        nss: { type: 'string' },
        fecha_nacimiento: { type: 'string' },
        estado_civil: { type: 'string' },
        domicilio: { type: 'string' },
        colonia: { type: 'string' },
        ciudad: { type: 'string' },
        estado: { type: 'string' },
        cp: { type: 'string' },
        ingreso_mensual: { type: 'number' },
        empresa: { type: 'string' },
        ocupacion: { type: 'string' },
        tipo_empleado: { type: 'string' },
        antiguedad_laboral: { type: 'string' },
        notas: { type: 'string' },
      },
      required: ['cliente_id'],
    },
  },
  {
    name: 'actualizar_unidad',
    description: 'Actualiza los datos de una unidad/vehículo ya registrada (precio, año, color, estatus, etc.)',
    input_schema: {
      type: 'object' as const,
      properties: {
        unidad_id: { type: 'string', description: 'ID de la unidad a actualizar' },
        marca: { type: 'string' },
        modelo: { type: 'string' },
        anio: { type: 'number' },
        version: { type: 'string' },
        color: { type: 'string' },
        precio: { type: 'number', description: 'Precio de venta en pesos' },
        precio_lista: { type: 'number' },
        numero_serie: { type: 'string' },
        numero_motor: { type: 'string' },
        placas: { type: 'string' },
        tipo: { type: 'string', description: 'nuevo o seminuevo' },
        transmision: { type: 'string' },
        combustible: { type: 'string' },
        kilometraje: { type: 'number' },
        estatus: { type: 'string', description: 'disponible, apartada, en_proceso, vendida' },
        notas: { type: 'string' },
      },
      required: ['unidad_id'],
    },
  },
  {
    name: 'obtener_resumen',
    description: 'Obtiene un resumen del sistema: clientes, unidades disponibles, solicitudes activas, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        tipo: {
          type: 'string',
          description: 'Qué resumen quieres: general, clientes, unidades, solicitudes, bancos',
        },
      },
      required: ['tipo'],
    },
  },
]

// ——————————————————————————————————————————
// Ejecutores de herramientas
// ——————————————————————————————————————————
async function executeTool(name: string, input: Record<string, unknown>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any

  if (name === 'registrar_cliente') {
    const { data, error } = await supabase
      .from('clientes')
      .insert(input)
      .select()
      .single()
    if (error) return { error: error.message }
    return { success: true, cliente: data, mensaje: `Cliente ${input.nombre} ${input.apellido_paterno} registrado con ID: ${data?.id}` }
  }

  if (name === 'registrar_unidad') {
    const { data, error } = await supabase
      .from('unidades')
      .insert({ ...input, anio: Number(input.anio), precio: Number(input.precio) })
      .select()
      .single()
    if (error) return { error: error.message }
    return { success: true, unidad: data, mensaje: `Unidad ${input.marca} ${input.modelo} ${input.anio} registrada con ID: ${data?.id}` }
  }

  if (name === 'buscar_clientes') {
    const { data } = await supabase
      .from('clientes')
      .select('id, nombre, apellido_paterno, apellido_materno, telefono, email, rfc, ciudad')
      .eq('activo', true)
      .or(`nombre.ilike.%${input.query}%,apellido_paterno.ilike.%${input.query}%,apellido_materno.ilike.%${input.query}%,rfc.ilike.%${input.query}%,telefono.ilike.%${input.query}%`)
      .limit(10)
    return { clientes: data || [], total: data?.length || 0 }
  }

  if (name === 'buscar_unidades') {
    let query = supabase
      .from('unidades')
      .select('id, marca, modelo, anio, version, precio, numero_serie, estatus, color')
      .or(`marca.ilike.%${input.query}%,modelo.ilike.%${input.query}%,numero_serie.ilike.%${input.query}%`)
    if (input.solo_disponibles) query = query.eq('estatus', 'disponible')
    const { data } = await query.limit(10)
    return { unidades: data || [], total: data?.length || 0 }
  }

  if (name === 'actualizar_cliente') {
    const { cliente_id, ...campos } = input
    // Eliminar campos undefined/vacíos
    const data = Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined && v !== ''))
    const { error } = await supabase.from('clientes').update(data).eq('id', cliente_id)
    if (error) return { error: error.message }
    return { success: true, mensaje: `Cliente actualizado correctamente.` }
  }

  if (name === 'actualizar_unidad') {
    const { unidad_id, ...campos } = input
    const data = Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined && v !== ''))
    if (data.anio) data.anio = Number(data.anio)
    if (data.precio) data.precio = Number(data.precio)
    if (data.precio_lista) data.precio_lista = Number(data.precio_lista)
    if (data.kilometraje) data.kilometraje = Number(data.kilometraje)
    const { error } = await supabase.from('unidades').update(data).eq('id', unidad_id)
    if (error) return { error: error.message }
    return { success: true, mensaje: `Unidad actualizada correctamente.` }
  }

  if (name === 'crear_solicitud') {
    const bancoMap: Record<string, string> = {
      scotiabank: 'SCOTIA', bbva: 'BBVA', banorte: 'BANORTE',
    }
    const bancoNombre = String(input.banco_nombre).toLowerCase()
    let bancoCodigo = bancoMap[bancoNombre]
    if (!bancoCodigo) {
      const match = Object.entries(bancoMap).find(([k]) => bancoNombre.includes(k))
      bancoCodigo = match?.[1] || bancoNombre.toUpperCase()
    }
    const { data: banco } = await supabase
      .from('bancos')
      .select('id, nombre')
      .eq('codigo', bancoCodigo)
      .single()
    if (!banco) return { error: `Banco no encontrado: ${input.banco_nombre}. Disponibles: Scotiabank, BBVA, Banorte` }

    let precioVenta = Number(input.precio_venta) || 0
    if (!precioVenta) {
      const { data: unidad } = await supabase.from('unidades').select('precio').eq('id', input.unidad_id).single()
      precioVenta = unidad?.precio || 0
    }

    const { data, error } = await supabase
      .from('solicitudes')
      .insert({
        folio: '',
        cliente_id: input.cliente_id as string,
        unidad_id: input.unidad_id as string,
        banco_id: banco.id,
        precio_venta: precioVenta,
        enganche: Number(input.enganche) || 0,
        plazo_meses: Number(input.plazo_meses) || 48,
        observaciones: input.notas as string | undefined,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    return {
      success: true,
      solicitud: data,
      mensaje: `Solicitud creada con folio ${data?.folio} para ${banco.nombre}. Monto a financiar: $${(precioVenta - (Number(input.enganche) || 0)).toLocaleString('es-MX')}`,
    }
  }

  if (name === 'actualizar_estatus_solicitud') {
    const solicitudId = String(input.solicitud_id)
    const isUUID = /^[0-9a-f-]{36}$/.test(solicitudId)
    const { data: solicitud } = isUUID
      ? await supabase.from('solicitudes').select('id').eq('id', solicitudId).single()
      : await supabase.from('solicitudes').select('id').eq('folio', solicitudId.toUpperCase()).single()

    if (!solicitud) return { error: 'Solicitud no encontrada' }

    const updateData: Record<string, unknown> = { estatus: input.nuevo_estatus }
    if (input.nuevo_estatus === 'enviada') updateData.fecha_envio = new Date().toISOString()
    if (input.nuevo_estatus === 'fondeada') updateData.fecha_fondeo = new Date().toISOString()
    if (['aprobada', 'rechazada'].includes(String(input.nuevo_estatus))) updateData.fecha_respuesta = new Date().toISOString()

    const { error } = await supabase.from('solicitudes').update(updateData).eq('id', solicitud.id)

    if (input.nota) {
      await supabase.from('solicitud_historial').insert({
        solicitud_id: solicitud.id,
        estatus_nuevo: String(input.nuevo_estatus),
        nota: String(input.nota),
      })
    }
    if (error) return { error: error.message }
    return { success: true, mensaje: `Estatus actualizado a "${input.nuevo_estatus}"` }
  }

  if (name === 'obtener_resumen') {
    const tipo = String(input.tipo)

    if (tipo === 'general' || tipo === 'clientes') {
      const { count: totalClientes } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true)
      if (tipo === 'clientes') return { total_clientes: totalClientes }
    }

    if (tipo === 'general' || tipo === 'unidades') {
      const { data: unidades } = await supabase.from('unidades').select('estatus, precio')
      const disponibles = (unidades as Array<{ estatus: string; precio: number }> | null)?.filter(u => u.estatus === 'disponible') || []
      if (tipo === 'unidades') return { total_unidades: unidades?.length, disponibles: disponibles.length }
    }

    if (tipo === 'general' || tipo === 'solicitudes') {
      const { data: solic } = await supabase.from('solicitudes').select('estatus, monto_financiar, comision')
      const por_estatus: Record<string, number> = {}
      let monto_total = 0
      ;(solic as Array<{ estatus: string; monto_financiar: number; comision: number }> | null)?.forEach(s => {
        por_estatus[s.estatus] = (por_estatus[s.estatus] || 0) + 1
        monto_total += s.monto_financiar || 0
      })
      if (tipo === 'solicitudes') return { por_estatus, monto_total, total: solic?.length }
    }

    if (tipo === 'bancos') {
      const { data } = await supabase.from('solicitudes_completas').select('banco_nombre, monto_financiar, estatus')
      const bancos: Record<string, { total: number; monto: number; aprobadas: number }> = {}
      ;(data as Array<{ banco_nombre: string; monto_financiar: number; estatus: string }> | null)?.forEach(s => {
        if (!bancos[s.banco_nombre]) bancos[s.banco_nombre] = { total: 0, monto: 0, aprobadas: 0 }
        bancos[s.banco_nombre].total++
        bancos[s.banco_nombre].monto += s.monto_financiar || 0
        if (s.estatus === 'aprobada' || s.estatus === 'fondeada') bancos[s.banco_nombre].aprobadas++
      })
      return { por_banco: bancos }
    }

    const [{ count: cl }, { data: un }, { data: so }] = await Promise.all([
      supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('activo', true),
      supabase.from('unidades').select('estatus'),
      supabase.from('solicitudes').select('estatus, monto_financiar'),
    ])
    type UnRow = { estatus: string }
    type SoRow = { estatus: string; monto_financiar: number }
    const disponibles = (un as UnRow[] | null)?.filter(u => u.estatus === 'disponible').length || 0
    const activas = (so as SoRow[] | null)?.filter(s => !['fondeada', 'rechazada', 'cancelada'].includes(s.estatus)).length || 0
    const montoTotal = (so as SoRow[] | null)?.reduce((a, b) => a + (b.monto_financiar || 0), 0) || 0
    return { clientes_activos: cl, unidades_disponibles: disponibles, solicitudes_activas: activas, monto_total_cartera: montoTotal }
  }

  return { error: 'Herramienta no reconocida' }
}

// ——————————————————————————————————————————
// POST Handler
// ——————————————————————————————————————————
interface FileItem {
  name: string
  type: string
  data: string // base64
}

export async function POST(req: NextRequest) {
  const { messages, files } = await req.json() as {
    messages: Array<{ role: string; content: string }>
    files?: FileItem[]
  }

  const systemPrompt = `Eres el asistente de AutoCredit Pro, un sistema de gestión de crédito automotriz.

Cuando el usuario adjunte documentos (INE, constancia de situación fiscal SAT, comprobante de domicilio, PDF con información del cliente):
1. Lee TODOS los documentos cuidadosamente y extrae cada dato visible del cliente
2. Llama a registrar_cliente inmediatamente con todos los datos extraídos sin pedir confirmación
3. Confirma al usuario qué datos se registraron e indica si faltó algún campo importante (RFC, teléfono, etc.)
4. Si hay datos del vehículo o banco, también crea la solicitud automáticamente

Datos a extraer según el documento:
- INE / IFE: nombre completo, CURP, domicilio, fecha de nacimiento, clave de elector
- Constancia SAT: RFC, nombre fiscal, domicilio fiscal, CP, ciudad, estado, régimen
- Comprobante de domicilio: calle, colonia, CP, ciudad, estado
- Cualquier PDF con datos personales: extrae todo lo que encuentres

Campos de fecha de nacimiento: usar formato YYYY-MM-DD.
Precios en pesos: interpretar "$485,000" como 485000.
Los bancos disponibles son: Scotiabank, BBVA y Banorte.

Si el usuario solo dice instrucciones en texto sin documentos, ejecuta la acción directamente.
Responde siempre en español de manera concisa y confirma las acciones realizadas.`

  try {
    // Construir mensajes para Claude
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const msgs: any[] = messages.map((m, i) => {
      const isLastUser = i === messages.length - 1 && m.role === 'user' && files && files.length > 0

      if (isLastUser) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const content: any[] = []

        for (const file of files!) {
          if (file.type.startsWith('image/')) {
            const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
            content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: file.data } })
          } else if (file.type === 'application/pdf') {
            content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } })
          }
        }

        if (m.content.trim()) {
          content.push({ type: 'text', text: m.content })
        } else {
          content.push({ type: 'text', text: 'Analiza estos documentos, extrae todos los datos del cliente y regístralo en el sistema.' })
        }

        return { role: 'user', content }
      }

      return { role: m.role as 'user' | 'assistant', content: m.content }
    })

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: msgs,
    })

    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>)
        toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: JSON.stringify(result) })
      }

      msgs.push({ role: 'assistant', content: response.content })
      msgs.push({ role: 'user', content: toolResults })

      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages: msgs,
      })
    }

    const textBlock = response.content.find(b => b.type === 'text') as Anthropic.TextBlock | undefined
    return NextResponse.json({ reply: textBlock?.text || 'Listo.' })
  } catch (error) {
    console.error('Agent error:', error)
    return NextResponse.json({ error: 'Error del agente' }, { status: 500 })
  }
}
