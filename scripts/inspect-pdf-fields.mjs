import { PDFDocument } from 'pdf-lib'
import { readFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function inspectFields(pdfPath, name) {
  const bytes = readFileSync(pdfPath)
  const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true })
  const form = pdfDoc.getForm()
  const fields = form.getFields()

  console.log(`\n${'='.repeat(60)}`)
  console.log(`📄 ${name} — ${fields.length} campos`)
  console.log('='.repeat(60))

  fields.forEach(field => {
    const type = field.constructor.name
    const name = field.getName()
    let value = ''
    try {
      if (type === 'PDFTextField') value = field.getText() || ''
      if (type === 'PDFCheckBox') value = field.isChecked() ? '✓' : '○'
      if (type === 'PDFDropdown') value = field.getSelected()?.join(', ') || ''
      if (type === 'PDFRadioGroup') value = field.getSelected() || ''
    } catch {}
    console.log(`  [${type.replace('PDF', '')}] "${name}" = "${value}"`)
  })
}

const base = join(__dirname, '..', 'public', 'templates')

await inspectFields(join(base, 'BANORTE.pdf'), 'BANORTE')
await inspectFields(join(base, 'BBVA.pdf'), 'BBVA')
await inspectFields(join(base, 'SCOTIABANK.pdf'), 'SCOTIABANK')
