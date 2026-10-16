import { useEffect, useId, useRef, useState } from 'react'
import { getAbilityDetails } from '../lib/pokeapi.js'
import { getAbilityDescription } from '../lib/abilityDescriptions.js'

export default function PokemonAbilities({ abilities, abilityNames }) {
  const panelId = useId()
  const requestNumber = useRef(0)
  const [selected, setSelected] = useState(null)
  const [response, setResponse] = useState(null)

  useEffect(() => () => { requestNumber.current += 1 }, [])

  function loadAbility(name) {
    const request = ++requestNumber.current
    setResponse({ name, status: 'loading', data: null })

    // getAbilityDetails utilizza già la cache PokéAPI condivisa con i nomi.
    getAbilityDetails(name)
      .then((data) => {
        if (request === requestNumber.current) {
          setResponse({ name, status: 'ready', data })
        }
      })
      .catch(() => {
        if (request === requestNumber.current) {
          setResponse({ name, status: 'error', data: null })
        }
      })
  }

  function toggleAbility(name) {
    if (selected === name) {
      requestNumber.current += 1
      setSelected(null)
      setResponse(null)
      return
    }

    setSelected(name)
    loadAbility(name)
  }

  const current = selected && response?.name === selected ? response : null
  const description = current?.status === 'ready'
    ? getAbilityDescription(current.data)
    : null
  const selectedName = selected ? abilityNames[selected] || selected.replaceAll('-', ' ') : ''

  return (
    <>
      <div className="pokemon-detail-ability-list">
        {abilities.map(({ ability, is_hidden: hidden }) => (
          <button
            type="button"
            className={'pokemon-detail-ability' + (selected === ability.name ? ' selected' : '')}
            key={ability.name}
            aria-expanded={selected === ability.name}
            aria-controls={selected === ability.name ? panelId : undefined}
            onClick={() => toggleAbility(ability.name)}
          >
            <strong>{abilityNames[ability.name] || ability.name.replaceAll('-', ' ')}</strong>
            {hidden && <small>Nascosta</small>}
            <span className="pokemon-detail-ability-indicator" aria-hidden="true">
              {selected === ability.name ? '−' : '+'}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <div
          id={panelId}
          className="pokemon-detail-ability-description"
          role="region"
          aria-label={'Descrizione dell’abilità ' + selectedName}
        >
          <div className="pokemon-detail-ability-description-heading">
            <strong>{selectedName}</strong>
            <button type="button" onClick={() => toggleAbility(selected)} aria-label="Chiudi descrizione abilità">
              Chiudi
            </button>
          </div>

          {current?.status === 'loading' || !current ? (
            <p role="status">Caricamento descrizione…</p>
          ) : current.status === 'error' ? (
            <p role="alert">
              Impossibile caricare la descrizione da PokéAPI.{' '}
              <button type="button" className="pokemon-ability-retry" onClick={() => loadAbility(selected)}>
                Riprova
              </button>
            </p>
          ) : description ? (
            <>
              <p>{description.text}</p>
              <small>
                {description.language === 'it' ? 'Italiano' : 'Inglese (italiano non disponibile)'}
                {' · '}
                {description.source === 'game' ? 'Descrizione di gioco' : 'Effetto dell’abilità'}
              </small>
            </>
          ) : (
            <p>Descrizione non disponibile in italiano o inglese per questa abilità.</p>
          )}
        </div>
      )}
    </>
  )
}
