import { useEffect, useState } from 'react'
import { getTypeDamageRelations, pokemonTypes } from '../lib/types.js'
import { calculateTypeEffectiveness } from '../lib/typeEffectiveness.js'

const supportedTypes = new Set(pokemonTypes.map(({ id }) => id))
const bands = [
  { title: 'Debolezze', factors: [4, 2] },
  { title: 'Resistenze', factors: [0.25, 0.5] },
  { title: 'Immunità', factors: [0] },
]
const factorLabels = { 4: '×4', 2: '×2', 0.25: '×0,25', 0.5: '×0,5', 0: '×0' }

export default function TypeEffectiveness({ types }) {
  const typeKey = types.join('|')
  const unsupported = !types.length || types.some((type) => !supportedTypes.has(type))
  const [result, setResult] = useState(null)

  useEffect(() => {
    const names = typeKey.split('|').filter(Boolean)
    if (!names.length || names.some((name) => !supportedTypes.has(name))) return undefined

    let active = true
    Promise.all(names.map(async (name) => [name, await getTypeDamageRelations(name)]))
      .then((items) => {
        if (active) {
          setResult({
            matchups: calculateTypeEffectiveness(names, Object.fromEntries(items)),
            error: false,
          })
        }
      })
      .catch(() => {
        if (active) setResult({ matchups: [], error: true })
      })

    return () => { active = false }
  }, [typeKey])

  return (
    <section className="pokemon-detail-effectiveness" aria-label="Debolezze e resistenze difensive">
      <div className="type-effectiveness-heading">
        <div>
          <span className="eyebrow">COMBATTIMENTO</span>
          <h2>Debolezze e resistenze</h2>
        </div>
        <span className="type-effectiveness-subtitle">Danni ricevuti · Tabella tipi attuale</span>
      </div>

      {unsupported ? (
        <p className="type-effectiveness-notice">
          Rapporti difensivi non disponibili per questo tipo di Pokémon.
        </p>
      ) : !result ? (
        <p className="type-effectiveness-notice" role="status">Calcolo delle affinità dei tipi…</p>
      ) : result.error ? (
        <p className="type-effectiveness-notice" role="alert">
          Impossibile recuperare le relazioni dei tipi da PokéAPI.
        </p>
      ) : (
        <div className="type-effectiveness-grid">
          {bands.map(({ title, factors }) => {
            const available = factors.map((factor) => ({
              factor,
              entries: result.matchups.filter((item) => item.multiplier === factor),
            })).filter(({ entries }) => entries.length > 0)

            if (!available.length) return null

            return (
              <div className="type-effectiveness-group" key={title}>
                <h3>{title}</h3>
                {available.map(({ factor, entries }) => (
                  <div className="type-effectiveness-band" key={factor}>
                    <strong className="type-effectiveness-factor">{factorLabels[factor]}</strong>
                    <div className="type-effectiveness-types">
                      {entries.map(({ type, label }) => (
                        <span className={'type-chip type-' + type} key={type}>
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
      <p className="type-effectiveness-note">
        Non sono mostrati i danni neutri (×1). Abilità, strumenti, condizioni e
        modificatori specifici delle mosse possono alterare i danni effettivi.
      </p>
    </section>
  )
}
