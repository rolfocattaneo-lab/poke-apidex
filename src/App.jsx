import { useEffect, useMemo, useState } from 'react'
import PokemonCard from './components/PokemonCard.jsx'
import { getNationalCatalog } from './lib/pokeapi.js'
import { useRegionalPokedex } from './hooks/useRegionalPokedex.js'
import { regionLabel, generationLabel, gameLabel } from './lib/regional.js'
import './App.css'

const PAGE_SIZE = 24

function Icon({ name, size = 20 }) {
  const icons = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    list: <><path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" strokeWidth="3" /></>,
    sliders: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2" fill="currentColor" /><circle cx="15" cy="17" r="2" fill="currentColor" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('poke-apidex-theme') || 'system')
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [view, setView] = useState(() => localStorage.getItem('poke-apidex-view') || 'grid')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [formFilter, setFormFilter] = useState('base')
  const [catalog, setCatalog] = useState([])
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState('')
  const [catalogRetry, setCatalogRetry] = useState(0)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const regional = useRegionalPokedex()

  useEffect(() => {
    if (!window.location.hash) window.location.hash = '#/pokemon'
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => { localStorage.setItem('poke-apidex-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('poke-apidex-view', view) }, [view])

  useEffect(() => {
    let active = true
    const controller = new AbortController()

    getNationalCatalog(controller.signal)
      .then((pokemon) => {
        if (active) setCatalog(pokemon)
      })
      .catch((error) => {
        if (active) setCatalogError(error.message || 'Errore di connessione a PokéAPI.')
      })
      .finally(() => {
        if (active) setCatalogLoading(false)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [catalogRetry])

  const regionalCatalog = useMemo(() => {
    if (regional.region === 'national') return catalog
    if (!regional.ready || !regional.entries) return []

    const bySpecies = new Map()
    for (const pokemon of catalog) {
      const forms = bySpecies.get(pokemon.speciesId) || []
      forms.push(pokemon)
      bySpecies.set(pokemon.speciesId, forms)
    }

    // L'ordine delle specie segue il Pokédex del gioco selezionato.
    // Si includono tutte le forme presenti in PokéAPI, anche se non ottenibili in quel gioco.
    return regional.entries.flatMap((entry) =>
      (bySpecies.get(entry.speciesId) || []).map((pokemon) => ({
        ...pokemon,
        regionalNumber: entry.regionalNumber,
        pokedexName: entry.pokedexName,
      })),
    )
  }, [catalog, regional.region, regional.ready, regional.entries])

  const matchingPokemon = useMemo(() => {
    const query = search.trim().toLowerCase()
    const numberQuery = /^#?\d+$/.test(query)
      ? Number(query.replace('#', ''))
      : null
    const words = query.replaceAll(' ', '-').split('-').filter(Boolean)

    return regionalCatalog.filter((pokemon) => {
      if (formFilter === 'base' && pokemon.category !== 'base') return false
      if (formFilter === 'alternative' && pokemon.category === 'base') return false
      if (!['all', 'base', 'alternative'].includes(formFilter) && pokemon.category !== formFilter) return false

      if (!query) return true
      if (numberQuery !== null) return pokemon.speciesId === numberQuery
      return words.every((word) => pokemon.name.includes(word))
    })
  }, [regionalCatalog, search, formFilter])

  const visiblePokemon = matchingPokemon.slice(0, visibleCount)
  const effectiveTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme
  const isLoading = catalogLoading || regional.loading

  function retryCatalog() {
    setCatalogError('')
    setCatalogLoading(true)
    setCatalogRetry((retry) => retry + 1)
  }

  return (
    <div className="app" data-theme={effectiveTheme}>
      <header className="topbar">
        <a className="brand" href="#/pokemon" aria-label="Poke Apidex, torna al Pokédex">
          <span className="brand-mark" aria-hidden="true"><span className="brand-mark-center" /></span>
          <span className="brand-text"><strong>Poke Apidex</strong><small>La tua enciclopedia Pokémon</small></span>
        </a>

        <nav className="primary-nav" aria-label="Navigazione principale">
          <a href="#/pokemon" className="nav-active" aria-current="page">Pokémon</a>
          <span className="nav-coming" title="Disponibile in una versione successiva">Mosse <small>Presto</small></span>
          <span className="nav-coming" title="Disponibile in una versione successiva">Abilità <small>Presto</small></span>
        </nav>

        <div className="header-actions">
          <label className="theme-picker">
            <Icon name="sun" size={18} />
            <span className="sr-only">Tema dell'interfaccia</span>
            <select value={theme} onChange={(event) => setTheme(event.target.value)} aria-label="Tema dell'interfaccia">
              <option value="system">Sistema</option>
              <option value="light">Chiaro</option>
              <option value="dark">Scuro</option>
            </select>
          </label>
        </div>
      </header>

      <div className="workspace">
        <aside className={'filter-panel' + (filtersOpen ? ' filter-panel-open' : '')} aria-label="Filtri Pokédex">
          <div className="filter-heading">
            <div><span className="eyebrow">ESPLORA</span><h2>Filtri Pokédex</h2></div>
            <button type="button" className="filter-close" onClick={() => setFiltersOpen(false)} aria-label="Chiudi filtri"><Icon name="close" /></button>
          </div>
          <p className="filter-hint">Scegli il Pokédex nazionale oppure una regione, una generazione e un gioco. Poi cerca i Pokémon e le loro forme.</p>
          <div className="filter-field">
            <label htmlFor="region-select">Regione / Pokédex</label>
            <select id="region-select" value={regional.region} onChange={(event) => { regional.selectRegion(event.target.value); setFormFilter('base'); setVisibleCount(PAGE_SIZE) }}>
              <option value="national">Nazionale (tutti i Pokémon)</option>
              {regional.regions.map((item) => <option key={item.name} value={item.name}>{regionLabel(item.name)}</option>)}
            </select>
            {regional.regionsError && <p className="field-help field-error">{regional.regionsError} <button type="button" onClick={regional.retryRegions}>Riprova</button></p>}
          </div>
          {regional.region !== 'national' && (
            <>
              <div className="filter-field">
                <label htmlFor="generation-select">Generazione</label>
                <select id="generation-select" value={regional.generation} disabled={regional.optionsLoading || !!regional.optionsError || regional.generations.length === 0} onChange={(event) => { regional.selectGeneration(event.target.value); setFormFilter('base'); setVisibleCount(PAGE_SIZE) }}>
                  <option value="">{regional.optionsLoading ? 'Caricamento…' : 'Seleziona una generazione'}</option>
                  {regional.generations.map((name) => <option key={name} value={name}>{generationLabel(name)}</option>)}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="game-select">Gioco</label>
                <select id="game-select" value={regional.game} disabled={!regional.generation || regional.optionsLoading} onChange={(event) => { regional.selectGame(event.target.value); setFormFilter('base'); setVisibleCount(PAGE_SIZE) }}>
                  <option value="">Seleziona un gioco</option>
                  {regional.games.map((item) => <option key={item.name} value={item.name}>{gameLabel(item.name)}</option>)}
                </select>
                {!regional.optionsLoading && !regional.optionsError && !regional.hasGames && <p className="field-help">PokéAPI non associa ancora Pokédex ai giochi di questa regione.</p>}
              </div>
            </>
          )}
          <div className="filter-field">
            <label htmlFor="name-search">Nome o numero</label>
            <div className="input-with-icon"><Icon name="search" size={17} /><input id="name-search" type="search" autoComplete="off" value={search} onChange={(event) => { setSearch(event.target.value); setVisibleCount(PAGE_SIZE) }} placeholder="Es. Pikachu o 25" disabled={catalogLoading} /></div>
          </div>
          <div className="filter-field">
            <label htmlFor="type-select">Tipo</label>
            <select id="type-select" disabled><option>Tutti i tipi</option></select>
          </div>
          <div className="filter-field">
            <label htmlFor="form-select">Categoria forma</label>
            <select id="form-select" value={formFilter} onChange={(event) => { setFormFilter(event.target.value); setVisibleCount(PAGE_SIZE) }}>
              <option value="all">Tutte le forme</option>
              <option value="base">Solo forme base</option>
              <option value="alternative">Tutte le alternative</option>
              <option value="regional">Forme regionali</option>
              <option value="mega">Mega Evoluzioni</option>
              <option value="gmax">Gigamax</option>
              <option value="other">Altre forme</option>
            </select>
          </div>
          <div className="sidebar-note"><span className="note-dot" /> Nei Pokédex regionali le forme condividono il numero della specie. La presenza di una forma qui non ne garantisce la disponibilità nel gioco scelto.</div>
        </aside>

        <main className="main-content">
          <div className="intro">
            <span className="eyebrow intro-eyebrow">POKÉDEX • {regional.region === 'national' ? 'NAZIONALE' : regionLabel(regional.region).toUpperCase()}</span>
            <h1>Ogni Pokémon.<br /><span>Una storia da scoprire.</span></h1>
            <p>{regional.region === 'national'
              ? 'Esplora il Pokédex nazionale con Mega Evoluzioni, Gigamax, forme regionali e varianti estetiche.'
              : 'Scegli generazione e gioco per vedere le specie del Pokédex regionale, con tutte le loro forme presenti in PokéAPI.'}</p>
          </div>

          <div className="section-toolbar">
            <div className="section-title">
              <span className="eyebrow">CATALOGO DA POKÉAPI</span>
              <h2>Il tuo Pokédex</h2>
              <p className="catalog-count" role="status">{isLoading ? 'Caricamento del Pokédex…' : catalogError || regional.optionsError || regional.entriesError ? 'Pokédex non disponibile' : !regional.ready ? 'Seleziona generazione e gioco' : matchingPokemon.length + ' forme Pokémon trovate'}</p>
            </div>
            <div className="toolbar-actions">
              <button type="button" className="mobile-filter-button" onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
                <Icon name="sliders" size={17} /> Filtri
              </button>
              <div className="view-switch" role="group" aria-label="Visualizzazione delle schede">
                <button type="button" className={view === 'grid' ? 'selected' : ''} aria-label="Vista a griglia" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Icon name="grid" size={18} /></button>
                <button type="button" className={view === 'list' ? 'selected' : ''} aria-label="Vista a elenco" aria-pressed={view === 'list'} onClick={() => setView('list')}><Icon name="list" size={19} /></button>
              </div>
            </div>
          </div>

          {catalogError ? (
            <div className="catalog-feedback" role="alert">
              <p>{catalogError}</p>
              <button type="button" className="catalog-button" onClick={retryCatalog}>Riprova</button>
            </div>
          ) : catalogLoading ? (
            <div className="catalog-feedback" role="status">Sto caricando il catalogo nazionale da PokéAPI…</div>
          ) : regional.optionsError ? (
            <div className="catalog-feedback" role="alert">
              <p>{regional.optionsError}</p>
              <button type="button" className="catalog-button" onClick={regional.retryOptions}>Riprova</button>
            </div>
          ) : regional.entriesError ? (
            <div className="catalog-feedback" role="alert">
              <p>{regional.entriesError}</p>
              <button type="button" className="catalog-button" onClick={regional.retryEntries}>Riprova</button>
            </div>
          ) : regional.loading ? (
            <div className="catalog-feedback" role="status">Sto caricando il Pokédex regionale da PokéAPI…</div>
          ) : !regional.ready ? (
            <div className="catalog-feedback">Seleziona generazione e gioco nel pannello dei filtri per aprire il Pokédex di {regionLabel(regional.region)}.</div>
          ) : visiblePokemon.length === 0 ? (
            <div className="catalog-feedback">Nessun Pokémon trovato. Prova un altro nome o numero.</div>
          ) : (
            <div className={'pokemon-grid' + (view === 'list' ? ' pokemon-grid-list' : '')}>
              {visiblePokemon.map((pokemon) => <PokemonCard key={pokemon.key} pokemon={pokemon} list={view === 'list'} />)}
            </div>
          )}

          {!isLoading && !catalogError && !regional.optionsError && !regional.entriesError && regional.ready && visibleCount < matchingPokemon.length && (
            <div className="load-more">
              <button type="button" className="catalog-button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
                Carica altri Pokémon ({Math.min(visibleCount, matchingPokemon.length)} di {matchingPokemon.length})
              </button>
            </div>
          )}

          <div className="next-step">
            <span className="next-step-icon"><Icon name="arrow" size={20} /></span>
            <div>
              <strong>Pokédex nazionale e regionali.</strong>
              <p>I Pokémon vengono ordinati secondo le voci del Pokédex associato al gioco. Sono incluse tutte le forme della specie disponibili in PokéAPI, <strong>non necessariamente ottenibili nel gioco selezionato</strong>.</p>
            </div>
          </div>
          <footer className="site-footer">Poke Apidex è un progetto indipendente e non ufficiale. Pokémon e relativi marchi appartengono ai rispettivi titolari.</footer>
        </main>
      </div>
      {filtersOpen && <button type="button" className="filter-backdrop" onClick={() => setFiltersOpen(false)} aria-label="Chiudi pannello filtri" />}
    </div>
  )
}

export default App
