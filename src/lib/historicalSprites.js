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

// Gli sprite PokéAPI sono spesso condivisi fra due giochi, mentre le
// descrizioni Pokédex sono collegate alle singole versioni.
const GAME_VERSIONS = {
  'red-blue': [['red', 'Rosso'], ['blue', 'Blu']],
  'red-green-japan': [['red', 'Rosso (Giappone)'], ['green', 'Verde (Giappone)']],
  yellow: [['yellow', 'Giallo']],
  gold: [['gold', 'Oro']],
  silver: [['silver', 'Argento']],
  crystal: [['crystal', 'Cristallo']],
  'ruby-sapphire': [['ruby', 'Rubino'], ['sapphire', 'Zaffiro']],
  emerald: [['emerald', 'Smeraldo']],
  'firered-leafgreen': [['firered', 'Rosso Fuoco'], ['leafgreen', 'Verde Foglia']],
  'diamond-pearl': [['diamond', 'Diamante'], ['pearl', 'Perla']],
  platinum: [['platinum', 'Platino']],
  'heartgold-soulsilver': [['heartgold', 'Oro HeartGold'], ['soulsilver', 'Argento SoulSilver']],
  'black-white': [['black', 'Nero'], ['white', 'Bianco']],
  'x-y': [['x', 'X'], ['y', 'Y']],
  'omegaruby-alphasapphire': [['omega-ruby', 'Rubino Omega'], ['alpha-sapphire', 'Zaffiro Alpha']],
  'ultra-sun-ultra-moon': [['ultra-sun', 'Ultrasole'], ['ultra-moon', 'Ultraluna']],
  'lets-go-pikachu-lets-go-eevee': [['lets-go-pikachu', "Let's Go Pikachu"], ['lets-go-eevee', "Let's Go Eevee"]],
  'brilliant-diamond-shining-pearl': [['brilliant-diamond', 'Diamante Lucente'], ['shining-pearl', 'Perla Splendente']],
  'scarlet-violet': [['scarlet', 'Scarlatto'], ['violet', 'Violetto']],
}

export function getVersionFlavor(species, version) {
  if (!version || !Array.isArray(species?.flavor_text_entries)) return null
  const entries = species.flavor_text_entries.filter(
    (entry) => entry.version?.name === version,
  )
  // Niente descrizioni prese da giochi diversi: priorità all'italiano,
  // altrimenti al testo originale inglese soltanto per lo stesso gioco.
  return entries.find((entry) => entry.language?.name === 'it')
    || entries.find((entry) => entry.language?.name === 'en')
    || null
}

export function getLatestItalianFlavor(species) {
  return species?.flavor_text_entries
    ?.filter((entry) => entry.language?.name === 'it')
    .at(-1) || null
}

export function cleanFlavorText(value) {
  return value.replace(/[\\f\\n\\r\\t]+/g, ' ').replace(/\\s+/g, ' ').trim()
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
      const pixelated = generationOrder(generation) <= 5
      const versions = GAME_VERSIONS[game] || [[game, gameLabel]]

      for (const [version, versionLabel] of versions) {
        const key = generation + '/' + game + '/' + version
        if (sprites.front_default) {
          options.push({
            key,
            generation,
            generationLabel,
            label: versionLabel,
            spriteGroup: gameLabel,
            version,
            normal: sprites.front_default,
            shiny: sprites.front_shiny || null,
            pixelated,
          })
        }

        if (sprites.animated?.front_default) {
          options.push({
            key: key + '/animated',
            generation,
            generationLabel,
            label: versionLabel + ' · animato',
            spriteGroup: gameLabel,
            version,
            normal: sprites.animated.front_default,
            shiny: sprites.animated.front_shiny || null,
            pixelated,
          })
        }
      }
    }
  }

  return options
}
