import { useEffect, useState } from 'react'
import {
  getPokemonEntryDetails,
  getPokemonSpeciesDetails,
  getAbilityDetails,
} from '../lib/pokeapi.js'
import { pokemonTypes } from '../lib/types.js'
import BaseStats from './BaseStats.jsx'
import EvolutionChain from './EvolutionChain.jsx'
import FormSelector from './FormSelector.jsx'

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

function getSpriteOptions(details, source, shiny) {
  if (!details) return []

  const sprites = details.sprites || {}
  const field = shiny ? 'front_shiny' : 'front_default'
  const options = source === 'form'
    ? [sprites[field]]
    : [sprites.other?.['official-artwork']?.[field], sprites[field]]

  // Alcune forme puramente estetiche hanno sprite solo negli archivi storici.
  if (source === 'form' && sprites.versions) {
    for (const generation of Object.values(sprites.versions)) {
      for (const version of Object.values(generation || {})) {
        options.push(version?.[field])
      }
    }
  }

  return [...new Set(options.filter(Boolean))]
}

function getItalianFlavor(species) {
  if (!species) return null
  const entries = species.flavor_text_entries || []
  return entries.filter((entry) => entry.language?.name === 'it').at(-1) || null
}

function cleanFlavorText(value) {
  return value.replace(/[\f\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function PokemonDetail({ pokemon, catalog }) {
  const [details, setDetails] = useState(null)
  const [error, setError] = useState('')
  const [species, setSpecies] = useState(null)
  const [speciesError, setSpeciesError] = useState(false)
  const [abilityNames, setAbilityNames] = useState({})
  const [shiny, setShiny] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)

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

  useEffect(() => {
    let active = true

    getPokemonSpeciesDetails(pokemon.speciesId)
      .then((data) => {
        if (active) setSpecies(data)
      })
      .catch(() => {
        if (active) setSpeciesError(true)
      })

    return () => { active = false }
  }, [pokemon.speciesId])

  useEffect(() => {
    if (!details?.abilities?.length) return undefined
    let active = true

    Promise.all(details.abilities.map(async ({ ability }) => {
      try {
        const data = await getAbilityDetails(ability.name)
        const italian = data.names?.find(({ language }) => language.name === 'it')
        return [ability.name, italian?.name || titleCase(ability.name)]
      } catch {
        return [ability.name, titleCase(ability.name)]
      }
    })).then((names) => {
      if (active) setAbilityNames(Object.fromEntries(names))
    })

    return () => { active = false }
  }, [details])

  const title = displayName(pokemon)
  const types = details?.types?.map(({ type }) => type.name) || []
  const primaryType = types[0] || 'neutral'
  const normalImages = getSpriteOptions(details, pokemon.source, false)
  const shinyImages = getSpriteOptions(details, pokemon.source, true)
  const imageOptions = shiny ? shinyImages : normalImages
  const image = imageOptions[imageIndex]
  const flavor = getItalianFlavor(species)
  const abilities = details?.abilities || []

  function chooseShiny(nextShiny) {
    setShiny(nextShiny)
    setImageIndex(0)
  }

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
        <>
          <div className="pokemon-detail-layout">
            <div className={'pokemon-detail-artwork pokemon-' + primaryType}>
              <div className="pokemon-detail-image-wrap">
                {image ? (
                  <img
                    key={image}
                    src={image}
                    alt={'Immagine ' + (shiny ? 'shiny' : 'normale') + ' di ' + title}
                    onError={() => setImageIndex((index) => index + 1)}
                  />
                ) : (
                  <p>Immagine {shiny ? 'shiny ' : ''}non disponibile per questa forma.</p>
                )}
              </div>
              <div className="pokemon-detail-image-controls">
                <FormSelector pokemon={pokemon} catalog={catalog} />
                <div className="pokemon-detail-variants" role="group" aria-label="Colorazione del Pokémon">
                <button
                  type="button"
                  className={!shiny ? 'selected' : ''}
                  aria-pressed={!shiny}
                  onClick={() => chooseShiny(false)}
                >
                  Normale
                </button>
                <button
                  type="button"
                  className={shiny ? 'selected' : ''}
                  aria-pressed={shiny}
                  disabled={shinyImages.length === 0}
                  title={shinyImages.length === 0 ? 'Sprite shiny non disponibile in PokéAPI' : undefined}
                  onClick={() => chooseShiny(true)}
                >
                  ✨ Shiny
                </button>
                </div>
              </div>
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

              <div className="pokemon-detail-abilities">
                <h3>Abilità</h3>
                {abilities.length > 0 ? (
                  <div className="pokemon-detail-ability-list">
                    {abilities.map(({ ability, is_hidden: hidden }) => (
                      <span className="pokemon-detail-ability" key={ability.name}>
                        <strong>{abilityNames[ability.name] || titleCase(ability.name)}</strong>
                        {hidden && <small>Nascosta</small>}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="pokemon-detail-unavailable">Abilità non disponibili per questa forma.</p>
                )}
              </div>

              <div className="pokemon-detail-stats">
                <BaseStats stats={details.stats} loading={false} />
              </div>
            </div>
          </div>

          <section className="pokemon-detail-description">
            <span className="eyebrow">POKÉDEX</span>
            <h2>Descrizione della specie</h2>
            {speciesError ? (
              <p className="pokemon-detail-unavailable">Impossibile caricare la descrizione da PokéAPI.</p>
            ) : !species ? (
              <p className="pokemon-detail-unavailable">Caricamento descrizione…</p>
            ) : flavor ? (
              <>
                <p>{cleanFlavorText(flavor.flavor_text)}</p>
                {flavor.version?.name && (
                  <small>Testo presente in PokéAPI per il gioco: {titleCase(flavor.version.name)}</small>
                )}
              </>
            ) : (
              <p className="pokemon-detail-unavailable">Descrizione in italiano non disponibile per questa specie.</p>
            )}
            {pokemon.category !== 'base' && (
              <p className="pokemon-detail-species-note">
                La descrizione si riferisce alla specie e non necessariamente a questa forma.
              </p>
            )}
          </section>

          <EvolutionChain
            species={species}
            speciesError={speciesError}
            currentSpeciesId={pokemon.speciesId}
            catalog={catalog}
          />
        </>
      )}
    </section>
  )
}
