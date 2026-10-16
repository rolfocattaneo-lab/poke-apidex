import { useEffect, useMemo, useState } from 'react'
import { getPokemonEvolutionChain } from '../lib/pokeapi.js'
import { pokemonTypes } from '../lib/types.js'

const typeLabels = Object.fromEntries(pokemonTypes.map(({ id, label }) => [id, label]))

const itemNames = {
  'fire-stone': 'Pietrafocaia',
  'water-stone': 'Pietraidrica',
  'thunder-stone': 'Pietratuono',
  'leaf-stone': 'Pietrafoglia',
  'moon-stone': 'Pietralunare',
  'sun-stone': 'Pietrasolare',
  'shiny-stone': 'Pietrabrillo',
  'dusk-stone': 'Neropietra',
  'dawn-stone': 'Pietralbore',
  'ice-stone': 'Pietragelo',
  'oval-stone': 'Pietraovale',
  'kings-rock': 'Roccia di Re',
  'metal-coat': 'Metalcoperta',
  'dragon-scale': 'Squama Drago',
  'upgrade': 'Upgrade',
  'dubious-disc': 'Dubbiodisco',
  'protector': 'Copertura',
  'electirizer': 'Elettritore',
  'magmarizer': 'Magmatore',
  'reaper-cloth': 'Terrorpanno',
  'prism-scale': 'Squama Bella',
}

function titleCase(value = '') {
  return value.split('-').map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1),
  ).join(' ')
}

function resourceName(resource) {
  if (!resource?.name) return ''
  return itemNames[resource.name] || typeLabels[resource.name] || titleCase(resource.name)
}

function speciesIdFromUrl(url) {
  const match = (url || '').match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : null
}

function evolutionCondition(detail) {
  const conditions = []
  const trigger = detail.trigger?.name

  switch (trigger) {
    case 'level-up':
      conditions.push(detail.min_level ? 'Livello ' + detail.min_level : 'Salendo di livello')
      break
    case 'use-item':
      conditions.push(detail.item ? 'Usa ' + resourceName(detail.item) : 'Usa un oggetto')
      break
    case 'trade':
      conditions.push('Scambio')
      break
    case 'shed':
      conditions.push('Evoluzione speciale')
      break
    case 'spin':
      conditions.push('Girando su se stessi')
      break
    case 'tower-of-darkness':
      conditions.push('Torre delle Tenebre')
      break
    case 'tower-of-waters':
      conditions.push('Torre delle Acque')
      break
    case 'three-critical-hits':
      conditions.push('Tre brutti colpi in lotta')
      break
    case 'take-damage':
      conditions.push('Dopo aver subito danni')
      break
    case 'other':
      conditions.push('Metodo speciale')
      break
    default:
      if (trigger) conditions.push(titleCase(trigger))
  }

  if (detail.min_level && trigger !== 'level-up') conditions.push('Livello ' + detail.min_level)
  if (detail.min_happiness != null) conditions.push('Amicizia ≥ ' + detail.min_happiness)
  if (detail.min_affection != null) conditions.push('Affetto ≥ ' + detail.min_affection)
  if (detail.min_beauty != null) conditions.push('Bellezza ≥ ' + detail.min_beauty)
  if (detail.time_of_day === 'day') conditions.push('di giorno')
  else if (detail.time_of_day === 'night') conditions.push('di notte')
  else if (detail.time_of_day) conditions.push('orario: ' + detail.time_of_day)

  if (detail.held_item) conditions.push('tenendo ' + resourceName(detail.held_item))
  if (detail.known_move) conditions.push('con la mossa ' + resourceName(detail.known_move))
  if (detail.known_move_type) conditions.push('con una mossa ' + resourceName(detail.known_move_type))
  if (detail.location) conditions.push('a ' + resourceName(detail.location))
  if (detail.gender === 1) conditions.push('femmina')
  else if (detail.gender === 2) conditions.push('maschio')
  if (detail.needs_overworld_rain) conditions.push('con pioggia')
  if (detail.party_species) conditions.push('con ' + resourceName(detail.party_species) + ' in squadra')
  if (detail.party_type) conditions.push('con un Pokémon ' + resourceName(detail.party_type) + ' in squadra')
  if (detail.trade_species) conditions.push('scambiandolo con ' + resourceName(detail.trade_species))
  if (detail.turn_upside_down) conditions.push('con la console capovolta')
  if (detail.relative_physical_stats === 1) conditions.push('Attacco > Difesa')
  else if (detail.relative_physical_stats === -1) conditions.push('Attacco < Difesa')
  else if (detail.relative_physical_stats === 0) conditions.push('Attacco = Difesa')

  return conditions.length ? conditions.join(' · ') : 'Condizione non indicata'
}

