const API_BASE = 'https://pokeapi.co/api/v2'
const cachedTypeRequests = new Map()

// L'ordine segue quello comunemente usato nei Pokédex, con nomi in italiano.
export const pokemonTypes = [
  { id: 'normal', label: 'Normale' },
  { id: 'fire', label: 'Fuoco' },
  { id: 'water', label: 'Acqua' },
  { id: 'electric', label: 'Elettro' },
  { id: 'grass', label: 'Erba' },
  { id: 'ice', label: 'Ghiaccio' },
  { id: 'fighting', label: 'Lotta' },
  { id: 'poison', label: 'Veleno' },
  { id: 'ground', label: 'Terra' },
  { id: 'flying', label: 'Volante' },
  { id: 'psychic', label: 'Psico' },
  { id: 'bug', label: 'Coleottero' },
  { id: 'rock', label: 'Roccia' },
  { id: 'ghost', label: 'Spettro' },
  { id: 'dragon', label: 'Drago' },
  { id: 'dark', label: 'Buio' },
  { id: 'steel', label: 'Acciaio' },
  { id: 'fairy', label: 'Folletto' },
]

function getIdsForType(typeName) {
  if (!cachedTypeRequests.has(typeName)) {
    const request = fetch(`${API_BASE}/type/${typeName}/`)
      .then((response) => {
        if (!response.ok) throw new Error('Impossibile caricare il filtro per tipo da PokéAPI.')
        return response.json()
      })
      .then((data) => new Set(
        data.pokemon
          .map(({ pokemon }) => {
            const match = pokemon.url.match(/\/pokemon\/(\d+)\/?$/)
            return match ? Number(match[1]) : null
          })
          .filter(Number.isInteger),
      ))
      .catch((error) => {
        cachedTypeRequests.delete(typeName)
        throw error
      })

    cachedTypeRequests.set(typeName, request)
  }

  return cachedTypeRequests.get(typeName)
}

// Un tipo: corrispondenza per quel tipo.
// Due tipi: intersezione (AND). Un Pokémon deve possederli entrambi.
// Gli ID delle varianti con statistiche e tipi propri restano distinti.
export async function getPokemonIdsByTypes(selectedTypes) {
  if (selectedTypes.length === 0) return new Set()

  const lists = await Promise.all(selectedTypes.map(getIdsForType))
  return new Set([...lists[0]].filter((pokemonId) =>
    lists.every((ids) => ids.has(pokemonId)),
  ))
}
