const API_BASE = 'https://pokeapi.co/api/v2'
const detailsCache = new Map()

// Gli ID sotto 10000 sono le voci principali del Pokédex nazionale.
// Le varianti con ID separati saranno indicizzate nella fase dedicata alle forme.
export async function getNationalCatalog(signal) {
  const response = await fetch(`${API_BASE}/pokemon?limit=10000`, { signal })
  if (!response.ok) throw new Error('Impossibile recuperare il catalogo Pokémon.')

  const payload = await response.json()
  return payload.results
    .map(({ name, url }) => {
      const match = url.match(/\/pokemon\/(\d+)\/?$/)
      return match ? { id: Number(match[1]), name } : null
    })
    .filter((entry) => entry && entry.id < 10000)
    .sort((a, b) => a.id - b.id)
}

export function getPokemonDetails(id) {
  if (!detailsCache.has(id)) {
    const request = fetch(`${API_BASE}/pokemon/${id}/`)
      .then((response) => {
        if (!response.ok) throw new Error(`Pokémon ${id} non disponibile.`)
        return response.json()
      })
      .catch((error) => {
        detailsCache.delete(id)
        throw error
      })
    detailsCache.set(id, request)
  }

  return detailsCache.get(id)
}
