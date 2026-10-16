import { useId, useState } from 'react'
import { getHistoricalSpriteOptions } from '../lib/historicalSprites.js'

export default function HistoricalSpriteSelector({ details, title }) {
  const panelId = useId()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [shiny, setShiny] = useState(false)
  const [brokenImage, setBrokenImage] = useState(null)
  const options = getHistoricalSpriteOptions(details)

  // Nessuna sezione superflua quando PokéAPI non ha sprite per la forma.
  if (!options.length) return null

  const generations = [...new Set(options.map((option) => option.generation))]
  const choice = options.find((option) => option.key === selected) || options[0]
  const currentImage = shiny ? choice.shiny : choice.normal
  const imageFailed = brokenImage === currentImage

  function changeVersion(key) {
    const next = options.find((option) => option.key === key)
    if (!next) return
    setSelected(next.key)
    if (!next.shiny) setShiny(false)
    setBrokenImage(null)
  }

  return (
    <section className="pokemon-detail-historical-sprites" aria-label="Archivio degli sprite storici">
      <button
        className="historical-sprites-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="historical-sprites-heading">
          <span className="eyebrow">ARCHIVIO</span>
          <strong>Sprite storici</strong>
        </span>
        <span className="historical-sprites-count">{options.length} versioni disponibili</span>
        <span className="historical-sprites-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>

      <div id={panelId} hidden={!open}>
        {open && (
          <div className="historical-sprites-content">
            <p className="historical-sprites-intro">
              Consulta gli sprite dei giochi precedenti senza modificare l'artwork principale.
              Le versioni disponibili dipendono dai dati PokéAPI per questa forma.
            </p>

            <div className="historical-sprites-workspace">
              <div className="historical-sprites-settings">
                <label htmlFor="historical-sprite-game">Gioco / versione</label>
                <select
                  id="historical-sprite-game"
                  value={choice.key}
                  onChange={(event) => changeVersion(event.target.value)}
                >
                  {generations.map((generation) => (
                    <optgroup
                      key={generation}
                      label={options.find((option) => option.generation === generation).generationLabel}
                    >
                      {options.filter((option) => option.generation === generation).map((option) => (
                        <option key={option.key} value={option.key}>{option.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <span className="historical-sprites-color-label">Colorazione</span>
                <div className="historical-sprites-color" role="group" aria-label="Colorazione dello sprite storico">
                  <button
                    type="button"
                    className={!shiny ? 'selected' : ''}
                    aria-pressed={!shiny}
                    onClick={() => setShiny(false)}
                  >
                    Normale
                  </button>
                  <button
                    type="button"
                    className={shiny ? 'selected' : ''}
                    aria-pressed={shiny}
                    disabled={!choice.shiny}
                    title={!choice.shiny ? 'Sprite shiny non presente per questa versione' : undefined}
                    onClick={() => setShiny(true)}
                  >
                    ✨ Shiny
                  </button>
                </div>
              </div>

              <figure className="historical-sprites-preview">
                <div className="historical-sprites-image">
                  {currentImage && !imageFailed ? (
                    <img
                      key={currentImage}
                      src={currentImage}
                      alt={'Sprite ' + (shiny ? 'shiny' : 'normale') + ' di ' + title + ' in ' + choice.label}
                      className={choice.pixelated ? 'historical-sprites-pixelated' : undefined}
                      onError={() => setBrokenImage(currentImage)}
                    />
                  ) : (
                    <span role="status">Sprite non disponibile.</span>
                  )}
                </div>
                <figcaption>
                  <strong>{choice.label}</strong>
                  <span>{choice.generationLabel}{shiny ? ' · Shiny' : ''}</span>
                </figcaption>
              </figure>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
