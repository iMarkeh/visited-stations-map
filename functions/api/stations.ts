import * as csv from 'csv/browser/esm'
import { finished } from 'node:stream/promises'

interface Env {}

const sheetId = '1ZRBE-9i4_WmMmO5h1pIMwrF1owW95Qc-ElLcmf0ct3g'
const sheetUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`

async function getSheetContents() {
  const response = await fetch(sheetUrl)
  const body = await response.text()
  return processData(body)
}

interface StationRecord {
  'lat/lng': string
  stationName: string
  stationNameEnglish: string
  visitedDate: string
  countryCode: string
  stationCode: string
  brand: string
  type: string
}

interface OutputStationRecord {
  lat: number
  lng: number
  stationName: string
  stationNameEnglish: string
  visitedDate: string | null
  countryCode: string
  countryName: string
  stationCode: string
  brand: string
  type: string
  isFuture: boolean
}

const nameRenderer = new Intl.DisplayNames(['en'], { type: 'region' })

async function processData(data: string) {
  const records: OutputStationRecord[] = []
  const parser = csv.parse(data, { columns: true })
  parser.on('readable', function () {
    let record: StationRecord
    while ((record = parser.read()) !== null) {
      const coords = record['lat/lng'].split(',')
      const lat = parseFloat(coords[0].trim())
      const lng = parseFloat(coords[1].trim())

      let countryName: string
      try {
        // Split out country code from region code, if present
        countryName = nameRenderer.of(record.countryCode.split('-')[0])
      } catch (e: any) {
        countryName = `Unknown (${record.countryCode})`
      }

      const visitedDate = record.visitedDate == '' ? null : record.visitedDate

      records.push({
        lat,
        lng,
        countryName,
        visitedDate,
        brand: record.brand,
        countryCode: record.countryCode,
        stationCode: record.stationCode,
        stationName: record.stationName,
        stationNameEnglish: record.stationNameEnglish,
        type: record.type,
        isFuture: visitedDate != null && new Date(visitedDate) > new Date(),
      })
    }
  })
  await finished(parser)
  return records
}

export const onRequest: PagesFunction<Env> = async ctx => {
  const sheetData = await getSheetContents()

  return Response.json({ stations: sheetData })
}
