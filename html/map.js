const map = new maplibregl.Map({
  container: 'map',
  style: '/map-styles/osm-bright-style.json',
  center: [4.39097, 54.64657],
  zoom: 12,
  maxZoom: 18,
  minZoom: 3,
  dragRotate: false,
  boxZoom: false,
  attributionControl: false,
}).addControl(
  new maplibregl.AttributionControl({
    customAttribution: [
      `<a href="https://github.com/davwheat/visited-stations-map">View source code</a>`,
      `Inspired by <a href="https://github.com/t5r7/station-mapper">t5r7's station mapper</a>`,
      `<a target="_blank" href="https://docs.google.com/spreadsheets/d/1ZRBE-9i4_WmMmO5h1pIMwrF1owW95Qc-ElLcmf0ct3g/edit">Data source</a>`,
      '© OpenStreetMap contributors',
    ],
  }),
)

// When styles loaded
map.on('load', () => {
  map.getContainer().classList.add('loaded')
})

const groups = []
const markers = []

/**
 * @typedef {Object} Station
 * @property {number} lat
 * @property {number} lon
 * @property {string} stationName
 * @property {string} stationNameEnglish
 * @property {string} stationCode
 * @property {string | null} visitedDate
 * @property {string} brand
 * @property {string} countryCode
 * @property {string} countryName
 * @property {string} type
 */

/**
 * @returns {Promise<Station[]>}
 */
async function getData() {
  try {
    const response = await fetch('/api/stations')
    const data = await response.json()

    const stations = data.stations

    if (Array.isArray(stations)) {
      return stations
    }
  } catch (error) {
    console.error(error)
    alert('Failed to load stations data. Please refresh the page, or try again later.')
    throw error
  }
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const bounds = new maplibregl.LngLatBounds()

document.addEventListener('DOMContentLoaded', async () => {
  const stations = await getData()

  stations.forEach(stn => {
    const nativeName = stn.stationName
    const englishName = stn.stationNameEnglish || null

    // https://stackoverflow.com/a/37511463
    const normalisedBrand = stn.brand
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
    const countryCodeEnc = encodeURIComponent(stn.countryCode.toLowerCase())
    const cleanMode = stn.type.toLowerCase().replace(/[^a-z]/g, '-')
    const brandBg =
      cleanMode === 'heritage-railway'
        ? `url('/brands/steam-train.svg')`
        : `url('/brands/${countryCodeEnc}/${encodeURIComponent(normalisedBrand)}.svg'), url('/brands/${countryCodeEnc}/${encodeURIComponent(normalisedBrand)}.png')`

    const el = document.createElement('div')
    const iconEl = document.createElement('div')
    el.appendChild(iconEl)
    el.className = 'station-marker'
    iconEl.className = 'station-icon'
    iconEl.style.backgroundImage = brandBg
    iconEl.setAttribute('data-mode-type', cleanMode)

    el.setAttribute('data-brand', normalisedBrand)

    const popup = new maplibregl.Popup({
      offset: 25,
    }).setHTML(
      `
<h2 class="name">${nativeName}${stn.stationCode ? ` <span class="code">[${stn.stationCode}]</span>` : ''}</h2>
${englishName ? `<p class="name-en">${stn.stationNameEnglish}</p>` : ''}
<p class="country"><img class="country-flag" src="/flags/${countryCodeEnc}.svg"> ${stn.countryName}</p>

<p class="brand"> <span class="brand-icon" style="background-image: ${brandBg}"></span> ${stn.brand}</p>

<p data-mode-type="${cleanMode}" class="type">${stn.type}</p>

${stn.visitedDate ? `<p class="visited">First visited ${dateFormatter.format(new Date(stn.visitedDate))}</p>` : ''}
      `,
    )

    new maplibregl.Marker({
      element: el,
    })
      .setLngLat([stn.lon, stn.lat])
      .setPopup(popup)
      .addTo(map)

    // Update bounds
    bounds.extend([stn.lon, stn.lat])
  })

  let coordPopup = null

  map.on('contextmenu', function (e) {
    var coordinates = e.lngLat

    if (coordPopup !== null) {
      coordPopup.remove()
    }

    coordPopup = new maplibregl.Popup()
      .setLngLat(coordinates)
      .setHTML(`<p style="margin:0">${coordinates.lat.toFixed(5)},${coordinates.lng.toFixed(5)}</p>`)
      .addTo(map)
  })

  // Fit map to bounds
  map.fitBounds(bounds, {
    padding: 50,
    speed: 1.2,
  })

  const overlay = document.getElementById('overlay')

  // Remove from DOM when fade out is complete
  overlay.addEventListener('transitionend', () => {
    overlay.remove()
  })

  overlay.classList.add('hidden')
  overlay.style.pointerEvents = 'none'
})
