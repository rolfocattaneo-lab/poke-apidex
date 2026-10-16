// Sprite storici già presenti nella risposta /pokemon di PokéAPI.
// Non deduciamo immagini dal numero nazionale: una forma può non avere sprite
// per una generazione o per una versione specifica.
const GENERATIONS = {
  'generation-i': 'Generazione I',
  'generation-ii': 'Generazione II',
  'generation-iii': 'Generazione III',
  'generation-iv': 'Generazione IV',
  'generation-v': 'Generazione V',
  'generation-vi': 'Generazione VI',
  'generation-vii': 'Generazione VII',
  'generation-viii': 'Generazione VIII',
  'generation-ix': 'Generazione IX',
}

const GAMES = {
  'red-blue': 'Rosso / Blu',
  'red-green-japan': 'Rosso / Verde (Giappone)',
  yellow: 'Giallo',
  gold: 'Oro',
  silver: 'Argento',
  crystal: 'Cristallo',
  'ruby-sapphire': 'Rubino / Zaffiro',
  emerald: 'Smeraldo',
  'firered-leafgreen': 'Rosso Fuoco / Verde Foglia',
  'diamond-pearl': 'Diamante / Perla',
  platinum: 'Platino',
  'heartgold-soulsilver': 'Oro HeartGold / Argento SoulSilver',
  'black-white': 'Nero / Bianco',
  'x-y': 'X / Y',
  'omegaruby-alphasapphire': 'Rubino Omega / Zaffiro Alpha',
  'ultra-sun-ultra-moon': 'Ultrasole / Ultraluna',
  'lets-go-pikachu-lets-go-eevee': "Let's Go Pikachu / Eevee",
  'brilliant-diamond-shining-pearl': 'Diamante Lucente / Perla Splendente',
  'scarlet-violet': 'Scarlatto / Violetto',
  champions: 'Champions',
}

function fallbackName(name) {
  return name.split('-').map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1),
  ).join(' ')
}

function generationOrder(key) {
  const numeral = key.split('-').at(-1)
  const values = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9 }
  return values[numeral] ?? 99
}

export function getHistoricalSpriteOptions(details) {
  const versions = details?.sprites?.versions
  if (!versions || typeof versions !== 'object') return []

  const options = []

  for (const [generation, games] of Object.entries(versions)
    .sort(([a], [b]) => generationOrder(a) - generationOrder(b))) {
    if (!games || typeof games !== 'object') continue

    for (const [game, sprites] of Object.entries(games)) {
      // Le icone del box/menu non sono sprite frontali da mostrare come artwork.
      if (game === 'icons' || !sprites || typeof sprites !== 'object') continue

      const generationLabel = GENERATIONS[generation] || fallbackName(generation)
      const gameLabel = GAMES[game] || fallbackName(game)
      const baseKey = generation + '/' + game
      const pixelated = generationOrder(generation) <= 5

      if (sprites.front_default) {
        options.push({
          key: baseKey,
          generation,
          generationLabel,
          label: gameLabel,
          normal: sprites.front_default,
          shiny: sprites.front_shiny || null,
          pixelated,
        })
      }

      // PokéAPI offre sprite animati per alcune versioni (ad es. Nero/Bianco).
      // Sono un'opzione distinta: niente sostituzioni invisibili dell'immagine.
      if (sprites.animated?.front_default) {
        options.push({
          key: baseKey + '/animated',
          generation,
          generationLabel,
          label: gameLabel + ' · animato',
          normal: sprites.animated.front_default,
          shiny: sprites.animated.front_shiny || null,
          pixelated,
        })
      }
    }
  }

  return options
}
