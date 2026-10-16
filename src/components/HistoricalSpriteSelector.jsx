export default function HistoricalSpriteSelector({ options, selected, onChange }) {
  if (!options.length) return null

  const generations = [...new Set(options.map((option) => option.generation))]

  return (
    <div className="pokemon-sprite-picker">
      <label htmlFor="pokemon-sprite-select">Sprite</label>
      <select
        id="pokemon-sprite-select"
        value={selected}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Seleziona lo sprite per generazione e gioco"
      >
        <option value="current">Artwork attuale</option>
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
    </div>
  )
}
