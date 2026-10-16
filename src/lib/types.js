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

// La risorsa /type contiene sia i Pokémon del filtro sia le relazioni
// offensive/difensive. Condividiamo la stessa richiesta e la stessa cache.
function getTypeData(typeName) {
  if (!cachedTypeRequests.has(typeName)) {
    const request = fetch(`${API_BASE}/type/${typeName}/`)
      .then((response) => {
        if (!response.ok) throw new Error('Impossibile caricare il tipo da PokéAPI.')
        return response.json()
      })
      .catch((error) => {
        cachedTypeRequests.delete(typeName)
        throw error
      })

    cachedTypeRequests.set(typeName, request)
  }
  return cachedTypeRequests.get(typeName)
}

function getIdsForType(typeName) {
  return getTypeData(typeName).then((data) => new Set(
    data.pokemon
      .map(({ pokemon }) => {
        const match = pokemon.url.match(/\/pokemon\/(\d+)\/?$/)
        return match ? Number(match[1]) : null
      })
      .filter(Number.isInteger),
  ))
}

// damage_relations.double_damage_from, half_damage_from e no_damage_from
// descrivono i danni subiti da un Pokémon del tipo richiesto.
export function getTypeDamageRelations(typeName) {
  return getTypeData(typeName).then((data) => {
    const relations = data.damage_relations
    if (!relations
      || !Array.isArray(relations.double_damage_from)
      || !Array.isArray(relations.half_damage_from)
      || !Array.isArray(relations.no_damage_from)) {
      throw new Error('Relazioni difensive incomplete in PokéAPI.')
    }
    return relations
  })
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
