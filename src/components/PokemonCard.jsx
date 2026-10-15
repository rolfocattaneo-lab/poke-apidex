import { useEffect, useState } from 'react'
import { getPokemonEntryDetails } from '../lib/pokeapi.js'
import BaseStats from './BaseStats.jsx'

const typeNames = {
  normal: 'Normale', fighting: 'Lotta', flying: 'Volante', poison: 'Veleno',
  ground: 'Terra', rock: 'Roccia', bug: 'Coleottero', ghost: 'Spettro',
  steel: 'Acciaio', fire: 'Fuoco', water: 'Acqua', grass: 'Erba',
  electric: 'Elettro', psychic: 'Psico', ice: 'Ghiaccio', dragon: 'Drago',
  dark: 'Buio', fairy: 'Folletto',
}

const categoryNames = {
  regional: 'Forma regionale',
  mega: 'Mega Evoluzione',
  gmax: 'Gigamax',
  other: 'Forma alternativa',
}

const suffixNames = {
  mega: 'Mega', gmax: 'Gigamax', alola: 'Alola', galar: 'Galar',
  hisui: 'Hisui', paldea: 'Paldea', x: 'X', y: 'Y',
}

function titleCase(text) {
  return text.split('-').map((word) =>
    suffixNames[word] || (word.charAt(0).toUpperCase() + word.slice(1)),
  ).join(' ')
}

function getDisplayName(entry) {
  const species = titleCase(entry.speciesName)
  const suffix = entry.name.slice(entry.speciesName.length).replace(/^-/, '')
  return suffix ? `${species} · ${titleCase(suffix)}` : species
}

function getSpriteOptions(details, source) {
  if (!details) return []

  const sprites = details.sprites || {}
  const options = source === 'form'
    ? [sprites.front_default]
    : [sprites.other?.['official-artwork']?.front_default, sprites.front_default]

  if (source === 'form' && sprites.versions) {
    for (const generation of Object.values(sprites.versions)) {
      for (const version of Object.values(generation || {})) {
        options.push(version?.front_default)
      }
    }
  }

  return [...new Set(options.filter(Boolean))]
}

export default function PokemonCard({ pokemon, list }) {
  const [details, setDetails] = useState(null)
  const [error, setError] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    let active = true

    getPokemonEntryDetails(pokemon)
      .then((data) => { if (active) setDetails(data) })
      .catch(() => { if (active) setError(true) })

    return () => { active = false }
  }, [pokemon])

  const title = getDisplayName(pokemon)
  const types = details?.types?.map(({ type }) => type.name) || []
  const primaryType = types[0] || 'neutral'
  const images = getSpriteOptions(details, pokemon.source)
  const image = images[imageIndex]

  return (
    <article className={'pokemon-card pokemon-' + primaryType + (list ? ' pokemon-card-list' : '')}>
      <div className="pokemon-card-image">
        {image ? (
          <img
            src={image}
            alt={'Immagine della forma ' + title}
            loading="lazy"
            onError={() => setImageIndex((index) => index + 1)}
          />
        ) : (
          <span className="pokemon-no-image">{details || error ? 'Immagine non disponibile' : 'Caricamento immagine…'}</span>
        )}
      </div>
      <div className="pokemon-card-body">
        <div className="pokemon-card-meta">
          <span className="pokemon-number" title="Numero nazionale">N. #{String(pokemon.speciesId).padStart(4, '0')}</span>
          {pokemon.regionalNumber != null && (
            <span className="pokemon-regional-number" title={'Numero nel Pokédex ' + pokemon.pokedexName}>
              R. #{String(pokemon.regionalNumber).padStart(3, '0')}
            </span>
          )}
          {pokemon.category !== 'base' && (
            <span className={'form-badge form-badge-' + pokemon.category}>
              {categoryNames[pokemon.category]}
            </span>
          )}
        </div>
        <h3>{title}</h3>
        <div className="type-list">
          {types.length ? types.map((type) => (
            <span key={type} className={'type-chip type-' + type}>
              {typeNames[type] || type}
            </span>
          )) : (
            <span className="types-loading">{error ? 'Tipi non disponibili' : 'Tipi in caricamento…'}</span>
          )}
        </div>
      </div>
      <BaseStats stats={details?.stats} loading={!details && !error} />
    </article>
  )
}
