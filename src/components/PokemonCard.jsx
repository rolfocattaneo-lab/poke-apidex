import { useEffect, useState } from 'react'
import { getPokemonDetails } from '../lib/pokeapi.js'

const typeNames = {
  normal: 'Normale', fighting: 'Lotta', flying: 'Volante', poison: 'Veleno',
  ground: 'Terra', rock: 'Roccia', bug: 'Coleottero', ghost: 'Spettro',
  steel: 'Acciaio', fire: 'Fuoco', water: 'Acqua', grass: 'Erba',
  electric: 'Elettro', psychic: 'Psico', ice: 'Ghiaccio', dragon: 'Drago',
  dark: 'Buio', fairy: 'Folletto',
}

function displayName(name) {
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export default function PokemonCard({ pokemon, list }) {
  const { id, name } = pokemon
  const [details, setDetails] = useState(null)

  useEffect(() => {
    let active = true

    getPokemonDetails(id)
      .then((data) => { if (active) setDetails(data) })
      .catch(() => { /* Il catalogo resta consultabile anche se un dettaglio non si carica. */ })

    return () => { active = false }
  }, [id])

  const types = details?.types?.map(({ type }) => type.name) || []
  const primaryType = types[0] || 'neutral'
  const artwork = details?.sprites?.other?.['official-artwork']?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
  const fallback = details?.sprites?.front_default
    || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`

  return (
    <article className={'pokemon-card pokemon-' + primaryType + (list ? ' pokemon-card-list' : '')}>
      <div className="pokemon-card-image">
        <img
          src={artwork}
          alt={'Artwork di ' + displayName(name)}
          loading="lazy"
          onError={(event) => {
            if (event.currentTarget.src !== fallback) {
              event.currentTarget.src = fallback
            } else {
              event.currentTarget.style.visibility = 'hidden'
            }
          }}
        />
      </div>
      <div className="pokemon-card-body">
        <span className="pokemon-number">#{String(id).padStart(4, '0')}</span>
        <h3>{displayName(name)}</h3>
        <div className="type-list">
          {types.length === 0 ? (
            <span className="types-loading">Tipi in caricamento…</span>
          ) : types.map((type) => (
            <span key={type} className={'type-chip type-' + type}>
              {typeNames[type] || type}
            </span>
          ))}
        </div>
      </div>
    </article>
  )
}
