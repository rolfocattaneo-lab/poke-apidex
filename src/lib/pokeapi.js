const API_BASE = 'https://pokeapi.co/api/v2'
const CATALOG_CACHE_KEY = 'poke-apidex-catalog-v2'
const CACHE_DURATION = 24 * 60 * 60 * 1000

const detailsCache = new Map()
const formCache = new Map()

function getResourceId(url) {
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}

async function getResourceList(resource, signal) {
  const response = await fetch(`${API_BASE}/${resource}/?limit=20000`, { signal })
  if (!response.ok) throw new Error('Non riesco a scaricare le forme Pokémon da PokéAPI.')
  return (await response.json()).results
}

// Una variante ha il numero nazionale della specie, non il proprio ID interno PokéAPI.
// Esempio: charizard-mega-x -> charizard -> #0006.
function findSpecies(name, speciesByName) {
  let candidate = name

  while (candidate) {
    if (speciesByName.has(candidate)) return speciesByName.get(candidate)
    const index = candidate.lastIndexOf('-')
    if (index === -1) return null
    candidate = candidate.slice(0, index)
  }
  return null
}

function getFormCategory(name, isPrimary, source) {
  if (isPrimary && source === 'pokemon') return 'base'
  if (/(^|-)mega(-|$)/.test(name)) return 'mega'
  if (/(^|-)gmax(-|$)/.test(name)) return 'gmax'
  if (/(^|-)(alola|galar|hisui|paldea)(-|$)/.test(name)) return 'regional'
  return 'other'
}

function assembleCatalog(pokemonResources, speciesResources, formResources) {
  const speciesByName = new Map(
    speciesResources
      .map(({ name, url }) => [name, getResourceId(url)])
      .filter(([, id]) => Number.isInteger(id)),
  )
  const pokemonNames = new Set(pokemonResources.map(({ name }) => name))
  const entries = []

  for (const { name, url } of pokemonResources) {
    const pokemonId = getResourceId(url)
    const speciesId = findSpecies(name, speciesByName)
    if (!pokemonId || !speciesId) continue

    const isPrimary = pokemonId < 10000
    entries.push({
      key: `pokemon:${pokemonId}`,
      id: pokemonId,
      speciesId,
      speciesName: findSpeciesName(name, speciesByName),
      name,
      source: 'pokemon',
      category: getFormCategory(name, isPrimary, 'pokemon'),
    })
  }

  // pokemon-form include anche varianti solo estetiche, senza statistiche autonome.
  // Se una forma esiste già come risorsa pokemon, evitiamo di mostrarla due volte.
  for (const { name, url } of formResources) {
    if (pokemonNames.has(name)) continue

    const formId = getResourceId(url)
    const speciesId = findSpecies(name, speciesByName)
    if (!formId || !speciesId) continue

    entries.push({
      key: `form:${formId}`,
      id: formId,
      speciesId,
      speciesName: findSpeciesName(name, speciesByName),
      name,
      source: 'form',
      category: getFormCategory(name, false, 'form'),
    })
  }

  const categoryOrder = { base: 0, regional: 1, mega: 2, gmax: 3, other: 4 }
  return entries.sort((a, b) =>
    a.speciesId - b.speciesId
    || categoryOrder[a.category] - categoryOrder[b.category]
    || a.name.localeCompare(b.name),
  )
}

function findSpeciesName(name, speciesByName) {
  let candidate = name

  while (candidate) {
    if (speciesByName.has(candidate)) return candidate
    const index = candidate.lastIndexOf('-')
    if (index === -1) return name
    candidate = candidate.slice(0, index)
  }
  return name
}

function readCatalogCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null')
    if (cached && cached.storedAt > Date.now() - CACHE_DURATION && Array.isArray(cached.entries)) {
      return cached.entries
    }
  } catch {
    // La navigazione funziona anche se lo storage del browser è disabilitato.
  }
  return null
}

function writeCatalogCache(entries) {
  try {
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ storedAt: Date.now(), entries }))
  } catch {
    // Un eventuale limite dello storage non deve bloccare il catalogo.
  }
}

export async function getNationalCatalog(signal) {
  const cached = readCatalogCache()
  if (cached) return cached

  const [pokemon, species, forms] = await Promise.all([
    getResourceList('pokemon', signal),
    getResourceList('pokemon-species', signal),
    getResourceList('pokemon-form', signal),
  ])

  const entries = assembleCatalog(pokemon, species, forms)
  writeCatalogCache(entries)
  return entries
}

function getCachedDetails(cache, resource, id) {
  if (!cache.has(id)) {
    const request = fetch(`${API_BASE}/${resource}/${id}/`)
      .then((response) => {
        if (!response.ok) throw new Error(`Dati non disponibili per ${resource} #${id}.`)
        return response.json()
      })
      .catch((error) => {
        cache.delete(id)
        throw error
      })
    cache.set(id, request)
  }
  return cache.get(id)
}

export function getPokemonDetails(id) {
  return getCachedDetails(detailsCache, 'pokemon', id)
}

export function getPokemonEntryDetails(entry) {
  if (entry.source !== 'form') return getPokemonDetails(entry.id)

  return getCachedDetails(formCache, 'pokemon-form', entry.id)
    .then(async (form) => {
      // Le varianti soltanto estetiche non hanno statistiche autonome:
      // ricaviamo i valori base dal Pokémon collegato, senza alterarne gli sprite.
      const pokemonId = getResourceId(form.pokemon?.url || '')
      if (!pokemonId) return form
      const parent = await getPokemonDetails(pokemonId)
      return {
        ...form,
        types: form.types?.length ? form.types : parent.types,
        stats: parent.stats,
      }
    })
}
