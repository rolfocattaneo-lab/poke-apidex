import { useEffect, useState } from 'react'
import './App.css'

const previewPokemon = [
  { number: '0001', name: 'Bulbasaur', types: ['Erba', 'Veleno'], color: 'grass', id: 1 },
  { number: '0006', name: 'Charizard', types: ['Fuoco', 'Volante'], color: 'fire', id: 6 },
  { number: '0025', name: 'Pikachu', types: ['Elettro'], color: 'electric', id: 25 },
]

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

function PokemonCard({ pokemon, list }) {
  const { number, name, types, color, id } = pokemon
  return (
    <article className={'pokemon-card pokemon-' + color + (list ? ' pokemon-card-list' : '')}>
      <div className="pokemon-card-image">
        <img
          src={'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/' + id + '.png'}
          alt={'Artwork ufficiale di ' + name}
          loading="lazy"
        />
      </div>
      <div className="pokemon-card-body">
        <span className="pokemon-number">#{number}</span>
        <h3>{name}</h3>
        <div className="type-list">
          {types.map((type) => <span key={type} className={'type-chip type-' + type.toLowerCase()}>{type}</span>)}
        </div>
      </div>
    </article>
  )
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('poke-apidex-theme') || 'system')
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [view, setView] = useState(() => localStorage.getItem('poke-apidex-view') || 'grid')
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    if (!window.location.hash) window.location.hash = '#/pokemon'
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemDark(event.matches)
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => { localStorage.setItem('poke-apidex-theme', theme) }, [theme])
  useEffect(() => { localStorage.setItem('poke-apidex-view', view) }, [view])

  const effectiveTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

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
          <p className="filter-hint">Questi controlli verranno attivati quando collegheremo il catalogo PokéAPI.</p>
          <div className="filter-field">
            <label htmlFor="dex-select">Pokédex</label>
            <select id="dex-select" disabled><option>Nazionale</option></select>
          </div>
          <div className="filter-field">
            <label htmlFor="name-search">Nome o numero</label>
            <div className="input-with-icon"><Icon name="search" size={17} /><input id="name-search" placeholder="Cerca un Pokémon" disabled /></div>
          </div>
          <div className="filter-field">
            <label htmlFor="type-select">Tipo</label>
            <select id="type-select" disabled><option>Tutti i tipi</option></select>
          </div>
          <div className="filter-field">
            <label htmlFor="form-select">Forma</label>
            <select id="form-select" disabled><option>Tutte le forme</option></select>
          </div>
          <div className="sidebar-note"><span className="note-dot" /> Prossima fase: indice e filtri funzionanti.</div>
        </aside>

        <main className="main-content">
          <div className="intro">
            <span className="eyebrow intro-eyebrow">POKÉDEX • PRIME FONDAMENTA</span>
            <h1>Ogni Pokémon.<br /><span>Una storia da scoprire.</span></h1>
            <p>Un'enciclopedia Pokémon moderna, con forme alternative, sprite storici, evoluzioni e molto altro. La prima interfaccia è pronta; il catalogo arriverà nel prossimo passo.</p>
          </div>

          <div className="section-toolbar">
            <div className="section-title">
              <span className="eyebrow">ANTEPRIMA GRAFICA</span>
              <h2>Il tuo Pokédex</h2>
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

          <div className={'pokemon-grid' + (view === 'list' ? ' pokemon-grid-list' : '')}>
            {previewPokemon.map((pokemon) => <PokemonCard key={pokemon.id} pokemon={pokemon} list={view === 'list'} />)}
          </div>

          <div className="next-step">
            <span className="next-step-icon"><Icon name="arrow" size={20} /></span>
            <div>
              <strong>La base è pronta.</strong>
              <p>Le tre schede qui sopra sono un'anteprima. La prossima fase collegherà l'intero catalogo PokéAPI, con ricerca, Pokédex regionali e forme alternative.</p>
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
