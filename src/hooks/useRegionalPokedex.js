import { useEffect, useMemo, useState } from 'react'
import { getRegions, getRegionGames, getRegionalPokedexEntries } from '../lib/regional.js'

export function useRegionalPokedex() {
  const [regions, setRegions] = useState([])
  const [regionsError, setRegionsError] = useState('')
  const [regionsRetry, setRegionsRetry] = useState(0)
  const [region, setRegion] = useState('national')
  const [regionGames, setRegionGames] = useState([])
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [optionsError, setOptionsError] = useState('')
  const [optionsRetry, setOptionsRetry] = useState(0)
  const [generation, setGeneration] = useState('')
  const [game, setGame] = useState('')
  const [entries, setEntries] = useState(null)
  const [entriesLoading, setEntriesLoading] = useState(false)
  const [entriesError, setEntriesError] = useState('')
  const [entriesRetry, setEntriesRetry] = useState(0)

  useEffect(() => {
    let active = true
    getRegions()
      .then((data) => { if (active) { setRegions(data); setRegionsError('') } })
      .catch(() => { if (active) setRegionsError('Elenco regioni non disponibile.') })
    return () => { active = false }
  }, [regionsRetry])

  useEffect(() => {
    if (region === 'national') return undefined
    let active = true

    getRegionGames(region)
      .then((data) => {
        if (!active) return
        setRegionGames(data)
        setOptionsError('')
        // Seleziona automaticamente la prima generazione e il primo gioco disponibili.
        // L'ordine viene stabilito dai dati PokéAPI.
        const firstGame = data[0]
        setGeneration(firstGame?.generation || '')
        setGame(firstGame?.name || '')
        setEntries(null)
        setEntriesError('')
        setEntriesLoading(Boolean(firstGame))
      })
      .catch(() => { if (active) setOptionsError('Non riesco a caricare i giochi di questa regione.') })
      .finally(() => { if (active) setOptionsLoading(false) })

    return () => { active = false }
  }, [region, optionsRetry])

  const generations = useMemo(
    () => [...new Set(regionGames.map(({ generation: name }) => name))],
    [regionGames],
  )
  const games = regionGames.filter((item) => item.generation === generation)
  const selectedGame = games.find((item) => item.name === game)

  useEffect(() => {
    if (region === 'national' || !selectedGame) return undefined
    let active = true

    getRegionalPokedexEntries(selectedGame.pokedexes)
      .then((data) => { if (active) { setEntries(data); setEntriesError('') } })
      .catch(() => { if (active) setEntriesError('Non riesco a caricare il Pokédex di questo gioco.') })
      .finally(() => { if (active) setEntriesLoading(false) })

    return () => { active = false }
  }, [region, selectedGame, entriesRetry])

  function selectRegion(value) {
    setRegion(value)
    setRegionGames([])
    setOptionsLoading(value !== 'national')
    setOptionsError('')
    setGeneration('')
    setGame('')
    setEntries(null)
    setEntriesError('')
    setEntriesLoading(false)
  }

  function selectGeneration(value) {
    // Quando la generazione cambia, proponi il primo gioco disponibile.
    const firstGame = regionGames.find((item) => item.generation === value)
    setGeneration(value)
    setGame(firstGame?.name || '')
    setEntries(null)
    setEntriesError('')
    setEntriesLoading(Boolean(firstGame))
  }

  function selectGame(value) {
    setGame(value)
    setEntries(null)
    setEntriesError('')
    setEntriesLoading(Boolean(value))
  }

  function retryRegions() {
    setRegionsError('')
    setRegionsRetry((value) => value + 1)
  }

  function retryOptions() {
    setOptionsError('')
    setOptionsLoading(true)
    setOptionsRetry((value) => value + 1)
  }

  function retryEntries() {
    setEntriesError('')
    setEntriesLoading(true)
    setEntriesRetry((value) => value + 1)
  }

  return {
    region, regions, regionsError, selectRegion, retryRegions,
    generation, generations, selectGeneration,
    game, games, selectGame, selectedGame,
    optionsLoading, optionsError, retryOptions, hasGames: regionGames.length > 0,
    entries, entriesLoading, entriesError, retryEntries,
    loading: optionsLoading || entriesLoading,
    ready: region === 'national' || Boolean(selectedGame && entries),
  }
}