function EvolutionSpecies({ species, currentSpeciesId, catalogBySpecies }) {
  const speciesId = speciesIdFromUrl(species.url)
  const entry = speciesId == null ? null : catalogBySpecies.get(speciesId)
  const official = speciesId == null ? null
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + speciesId + '.png'
  const sprite = speciesId == null ? null
    : 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/' + speciesId + '.png'
  const [image, setImage] = useState(official)
  const current = speciesId === currentSpeciesId
  const label = titleCase(species.name)

  const content = (
    <>
      <span className="evolution-species-picture">
        {image ? (
          <img
            src={image}
            loading="lazy"
            alt={'Immagine di ' + label}
            onError={() => setImage((previous) => previous === official ? sprite : null)}
          />
        ) : <span aria-hidden="true">?</span>}
      </span>
      <strong>{label}</strong>
      {speciesId != null && <small>#{String(speciesId).padStart(4, '0')}</small>}
      {current && <span className="evolution-current">Specie attuale</span>}
    </>
  )

  return entry ? (
    <a
      className={'evolution-species' + (current ? ' evolution-species-active' : '')}
      href={'#/pokemon/' + entry.source + '/' + entry.id}
      aria-current={current ? 'page' : undefined}
      aria-label={'Apri la scheda di ' + label}
    >
      {content}
    </a>
  ) : (
    <div className={'evolution-species' + (current ? ' evolution-species-active' : '')}>
      {content}
    </div>
  )
}

function briefCondition(details) {
  if (!details?.length) return 'Condizione non indicata'
  if (details.length > 1) return 'Più metodi'

  const detail = details[0]
  const trigger = detail.trigger?.name

  if (trigger === 'use-item') return detail.item ? resourceName(detail.item) : 'Usa un oggetto'
  if (trigger === 'trade') return detail.held_item ? 'Scambio con oggetto' : 'Scambio'
  if (detail.min_level) return 'Livello ' + detail.min_level
  if (detail.min_happiness != null) {
    if (detail.time_of_day === 'day') return 'Amicizia · giorno'
    if (detail.time_of_day === 'night') return 'Amicizia · notte'
    return 'Amicizia'
  }
  if (detail.min_affection != null) return 'Affetto'
  if (detail.min_beauty != null) return 'Bellezza'
  if (detail.known_move_type) return 'Mossa ' + resourceName(detail.known_move_type)
  if (detail.known_move) return 'Mossa speciale'
  if (trigger === 'level-up') return 'Aumento di livello'
  if (trigger === 'shed') return 'Evoluzione speciale'
  if (trigger) return titleCase(trigger)

  return 'Metodo speciale'
}

function EvolutionMethod({ parent, next, onSelect, fork }) {
  const summary = briefCondition(next.evolution_details)

  return (
    <div className="evolution-method" aria-label="Condizioni di evoluzione">
      {!fork && <span className="evolution-arrow" aria-hidden="true">→</span>}
      <span className="evolution-method-label" title={summary}>{summary}</span>
      <button
        type="button"
        className="evolution-details-button"
        onClick={() => onSelect({
          from: titleCase(parent.name),
          to: titleCase(next.species.name),
          methods: [...new Set((next.evolution_details || []).map(evolutionCondition))],
        })}
        aria-label={'Mostra come si evolve ' + titleCase(parent.name) + ' in ' + titleCase(next.species.name)}
      >
        Come si evolve?
      </button>
    </div>
  )
}

function EvolutionBranch({ node, currentSpeciesId, catalogBySpecies, onSelect, incoming = null }) {
  const children = node.evolves_to || []
  const isFork = children.length > 1

  return (
    <div className={'evolution-branch' + (isFork ? ' evolution-branch-split' : '')}>
      <EvolutionSpecies
        species={node.species}
        currentSpeciesId={currentSpeciesId}
        catalogBySpecies={catalogBySpecies}
      />
      {incoming && (
        <EvolutionMethod
          parent={incoming.parent}
          next={incoming.next}
          fork
          onSelect={onSelect}
        />
      )}

      {children.length > 0 && (
        <div
          className={'evolution-children' + (isFork ? ' evolution-children-grid' : '')}
          style={isFork ? { '--evolution-columns': Math.min(children.length, 4) } : undefined}
        >
          {children.map((next) => (
            <div
              className={'evolution-child' + (isFork ? ' evolution-child-tile' : '')}
              key={next.species.url}
            >
              {!isFork && (
                <EvolutionMethod
                  parent={node.species}
                  next={next}
                  onSelect={onSelect}
                  fork={false}
                />
              )}
              <EvolutionBranch
                node={next}
                currentSpeciesId={currentSpeciesId}
                catalogBySpecies={catalogBySpecies}
                onSelect={onSelect}
                incoming={isFork ? { parent: node.species, next } : null}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function EvolutionChain({ species, speciesError, currentSpeciesId, catalog }) {
  const [chain, setChain] = useState(null)
  const [error, setError] = useState(false)
  const [selectedEvolution, setSelectedEvolution] = useState(null)

  const chainUrl = species?.evolution_chain?.url

  useEffect(() => {
    if (!chainUrl) return undefined
    let active = true

    getPokemonEvolutionChain(chainUrl)
      .then((data) => {
        if (active) setChain(data.chain)
      })
      .catch(() => {
        if (active) setError(true)
      })

    return () => { active = false }
  }, [chainUrl])

  const catalogBySpecies = useMemo(() => {
    const bySpecies = new Map()
    for (const entry of catalog) {
      // Le catene sono espresse in specie: non colleghiamo una Mega o una
      // forma regionale se la voce evolutiva riguarda la specie base.
      if (entry.category === 'base' && entry.source === 'pokemon') {
        bySpecies.set(entry.speciesId, entry)
      }
    }
    return bySpecies
  }, [catalog])

  return (
    <section className="pokemon-detail-evolutions" aria-label="Catena evolutiva">
      <span className="eyebrow">EVOLUZIONI</span>
      <h2>Catena evolutiva</h2>

      {speciesError ? (
        <p className="pokemon-detail-unavailable">Informazioni evolutive non disponibili: impossibile leggere la specie.</p>
      ) : !species ? (
        <p className="pokemon-detail-unavailable" role="status">Caricamento evoluzioni…</p>
      ) : !chainUrl ? (
        <p className="pokemon-detail-unavailable">PokéAPI non fornisce una catena evolutiva per questa specie.</p>
      ) : error ? (
        <p className="pokemon-detail-unavailable" role="alert">Non riesco a recuperare la catena evolutiva da PokéAPI.</p>
      ) : !chain ? (
        <p className="pokemon-detail-unavailable" role="status">Caricamento catena evolutiva…</p>
      ) : (
        <>
          <div className="evolution-tree">
            <EvolutionBranch
              node={chain}
              currentSpeciesId={currentSpeciesId}
              catalogBySpecies={catalogBySpecies}
              onSelect={setSelectedEvolution}
            />
          </div>
          {selectedEvolution && (
            <div className="evolution-detail-panel" role="region" aria-label="Dettagli del metodo evolutivo">
              <div className="evolution-detail-heading">
                <h3>{selectedEvolution.from} → {selectedEvolution.to}</h3>
                <button type="button" onClick={() => setSelectedEvolution(null)} aria-label="Chiudi dettagli evoluzione">Chiudi ×</button>
              </div>
              {selectedEvolution.methods.length ? (
                <ul>
                  {selectedEvolution.methods.map((method) => <li key={method}>{method}</li>)}
                </ul>
              ) : (
                <p>PokéAPI non indica le condizioni per questo passaggio evolutivo.</p>
              )}
              {selectedEvolution.methods.length > 1 && (
                <small>I metodi alternativi possono dipendere dal gioco.</small>
              )}
            </div>
          )}
          <p className="evolution-note">
            Le condizioni riportano i dati di PokéAPI e possono cambiare da un gioco all'altro.
            La presenza nella catena non garantisce l'ottenibilità nel gioco selezionato.
          </p>
        </>
      )}
    </section>
  )
}
