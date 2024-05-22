let subdivisions = {}

async function prepareSubdivisions() {
  const csv = await fetch('IP2LOCATION-ISO3166-2.CSV')
  const text = await csv.text()

  for (const line of text.split('\n')) {
    const cols = line.split(',')

    // "country_code","subdivision_name","code"

    if (!cols[0] || !cols[1] || !cols[2]) continue

    const countryCode = cols[0].replace(/"/g, '')
    const subdivision = cols[1].replace(/"/g, '')
    const subdivisionCode = cols[2].replace(/[^A-Za-z0-9-]/g, '')

    if (!subdivisionCode) continue

    subdivisions[subdivisionCode.toLowerCase()] = [countryCode, subdivision]
  }
}

function getSub(code) {
  const emptyResponse = {
    found: false,
    country: '',
    subdivision: '',
    subdivisionCode: '',
    flagURL: '',
  }

  if (!code) return emptyResponse

  code = code.toLowerCase()
  let flagURL = undefined

  // some hardcoded special cases
  switch (code) {
    case 'gb-sco':
      code = 'gb-sct'
      flagURL = 'flags/gb-sct.svg'
      break
    case 'gb-cym':
      code = 'gb-wls'
      flagURL = 'flags/gb-wls.svg'
      break
    case 'gb-nir':
      code = 'gb-nir'
      flagURL = 'flags/gb-nir.svg'
      break
    case 'gb-eng':
      code = 'gb-eng'
      flagURL = 'flags/gb-eng.svg'
      break
  }

  if (subdivisions[code]) {
    if (!flagURL) flagURL = `flags/${subdivisions[code][0].toLowerCase()}.svg`

    return {
      found: true,
      country: subdivisions[code][0],
      subdivision: subdivisions[code][1],
      subdivisionCode: code,
      flagURL: flagURL,
    }
  } else {
    return emptyResponse
  }
}
