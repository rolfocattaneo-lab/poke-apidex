import { useEffect, useMemo, useState } from 'react'
import { getPokemonEntryDetails } from '../lib/pokeapi.js'

const PAGE_SIZE = 8

const categories = [
  { id: 'all', label: 'Tutte' },
  { id: 'base', label: 'Base' },
  { id: 'regional', label: 'Regionali' },
  { id: 'mega', label: 'Mega' },
  { id: 'gmax', label: 'Gigamax' },
  { id: 'other', label: 'Altre' },
]

const categoryLabels = {
  base: 'Forma base',
  regional: 'Forma regionale',
  mega: 'Mega Evoluzione',
  gmax: 'Gigamax',
  other: 'Altra forma',
}

const suffixNames = {
  mega: 'Mega', gmax: 'Gigamax', alola: 'Alola', galar: 'Galar',
  hisui: 'Hisui', paldea: 'Paldea', x: 'X', y: 'Y',
}

function prettyName(value) {
  return value.split('-').map((word) =>
    suffixNames[word] || word.charAt(0).toUpperCase() + word.slice(1),
  ).join(' ')
}

function formName(entry) {
  if (entry.category === 'base') return 'Forma base'
  const suffix = entry.name.startsWith(entry.speciesName + '-')
    ? entry.name.slice(entry.speciesName.length + 1)
    : entry.name

  return prettyName(suffix)
}

function getImages(details, source) {
  const sprites = details?.sprites || {}
  const candidates = source === 'form'
    ? [sprites.front_default]
    : [sprites.other?.['official-artwork']?.front_default, sprites.front_default]

  if (source === 'form' && sprites.versions) {
    for (const generation of Object.values(sprites.versions)) {
      for (const version of Object.values(generation || {})) {
        candidates.push(version?.front_default)
      }
    }
  }
  return [...new Set(candidates.filter(Boolean))]
}

function FormThumbnail({ entry }) {
  const [images, setImages] = useState([])
  const [imageIndex, setImageIndex] = useState(0)

  useEffect(() => {
    let active = true

    // Usa la stessa cache della scheda dettaglio: nessun download di immagini sul disco.
    getPokemonEntryDetails(entry)
      .then((data) => {
        if (active) setImages(getImages(data, entry.source))
      })
      .catch(() => {
        if (active) setImages([])
      })

    return () => { active = false }
  }, [entry])

  const image = images[imageIndex]

  return image ? (
    <img
      src={image}
      alt=""
      loading="lazy"
      onError={() => setImageIndex((index) => index + 1)}
    />
  ) : (
    <span className="form-option-no-image" aria-hidden="true">◌</span>
  )
}

export default function FormSelector({ pokemon, catalog }) {
  const forms = useMemo(() =>
    catalog.filter((entry) => entry.speciesId === pokemon.speciesId),
  [catalog, pokemon.speciesId])

  const [category, setCategory] = useState('all')
  const [page, setPage] = useState(() => {
    const selected = forms.findIndex((entry) => entry.key === pokemon.key)
    return Math.floor(Math.max(selected, 0) / PAGE_SIZE)
  })

  if (forms.length <= 1) return null

  const availableCategories = categories.filter(({ id }) =>
    id === 'all' || forms.some((entry) => entry.category === id),
  )
  const matching = category === 'all'
    ? forms
    : forms.filter((entry) => entry.category === category)
  const totalPages = Math.ceil(matching.length / PAGE_SIZE)
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * PAGE_SIZE
  const visible = matching.slice(start, start + PAGE_SIZE)

  function changeCategory(next) {
    setCategory(next)
    const filtered = next === 'all'
      ? forms
      : forms.filter((entry) => entry.category === next)
    const selected = filtered.findIndex((entry) => entry.key === pokemon.key)
    setPage(Math.floor(Math.max(selected, 0) / PAGE_SIZE))
  }

  return (
    <section className="pokemon-form-selector" aria-label="Forme della stessa specie">
      <div className="form-selector-heading">
        <div>
          <span className="eyebrow">VARIANTI</span>
          <h2>Forme disponibili</h2>
        </div>
        <span className="form-selector-count">{forms.length} forme in PokéAPI</span>
      </div>

      <div className="form-selector-categories" role="group" aria-label="Filtra le categorie di forme">
        {availableCategories.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={'form-selector-category' + (category === id ? ' selected' : '')}
            aria-pressed={category === id}
            onClick={() => changeCategory(id)}
          >
            {label}
            <span>{id === 'all' ? forms.length : forms.filter((entry) => entry.category === id).length}</span>
          </button>
        ))}
      </div>

      <div className="form-selector-options">
        {visible.map((entry) => {
          const current = entry.key === pokemon.key
          return (
            <a
              key={entry.key}
              className={'form-option' + (current ? ' form-option-current' : '')}
              href={'#/pokemon/' + entry.source + '/' + entry.id}
              aria-current={current ? 'page' : undefined}
              aria-label={'Apri ' + formName(entry)}
            >
              <span className="form-option-image"><FormThumbnail entry={entry} /></span>
              <strong>{formName(entry)}</strong>
              <small>{categoryLabels[entry.category]}</small>
              {current && <span className="form-option-current-label">Selezionata</span>}
            </a>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div className="form-selector-pagination">
          <button type="button" disabled={safePage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>
            ← Precedenti
          </button>
          <span>{start + 1}–{Math.min(start + PAGE_SIZE, matching.length)} di {matching.length}</span>
          <button type="button" disabled={safePage >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}>
            Successive →
          </button>
        </div>
      )}

      <p className="form-selector-note">
        Le forme mostrate sono registrate in PokéAPI; non è garantito che siano ottenibili nel gioco selezionato.
        Le varianti soltanto estetiche possono condividere tipi e statistiche con la forma principale.
      </p>
    </section>
  )
}
