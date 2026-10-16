import { pokemonTypes } from './types.js'

// Moltiplicatori DIFENSIVI delle mosse ricevute (non il danno inflitto).
// I dati /type di PokéAPI descrivono i rapporti dalla prospettiva del difensore.
function attacksFrom(list, attackingType) {
  return list.some(({ name }) => name === attackingType)
}

export function calculateTypeEffectiveness(defendingTypes, relationsByType) {
  const uniqueTypes = [...new Set(defendingTypes)]
  if (!uniqueTypes.length) return []

  for (const type of uniqueTypes) {
    const relations = relationsByType[type]
    if (!relations
      || !Array.isArray(relations.double_damage_from)
      || !Array.isArray(relations.half_damage_from)
      || !Array.isArray(relations.no_damage_from)) {
      throw new Error('Relazioni difensive incomplete per il tipo ' + type)
    }
  }

  return pokemonTypes.map(({ id, label }) => {
    const multiplier = uniqueTypes.reduce((total, defendingType) => {
      const relations = relationsByType[defendingType]

      // Un'immunità prevale sempre, anche su una debolezza dell'altro tipo.
      if (attacksFrom(relations.no_damage_from, id)) return 0
      if (attacksFrom(relations.double_damage_from, id)) return total * 2
      if (attacksFrom(relations.half_damage_from, id)) return total / 2
      return total
    }, 1)

    return { type: id, label, multiplier }
  })
}
