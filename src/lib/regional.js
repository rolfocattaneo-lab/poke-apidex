const API_BASE = 'https://pokeapi.co/api/v2'

// Memorizziamo le risposte per non ripetere richieste alle stesse risorse.
// Il catalogo nazionale usa già una cache locale separata.
const requests = new Map()

function fetchResource(resource) {
  if (!requests.has(resource)) {
    const promise = fetch(`${API_BASE}/${resource}/`)
      .then((response) => {
        if (!response.ok) throw new Error('Impossibile recuperare i dati regionali da PokéAPI.')
        return response.json()
      })
      .catch((error) => {
        requests.delete(resource)
        throw error
      })
    requests.set(resource, promise)
  }
  return requests.get(resource)
}

function resourceId(url) {
  const match = url?.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}

const regionTranslations = {
  kanto: 'Kanto', johto: 'Johto', hoenn: 'Hoenn', sinnoh: 'Sinnoh',
  unova: 'Unima', kalos: 'Kalos', alola: 'Alola', galar: 'Galar',
  hisui: 'Hisui', paldea: 'Paldea',
}

const gameTranslations = {
  red: 'Rosso', blue: 'Blu', yellow: 'Giallo',
  gold: 'Oro', silver: 'Argento', crystal: 'Cristallo',
  ruby: 'Rubino', sapphire: 'Zaffiro', emerald: 'Smeraldo',
  firered: 'Rosso Fuoco', leafgreen: 'Verde Foglia',
  diamond: 'Diamante', pearl: 'Perla', platinum: 'Platino',
  heartgold: 'Oro HeartGold', soulsilver: 'Argento SoulSilver',
  black: 'Nero', white: 'Bianco',
  'black-2': 'Nero 2', 'white-2': 'Bianco 2',
  x: 'X', y: 'Y',
  'omega-ruby': 'Rubino Omega', 'alpha-sapphire': 'Zaffiro Alpha',
  sun: 'Sole', moon: 'Luna',
  'ultra-sun': 'Ultrasole', 'ultra-moon': 'Ultraluna',
  'lets-go-pikachu': "Let's Go, Pikachu!",
  'lets-go-eevee': "Let's Go, Eevee!",
  sword: 'Spada', shield: 'Scudo',
  'brilliant-diamond': 'Diamante Lucente',
  'shining-pearl': 'Perla Splendente',
  'legends-arceus': 'Leggende Pokémon: Arceus',
  scarlet: 'Scarlatto', violet: 'Violetto',
}

const generationNames = {
  'generation-i': 'Generazione I',
  'generation-ii': 'Generazione II',
  'generation-iii': 'Generazione III',
  'generation-iv': 'Generazione IV',
  'generation-v': 'Generazione V',
  'generation-vi': 'Generazione VI',
  'generation-vii': 'Generazione VII',
  'generation-viii': 'Generazione VIII',
  'generation-ix': 'Generazione IX',
}

function humanize(name) {
  return name.replaceAll('-', ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function regionLabel(name) {
  return regionTranslations[name] || humanize(name)
}

export function generationLabel(name) {
  return generationNames[name] || humanize(name)
}

export function gameLabel(name) {
  return gameTranslations[name] || humanize(name)
}

export async function getRegions() {
  const response = await fetchResource('region?limit=100')
  return response.results
    .map(({ name, url }) => ({ name, id: resourceId(url) }))
    .filter(({ id }) => Number.isInteger(id))
    .sort((a, b) => a.id - b.id)
}

export async function getRegionGames(regionName) {
  const region = await fetchResource(`region/${regionName}`)
  const regionalPokedexNames = new Set(region.pokedexes.map(({ name }) => name))
  const groups = await Promise.all(region.version_groups.map(({ name }) => fetchResource(`version-group/${name}`)))

  // Il legame versione/Pokédex proviene direttamente da PokéAPI.
  // Alcuni giochi non hanno un Pokédex associato e quindi non vengono elencati.
  const games = groups.flatMap((group) => {
    const pokedexes = group.pokedexes
      .map(({ name }) => name)
      .filter((name) => regionalPokedexNames.has(name))
    if (pokedexes.length === 0) return []

    return group.versions.map(({ name }) => ({
      name,
      generation: group.generation.name,
      versionGroup: group.name,
      order: group.order,
      pokedexes,
    }))
  })

  return games.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))
}

export async function getRegionalPokedexEntries(pokedexNames) {
  const dexes = await Promise.all(pokedexNames.map((name) => fetchResource(`pokedex/${name}`)))
  const encounteredSpecies = new Set()
  const speciesEntries = []

  for (const dex of dexes) {
    const entries = [...dex.pokemon_entries].sort((a, b) => a.entry_number - b.entry_number)

    for (const entry of entries) {
      const speciesId = resourceId(entry.pokemon_species.url)
      if (!speciesId || encounteredSpecies.has(speciesId)) continue
      encounteredSpecies.add(speciesId)
      speciesEntries.push({
        speciesId,
        regionalNumber: entry.entry_number,
        pokedexName: dex.name,
      })
    }
  }

  return speciesEntries
}
