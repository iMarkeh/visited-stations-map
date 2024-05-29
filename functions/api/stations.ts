import * as csv from 'csv/browser/esm'
import { finished } from 'node:stream/promises'

interface Env {}

const sheetId = '1j9dHSaZhHySudcjJ9469qMc70HgbTgn0-o_BVUHlCg8'
const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

async function getSheetContents() {
  const response = await fetch(sheetUrl)
  const body = await response.text()
  return processData(body)
}

const nameRenderer = new Intl.DisplayNames(['en'], { type: 'region' })

async function processData(data: string) {
  const records = []
  const parser = csv.parse(data, { columns: true })
  parser.on('readable', function () {
    let record
    while ((record = parser.read()) !== null) {
      try {
        record.countryName = nameRenderer.of(record.countryCode)
      } catch (e: any) {
        record.countryName = `Unknown (${record.countryCode})`
      }

      if (record.visitedDate == '') record.visitedDate = null

      records.push(record)
    }
  })
  await finished(parser)
  return records
}

export const onRequest: PagesFunction<Env> = async ctx => {
  const sheetData = await getSheetContents()

  return Response.json({ stations: sheetData })
}
