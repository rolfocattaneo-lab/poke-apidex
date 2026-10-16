import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanAbilityText, getAbilityDescription } from './abilityDescriptions.js'

const game = (language, flavor, group = 'scarlet-violet') => ({
  language: { name: language },
  flavor_text: flavor,
  version_group: { name: group },
})
const effect = (language, shortEffect, fullEffect = '') => ({
  language: { name: language },
  short_effect: shortEffect,
  effect: fullEffect,
})

test('L’italiano di gioco viene preferito all’inglese tecnico', () => {
  const data = {
    flavor_text_entries: [
      game('en', 'English game text'),
      game('it', 'Testo italiano'),
    ],
    effect_entries: [effect('en', 'Detailed English effect')],
  }
  assert.deepEqual(getAbilityDescription(data), {
    text: 'Testo italiano',
    language: 'it',
    source: 'game',
    versionGroup: 'scarlet-violet',
  })
})

test('Fra le descrizioni italiane viene scelta l’ultima non vuota', () => {
  const result = getAbilityDescription({
    flavor_text_entries: [
      game('it', 'Prima', 'x-y'),
      game('it', 'Seconda', 'sword-shield'),
      game('it', '   ', 'scarlet-violet'),
    ],
  })
  assert.equal(result?.text, 'Seconda')
  assert.equal(result?.versionGroup, 'sword-shield')
})

test('Se il testo di gioco italiano manca, si usa l’effetto breve italiano', () => {
  const result = getAbilityDescription({
    flavor_text_entries: [game('en', 'English game text')],
    effect_entries: [effect('it', 'Effetto breve italiano')],
  })
  assert.equal(result?.text, 'Effetto breve italiano')
  assert.equal(result?.source, 'effect')
  assert.equal(result?.language, 'it')
})

test('Se manca l’effetto breve italiano, si usa quello esteso italiano', () => {
  const result = getAbilityDescription({
    effect_entries: [effect('it', '', 'Spiegazione italiana estesa')],
  })
  assert.equal(result?.text, 'Spiegazione italiana estesa')
})

test('Il ripiego inglese usa prima la descrizione di gioco', () => {
  const result = getAbilityDescription({
    flavor_text_entries: [game('en', 'English flavor')],
    effect_entries: [effect('en', 'English mechanic')],
  })
  assert.equal(result?.text, 'English flavor')
  assert.equal(result?.language, 'en')
  assert.equal(result?.source, 'game')
})

test('Senza descrizione di gioco, si usa l’effetto sintetico inglese', () => {
  const result = getAbilityDescription({
    effect_entries: [effect('en', 'English summary', 'English full effect')],
  })
  assert.equal(result?.text, 'English summary')
  assert.equal(result?.source, 'effect')
})

test('Il testo tecnico inglese completo è usato se quello breve manca', () => {
  const result = getAbilityDescription({
    effect_entries: [effect('en', null, 'Long English effect')],
  })
  assert.equal(result?.text, 'Long English effect')
})

test('Si ripuliscono a capo, spazi e riferimenti tecnici PokéAPI', () => {
  assert.equal(
    cleanAbilityText('The target may [flinch]{mechanic:flinch}.\n   More  text\fhere.'),
    'The target may flinch. More text here.',
  )
  assert.equal(cleanAbilityText(null), '')
})

test('Nessun testo disponibile: risultato nullo, senza inventare descrizioni', () => {
  assert.equal(getAbilityDescription({ names: [{ name: 'Ability' }] }), null)
  assert.equal(getAbilityDescription(null), null)
  assert.equal(getAbilityDescription({ flavor_text_entries: [game('ja', '日本語')] }), null)
})
