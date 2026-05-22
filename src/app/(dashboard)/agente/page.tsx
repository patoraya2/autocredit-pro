'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquareMore, Send, Loader2, Bot, User, Sparkles, RefreshCw, Paperclip, X, FileText, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FileItem {
  name: string
  type: string
  data: string // base64 sin prefijo
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  fileNames?: string[]
}

const EJEMPLOS = [
  'Adjunta los documentos del cliente (INE, constancia SAT) y escribe: "Registra a este cliente"',
  'Registra 2 unidades: Ford Bronco Sport 2021 valor $485,000 y Ford Lobo Platinum 4x4 2021 valor $795,000',
  'Dame un resumen general del sistema',
  'Crea solicitud para Scotiabank con el cliente Luis Avila y la Ford Lobo Platinum, enganche $100,000 a 48 meses',
  '¿Cuántas unidades disponibles tenemos?',
]

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AgentePage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const MAX_MB = 10
    const results: FileItem[] = []
    for (const file of selected) {
      if (file.size > MAX_MB * 1024 * 1024) {
        alert(`"${file.name}" supera ${MAX_MB}MB y no se adjuntó.`)
        continue
      }
      const data = await readFileAsBase64(file)
      results.push({ name: file.name, type: file.type, data })
    }
    setFiles(prev => [...prev, ...results])
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  async function sendMessage(text?: string) {
    const content = (text || input).trim()
    if ((!content && files.length === 0) || loading) return

    const displayText = content || (files.length > 0 ? 'Analiza estos documentos y registra al cliente.' : '')
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: displayText, fileNames: files.map(f => f.name) },
    ]
    setMessages(newMessages)
    setInput('')
    const filesToSend = [...files]
    setFiles([])
    setLoading(true)

    try {
      const res = await fetch('/api/agente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          files: filesToSend,
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply || data.error || 'Sin respuesta',
      }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Error al conectar con el agente. Verifica tu API key de Anthropic.',
      }])
    } finally {
      setLoading(false)
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600">
            <MessageSquareMore className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              Agente IA
              <span className="flex items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" /> Claude
              </span>
            </h1>
            <p className="text-slate-500 text-xs">Sube documentos del cliente para registrarlo automáticamente</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMessages([])} className="text-slate-500 gap-1.5 h-8">
            <RefreshCw className="w-3.5 h-3.5" /> Nueva conversación
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full space-y-6 text-center py-8">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
              <Bot className="w-10 h-10 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">¿En qué te ayudo hoy?</h2>
              <p className="text-slate-500 text-sm mt-1.5 max-w-sm">
                Adjunta el INE, constancia SAT o cualquier documento del cliente
                y lo registro automáticamente en el sistema.
              </p>
            </div>
            <div className="w-full max-w-xl space-y-2">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Ejemplos</p>
              <div className="grid gap-2">
                {EJEMPLOS.map((ej, i) => (
                  <button
                    key={i}
                    onClick={() => i === 0 ? fileInputRef.current?.click() : sendMessage(ej)}
                    className="text-left text-sm text-slate-600 bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-700 transition-all"
                  >
                    {i === 0 && <Paperclip className="w-3.5 h-3.5 inline mr-2 text-slate-400" />}
                    {ej}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-3 max-w-4xl', msg.role === 'user' ? 'ml-auto flex-row-reverse' : '')}>
                <div className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full shrink-0 mt-0.5',
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                )}>
                  {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={cn(
                  'px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[80%] space-y-2',
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-sm'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
                )}>
                  {msg.fileNames && msg.fileNames.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {msg.fileNames.map((name, j) => (
                        <span key={j} className="flex items-center gap-1 text-xs bg-blue-500/30 rounded-lg px-2 py-0.5">
                          {name.match(/\.(jpe?g|png|gif|webp)$/i)
                            ? <Image className="w-3 h-3" />
                            : <FileText className="w-3 h-3" />}
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.content.split('\n').map((line, j) => (
                    <p key={j} className={j > 0 ? 'mt-1' : ''}>{line}</p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 max-w-4xl">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-6 py-4 border-t border-slate-200 bg-white">
        {/* File chips */}
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-2.5 py-1">
                {f.type.startsWith('image/') ? <Image className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                <span className="max-w-[140px] truncate">{f.name}</span>
                <button onClick={() => removeFile(i)} className="hover:text-red-500 ml-0.5">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end max-w-4xl">
          {/* Paperclip */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 shrink-0 border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300"
            title="Adjuntar documentos (PDF, INE, constancia)"
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={files.length > 0 ? 'Instrucción opcional o presiona enviar...' : 'Escribe una instrucción o adjunta documentos del cliente...'}
            className="resize-none bg-slate-50 border-slate-200 focus:border-blue-400 min-h-[48px] max-h-32 text-sm"
            rows={1}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || (!input.trim() && files.length === 0)}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700 w-11 h-11 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          PDF, JPG, PNG • máx. 10 MB por archivo
        </p>
      </div>
    </div>
  )
}
