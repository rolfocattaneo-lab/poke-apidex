import test from 'node:test'
import assert from 'node:assert/strict'
import {
  cleanFlavorText,
  getHistoricalSpriteOptions,
  getLatestItalianFlavor,
  getLatestAvailableFlavor,
  getVersionFlavor,
} from './historicalSprites.js'

// Fixture ridotte che rispecchiano le combinazioni lingua/versione
// effettivamente osservate su /pokemon-species/1/ e /pokemon-species/906/.
// Nessuna traduzione inventata: i testi servono solo a identificare le versioni.
function entry(version, language, flavorText) {
  return {
    version: { name: version },
    language: { name: language },
    flavor_text: flavorText,
  }
}

const bulbasaur = {
  flavor_text_entries: [
    entry('red', 'en', 'Red EN'),
    entry('x', 'en', 'X EN'),
    entry('x', 'it', 'X IT'),
    entry('y', 'en', 'Y EN'),
    entry('y', 'it', 'Y IT'),
    entry('sword', 'it', 'Sword IT'),
    entry('shield', 'it', 'Shield IT'),
  ],
}
const sprigatito = {
  flavor_text_entries: [
    entry('scarlet', 'en', 'Scarlet EN'),
    entry('violet', 'en', 'Violet EN'),
  ],
}

test('Pokémon X: viene scelta la traduzione italiana dello stesso gioco', () => {
  assert.equal(getVersionFlavor(bulbasaur, 'x')?.flavor_text, 'X IT')
})

test('Pokémon Y: non riutilizza la descrizione di X', () => {
  assert.equal(getVersionFlavor(bulbasaur, 'y')?.flavor_text, 'Y IT')
})

test('Rosso: torna inglese se non esiste italiano per quel gioco', () => {
  assert.equal(getVersionFlavor(bulbasaur, 'red')?.flavor_text, 'Red EN')
})

test('Scarlatto: non ricicla una descrizione di altri giochi', () => {
  assert.equal(getVersionFlavor(bulbasaur, 'scarlet'), null)
})

test('Spada e Scudo: testi italiani diversi per ciascun gioco', () => {
  assert.equal(getVersionFlavor(bulbasaur, 'sword')?.flavor_text, 'Sword IT')
  assert.equal(getVersionFlavor(bulbasaur, 'shield')?.flavor_text, 'Shield IT')
})

test('Scarlatto e Violetto: inglese distinto se italiano non presente', () => {
  assert.equal(getVersionFlavor(sprigatito, 'scarlet')?.flavor_text, 'Scarlet EN')
  assert.equal(getVersionFlavor(sprigatito, 'violet')?.flavor_text, 'Violet EN')
})

test('Versione non presente: nessun testo e nessuna sostituzione arbitraria', () => {
  assert.equal(getVersionFlavor(sprigatito, 'x'), null)
  assert.equal(getVersionFlavor(null, 'x'), null)
})

test('Fallback senza sprite: ultima descrizione italiana della specie', () => {
  assert.equal(getLatestItalianFlavor(bulbasaur)?.flavor_text, 'Shield IT')
  assert.equal(getLatestItalianFlavor(sprigatito), null)
})

test('Forme prive di sprite: italiano prioritario, poi inglese disponibile', () => {
  assert.equal(getLatestAvailableFlavor(bulbasaur)?.flavor_text, 'Shield IT')
  assert.equal(getLatestAvailableFlavor(sprigatito)?.flavor_text, 'Violet EN')
  assert.equal(getLatestAvailableFlavor(null), null)
})

test('I separatori di riga del Pokédex vengono normalizzati', () => {
  assert.equal(cleanFlavorText('Prima riga\nSeconda\f  terza\t prova'), 'Prima riga Seconda terza prova')
})

test('Giochi diversi con lo stesso sprite mantengono versioni distinte', () => {
  const data = {
    sprites: {
      versions: {
        'generation-i': {
          'red-blue': { front_default: 'red-blue.png', front_shiny: null },
        },
        'generation-ix': {
          'scarlet-violet': { front_default: 'scarlet-violet.png', front_shiny: null },
        },
      },
    },
  }
  const options = getHistoricalSpriteOptions(data)
  assert.deepEqual(options.map(({ version }) => version), ['red', 'blue', 'scarlet', 'violet'])
  assert.equal(options[0].normal, options[1].normal)
  assert.equal(options[2].normal, options[3].normal)
})

test('Varianti senza sprite frontale non vengono proposte', () => {
  const options = getHistoricalSpriteOptions({
    sprites: { versions: { 'generation-viii': { icons: { front_default: 'icon.png' } } } },
  })
  assert.deepEqual(options, [])
})
