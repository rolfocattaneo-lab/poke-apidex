import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateTypeEffectiveness } from './typeEffectiveness.js'

function relations(double = [], half = [], none = []) {
  const entries = (names) => names.map((name) => ({ name }))
  return {
    double_damage_from: entries(double),
    half_damage_from: entries(half),
    no_damage_from: entries(none),
  }
}

function multiplier(results, attackingType) {
  return results.find(({ type }) => type === attackingType)?.multiplier
}

const fire = relations(
  ['water', 'ground', 'rock'],
  ['fire', 'grass', 'ice', 'bug', 'steel', 'fairy'],
)
const flying = relations(
  ['electric', 'ice', 'rock'],
  ['grass', 'fighting', 'bug'],
  ['ground'],
)
const grass = relations(
  ['fire', 'ice', 'poison', 'flying', 'bug'],
  ['water', 'electric', 'grass', 'ground'],
)
const poison = relations(
  ['ground', 'psychic'],
  ['grass', 'fighting', 'poison', 'bug', 'fairy'],
)
const steel = relations(
  ['fire', 'fighting', 'ground'],
  ['normal', 'grass', 'ice', 'flying', 'psychic', 'bug', 'rock', 'dragon', 'steel', 'fairy'],
  ['poison'],
)
const fairy = relations(
  ['poison', 'steel'],
  ['fighting', 'bug', 'dark'],
  ['dragon'],
)

test('Charizard (Fuoco/Volante): Roccia ×4 e Terra ×0, anche se Fuoco è debole a Terra', () => {
  const result = calculateTypeEffectiveness(['fire', 'flying'], { fire, flying })
  assert.equal(multiplier(result, 'rock'), 4)
  assert.equal(multiplier(result, 'ground'), 0)
})

test('Charizard: Erba e Coleottero ×0,25; Ghiaccio neutro ×1', () => {
  const result = calculateTypeEffectiveness(['fire', 'flying'], { fire, flying })
  assert.equal(multiplier(result, 'grass'), 0.25)
  assert.equal(multiplier(result, 'bug'), 0.25)
  assert.equal(multiplier(result, 'ice'), 1)
  assert.equal(multiplier(result, 'electric'), 2)
})

test('Bulbasaur (Erba/Veleno): Erba ×0,25 e Terra neutro ×1', () => {
  const result = calculateTypeEffectiveness(['grass', 'poison'], { grass, poison })
  assert.equal(multiplier(result, 'grass'), 0.25)
  assert.equal(multiplier(result, 'ground'), 1)
  assert.equal(multiplier(result, 'water'), 0.5)
  assert.equal(multiplier(result, 'psychic'), 2)
})

test('Acciaio/Folletto: immunità Drago e Veleno prevalgono sugli altri tipi', () => {
  const result = calculateTypeEffectiveness(['steel', 'fairy'], { steel, fairy })
  assert.equal(multiplier(result, 'dragon'), 0)
  assert.equal(multiplier(result, 'poison'), 0)
  assert.equal(multiplier(result, 'fighting'), 1)
  assert.equal(multiplier(result, 'bug'), 0.25)
})

test('Tipo Normale: debolezza Lotta ×2 e immunità Spettro ×0', () => {
  const normal = relations(['fighting'], [], ['ghost'])
  const result = calculateTypeEffectiveness(['normal'], { normal })
  assert.equal(multiplier(result, 'fighting'), 2)
  assert.equal(multiplier(result, 'ghost'), 0)
  assert.equal(multiplier(result, 'fire'), 1)
})

test('Vengono calcolati tutti e soli i 18 tipi standard, senza duplicati', () => {
  const result = calculateTypeEffectiveness(['fire', 'fire'], { fire })
  assert.equal(result.length, 18)
  assert.equal(new Set(result.map(({ type }) => type)).size, 18)
  assert.equal(multiplier(result, 'water'), 2)
})

test('Tipi difensivi mancanti o relazioni incomplete non producono falsi risultati', () => {
  assert.deepEqual(calculateTypeEffectiveness([], {}), [])
  assert.throws(() => calculateTypeEffectiveness(['fire'], {}), /incomplete/)
  assert.throws(() => calculateTypeEffectiveness(['fire'], {
    fire: { double_damage_from: [] },
  }), /incomplete/)
})
