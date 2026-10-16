import { useEffect, useState } from 'react'
import { getPokemonEntryDetails } from '../lib/pokeapi.js'
import { pokemonTypes } from '../lib/types.js'
import BaseStats from './BaseStats.jsx'

const typeLabels = Object.fromEntries(pokemonTypes.map(({ id, label }) => [id, label]))

const categoryLabels = {
  regional: 'Forma regionale',
  mega: 'Mega Evoluzione',
  gmax: 'Gigamax',
  other: 'Forma alternativa',
}

const suffixLabels = {
  mega: 'Mega', gmax: 'Gigamax', alola: 'Alola', galar: 'Galar',
  hisui: 'Hisui', paldea: 'Paldea', x: 'X', y: 'Y',
}

function titleCase(value) {
  return value.split('-').map((word) =>
    suffixLabels[word] || word.charAt(0).toUpperCase() + word.slice(1),
  ).join(' ')
}

function displayName(entry) {
  const species = titleCase(entry.speciesName)
  const suffix = entry.name.slice(entry.speciesName.length).replace(/^-/, '')
  return suffix ? species + ' · ' + titleCase(suffix) : species
}

export default function PokemonDetail({ pokemon }) {
  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    getPokemonEntryDetails(pokemon)
      .then((data) => {
        if (active) setDetails(data)
      })
      .catch(() => {
        if (active) setError('Non riesco a caricare i dati di questo Pokémon da PokéAPI.')
      })

    return () => { active = false }
  }, [pokemon])

  const title = displayName(pokemon)
  const types = details?.types?.map(({ type }) => type.name) || []
  const primaryType = types[0] || 'neutral'
  const sprites = details?.sprites || {}
  const image = pokemon.source === 'form'
    ? sprites.front_default
    : sprites.other?.['official-artwork']?.front_default || sprites.front_default

  return (
    <section className="pokemon-detail" aria-label={'Dettaglio di ' + title}>
      <a className="pokemon-detail-back" href="#/pokemon">← Torna al Pokédex</a>

      <div className="pokemon-detail-heading">
        <span className="eyebrow">SCHEDA POKÉMON</span>
        <h1>{title}</h1>
        <div className="pokemon-detail-meta">
          <span>Numero nazionale #{String(pokemon.speciesId).padStart(4, '0')}</span>
          {pokemon.regionalNumber != null && (
            <span>Numero regionale #{String(pokemon.regionalNumber).padStart(3, '0')}</span>
          )}
          {pokemon.category !== 'base' && <span>{categoryLabels[pokemon.category]}</span>}
        </div>
      </div>

      {error ? (
        <div className="catalog-feedback" role="alert">{error}</div>
      ) : !details ? (
        <div className="catalog-feedback" role="status">Caricamento dettagli da PokéAPI…</div>
      ) : (
        <div className="pokemon-detail-layout">
          <div className={'pokemon-detail-artwork pokemon-' + primaryType}>
            {image ? <img src={image} alt={'Immagine di ' + title} /> : (
              <p>Immagine non disponibile per questa forma.</p>
            )}
          </div>
          <div className="pokemon-detail-info">
            <h2>Informazioni generali</h2>
            <div className="type-list" aria-label="Tipi Pokémon">
              {types.map((type) => (
                <span key={type} className={'type-chip type-' + type}>
                  {typeLabels[type] || type}
                </span>
              ))}
            </div>

            {pokemon.source !== 'form' && (
              <dl className="pokemon-detail-measures">
                {Number.isFinite(details.height) && (
                  <div><dt>Altezza</dt><dd>{(details.height / 10).toLocaleString('it-IT')} m</dd></div>
                )}
                {Number.isFinite(details.weight) && (
                  <div><dt>Peso</dt><dd>{(details.weight / 10).toLocaleString('it-IT')} kg</dd></div>
                )}
              </dl>
            )}

            <div className="pokemon-detail-stats">
              <BaseStats stats={details.stats} loading={false} />
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
