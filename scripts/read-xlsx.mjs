import * as XLSX from 'xlsx'
import { readFileSync } from 'fs'

const file = process.argv[2]
const buf = readFileSync(file)
const wb = XLSX.read(buf, { type: 'buffer', codepage: 65001 }) // UTF-8
console.log('Sheets:', wb.SheetNames)
const ws = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false })
console.log('Total linhas:', rows.length)
console.log('Colunas:', rows.length ? Object.keys(rows[0]) : '(vazio)')
console.log('--- primeiras 5 linhas ---')
console.log(JSON.stringify(rows.slice(0, 5), null, 2))
