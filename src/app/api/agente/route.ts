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
        telefono: { type: 'string', description: 'Teléfono de contacto' },
        email: { type: 'string', description: 'Correo electrónico' },
        curp: { type: 'string', description: 'CURP' },
        rfc: { type: 'string', description: 'RFC' },
        ciudad: { type: 'string', description: 'Ciudad de residencia' },
        estado: { type: 'string', description: 'Estado de residencia' },
        ingreso_mensual: { type: 'number', description: 'Ingreso mensual en pesos' },
        empresa: { type: 'string', description: 'Empresa donde trabaja' },
        ocupacion: { type: 'string', description: 'Ocupación o puesto' },
        tipo_empleado: { type: 'string', description: 'Tipo: asalariado, independiente, empresario' },
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
        precio_venta: { type: 'number', description: 'Precio de venta acordado (puede diferir del precio de lista)' },
        notas: { type: 'string', description: 'Observaciones adicionales para la solicitud' },
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
          description: 'Nueva estatus: nueva, preparando, enviada, en_revision, aprobada, rechazada, fondeada, cancelada',
        },
        nota: { type: 'string', description: 'Nota sobre el cambio de estatus' },
      },
      required: ['solicitud_id', 'nuevo_estatus'],
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

  if (name === 'crear_solicitud') {
    // Buscar banco
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
    if (!banco) return { error: `Banco no encontrado: ${input.banco_nombre}. Los bancos disponibles son: Scotiabank, BBVA, Banorte` }

    // Obtener precio de la unidad si no se especificó
    let precioVenta = Number(input.precio_venta) || 0
    if (!precioVenta) {
      const { data: unidad } = await supabase.from('unidades').select('precio').eq('id', input.unidad_id).single()
      precioVenta = unidad?.precio || 0
    }

    const { data, error } = await supabase
      .from('solicitudes')
      .insert({
        folio: '', // trigger lo genera
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
    // Buscar por ID o folio
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

    // General
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
    return {
      clientes_activos: cl,
      unidades_disponibles: disponibles,
      solicitudes_activas: activas,
      monto_total_cartera: montoTotal,
    }
  }

  return { error: 'Herramienta no reconocida' }
}

// ——————————————————————————————————————————
// POST Handler
// ——————————————————————————————————————————
export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  const systemPrompt = `Eres el asistente de AutoCredit Pro, un sistema de gestión de crédito automotriz.
Puedes ayudar a:
- Registrar nuevos clientes y vehículos (unidades)
- Crear y gestionar solicitudes de crédito
- Consultar información del sistema
- Actualizar el estado de las solicitudes

Los bancos disponibles son: Scotiabank, BBVA y Banorte.

Cuando el usuario te dé instrucciones como "registra un cliente llamado X" o "hay una unidad nueva Ford Lobo con precio $795,000", usa las herramientas para ejecutar esas acciones directamente en el sistema.

Cuando se mencionen precios en pesos mexicanos (ej: "$485,000 pesos"), interprétalos como números sin comas ni signos (485000).

Si no tienes suficiente información para ejecutar una acción, pregunta solo lo estrictamente necesario.

Responde siempre en español de manera concisa y confirma las acciones realizadas.`

  try {
    // Agentic loop con tool use
    const msgs: Anthropic.MessageParam[] = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages: msgs,
    })

    // Loop hasta que no haya más tool_use
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(b => b.type === 'tool_use') as Anthropic.ToolUseBlock[]
      const toolResults: Anthropic.ToolResultBlockParam[] = []

      for (const toolUse of toolUseBlocks) {
        const result = await executeTool(toolUse.name, toolUse.input as Record<string, unknown>)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        })
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
