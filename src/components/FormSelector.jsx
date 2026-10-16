const categories = [
  { id: 'base', label: 'Forma principale' },
  { id: 'regional', label: 'Forme regionali' },
  { id: 'mega', label: 'Mega Evoluzioni' },
  { id: 'gmax', label: 'Gigamax' },
  { id: 'other', label: 'Altre forme' },
]

const suffixLabels = {
  mega: 'Mega', gmax: 'Gigamax', alola: 'Alola', galar: 'Galar',
  hisui: 'Hisui', paldea: 'Paldea', x: 'X', y: 'Y',
}

function prettyName(value) {
  return value.split('-').map((word) =>
    suffixLabels[word] || word.charAt(0).toUpperCase() + word.slice(1),
  ).join(' ')
}

function formName(entry) {
  if (entry.category === 'base') return 'Forma base'
  const prefix = entry.speciesName + '-'
  const suffix = entry.name.startsWith(prefix)
    ? entry.name.slice(prefix.length)
    : entry.name

  return prettyName(suffix)
}

export default function FormSelector({ pokemon, catalog }) {
  // Le forme della specie sono disponibili nel catalogo, senza richieste
  // aggiuntive né miniature da caricare.
  const forms = catalog.filter((entry) => entry.speciesId === pokemon.speciesId)

  if (forms.length <= 1) return null

  function changeForm(key) {
    const next = forms.find((entry) => entry.key === key)
    if (next && next.key !== pokemon.key) {
      window.location.assign('#/pokemon/' + next.source + '/' + next.id)
    }
  }

  return (
    <div className="pokemon-form-picker">
      <label htmlFor="pokemon-form-select">
        Forma <span>({forms.length})</span>
      </label>
      <select
        id="pokemon-form-select"
        value={pokemon.key}
        onChange={(event) => changeForm(event.target.value)}
        aria-label="Seleziona una forma di questo Pokémon"
      >
        {categories.map(({ id, label }) => {
          const entries = forms.filter((entry) => entry.category === id)
          return entries.length ? (
            <optgroup key={id} label={label}>
              {entries.map((entry) => (
                <option key={entry.key} value={entry.key}>
                  {formName(entry)}
                </option>
              ))}
            </optgroup>
          ) : null
        })}
      </select>
    </div>
  )
}
