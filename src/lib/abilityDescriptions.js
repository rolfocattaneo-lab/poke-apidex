// La risorsa /ability di PokéAPI separa i testi brevi presenti nei giochi
// (flavor_text_entries) dalle spiegazioni tecniche (effect_entries).
// Preferiamo sempre il testo italiano; l'inglese è soltanto un ripiego.
function lastEntryWithText(entries, language, field) {
  if (!Array.isArray(entries)) return null

  return entries.filter((entry) =>
    entry.language?.name === language
    && typeof entry[field] === 'string'
    && entry[field].trim().length > 0,
  ).at(-1) || null
}

export function cleanAbilityText(value) {
  if (typeof value !== 'string') return ''

  // Le spiegazioni tecniche usano riferimenti come [flinch]{mechanic:flinch}.
  return value
    .replace(/\[([^\]]+)\]\{[^}]*\}/g, '$1')
    .replace(/[\f\n\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function getAbilityDescription(data) {
  if (!data) return null

  const choices = [
    { entries: data.flavor_text_entries, language: 'it', field: 'flavor_text', source: 'game' },
    { entries: data.effect_entries, language: 'it', field: 'short_effect', source: 'effect' },
    { entries: data.effect_entries, language: 'it', field: 'effect', source: 'effect' },
    { entries: data.flavor_text_entries, language: 'en', field: 'flavor_text', source: 'game' },
    { entries: data.effect_entries, language: 'en', field: 'short_effect', source: 'effect' },
    { entries: data.effect_entries, language: 'en', field: 'effect', source: 'effect' },
  ]

  for (const { entries, language, field, source } of choices) {
    const entry = lastEntryWithText(entries, language, field)
    if (!entry) continue

    const text = cleanAbilityText(entry[field])
    if (text) {
      return {
        text,
        language,
        source,
        versionGroup: source === 'game' ? entry.version_group?.name || null : null,
      }
    }
  }

  return null
}
