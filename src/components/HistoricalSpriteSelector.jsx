import { useId, useState } from 'react'
import {
  cleanFlavorText,
  getHistoricalSpriteOptions,
  getLatestAvailableFlavor,
  getVersionFlavor,
} from '../lib/historicalSprites.js'

function PokedexDescription({ species, speciesError, flavor, versionLabel, category, fallback = false }) {
  return (
    <div className={fallback ? 'pokemon-detail-description' : 'historical-sprites-description'} aria-live="polite">
      <span className="eyebrow">POKÉDEX</span>
      <h3>Descrizione del Pokédex</h3>
      {speciesError ? (
        <p className="pokemon-detail-unavailable">Impossibile caricare la descrizione da PokéAPI.</p>
      ) : !species ? (
        <p className="pokemon-detail-unavailable">Caricamento descrizione…</p>
      ) : flavor ? (
        <>
          <p>{cleanFlavorText(flavor.flavor_text)}</p>
          <small>
            {fallback ? 'Descrizione della specie · ' : 'Versione selezionata: ' + versionLabel + ' · '}
            Lingua: {flavor.language?.name === 'it' ? 'italiano' : 'inglese'}
          </small>
        </>
      ) : (
        <p className="pokemon-detail-unavailable">
          {fallback
            ? 'Descrizione non disponibile in italiano o inglese per questa specie.'
            : 'PokéAPI non riporta una descrizione italiana o inglese per ' + versionLabel + '.'}
        </p>
      )}
      {category !== 'base' && (
        <p className="pokemon-detail-species-note">
          La descrizione si riferisce alla specie e non necessariamente a questa forma.
        </p>
      )}
    </div>
  )
}

export default function HistoricalSpriteSelector({
  details, species, speciesError, title, category, primaryType,
}) {
  const panelId = useId()
  const gameId = useId()
  const [open, setOpen] = useState(true)
  const [selected, setSelected] = useState('')
  const [shiny, setShiny] = useState(false)
  const [brokenImage, setBrokenImage] = useState(null)
  const options = getHistoricalSpriteOptions(details)

  // La descrizione del Pokédex resta disponibile anche per forme senza sprite storici.
  if (!options.length) {
    return (
      <PokedexDescription
        species={species}
        speciesError={speciesError}
        flavor={getLatestAvailableFlavor(species)}
        category={category}
        fallback
      />
    )
  }

  const generations = [...new Set(options.map((option) => option.generation))]
  const choice = options.find((option) => option.key === selected) || options[0]
  const currentImage = shiny ? choice.shiny : choice.normal
  const imageFailed = brokenImage === currentImage
  const flavor = getVersionFlavor(species, choice.version)

  function changeVersion(key) {
    const next = options.find((option) => option.key === key)
    if (!next) return
    setSelected(next.key)
    if (!next.shiny) setShiny(false)
    setBrokenImage(null)
  }

  return (
    <section className="pokemon-detail-historical-sprites" aria-label="Archivio Pokédex e sprite storici">
      <button
        className="historical-sprites-toggle"
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="historical-sprites-heading">
          <span className="eyebrow">ARCHIVIO</span>
          <strong>Pokédex e sprite storici</strong>
        </span>
        <span className="historical-sprites-count">{options.length} giochi e versioni</span>
        <span className="historical-sprites-chevron" aria-hidden="true">{open ? '−' : '+'}</span>
      </button>

      <div id={panelId} hidden={!open}>
        {open && (
          <div className="historical-sprites-content">
            <p className="historical-sprites-intro">
              Scegli il gioco per vedere lo sprite e la relativa descrizione del Pokédex.
              Alcuni giochi condividono lo stesso sprite, ma possono avere descrizioni diverse.
            </p>

            <div className="historical-sprites-workspace">
              <div className="historical-sprites-settings">
                <label htmlFor={gameId}>Gioco / versione</label>
                <select
                  id={gameId}
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

              <figure className={'historical-sprites-preview pokemon-' + primaryType}>
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

            <PokedexDescription
              species={species}
              speciesError={speciesError}
              flavor={flavor}
              versionLabel={choice.label}
              category={category}
            />
          </div>
        )}
      </div>
    </section>
  )
}
