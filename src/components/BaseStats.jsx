const statDefinitions = [
  { id: 'hp', short: 'PS', long: 'Punti Salute' },
  { id: 'attack', short: 'Att', long: 'Attacco' },
  { id: 'defense', short: 'Dif', long: 'Difesa' },
  { id: 'special-attack', short: 'Att Sp', long: 'Attacco Speciale' },
  { id: 'special-defense', short: 'Dif Sp', long: 'Difesa Speciale' },
  { id: 'speed', short: 'Vel', long: 'Velocità' },
]

export default function BaseStats({ stats, loading }) {
  const byName = new Map((stats || []).map(({ stat, base_stat: value }) => [stat.name, value]))
  const values = statDefinitions.map(({ id, short, long }) => ({
    id,
    short,
    long,
    value: byName.get(id),
  }))
  const available = values.every(({ value }) => Number.isFinite(value))
  const total = available ? values.reduce((sum, { value }) => sum + value, 0) : null

  return (
    <section className="base-stats" aria-label="Statistiche base">
      <div className="base-stats-heading">
        <strong>Statistiche base</strong>
        {available && <span className="base-stats-total" title="Totale delle statistiche base">BST {total}</span>}
      </div>
      {available ? (
        <div className="stat-rows">
          {values.map(({ id, short, long, value }) => (
            <div key={id} className="stat-row" title={long + ': ' + value}>
              <span className="stat-label">{short}</span>
              <span className="stat-track" aria-hidden="true">
                <span
                  className={'stat-fill stat-fill-' + id}
                  style={{ width: Math.min(100, Math.max(0, value / 255 * 100)) + '%' }}
                />
              </span>
              <span className="stat-number">{value}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="stat-placeholder">{loading ? 'Caricamento statistiche…' : 'Statistiche non disponibili'}</p>
      )}
    </section>
  )
}
