import { useState, useEffect } from 'react'
import usePokeStore from '../store/usePokeStore'
import PokemonCard from './PokemonCard'

const WARP_COST = 160

export default function Banner() {
  const jade = usePokeStore((s) => s.jade)
  const pokemonCache = usePokeStore((s) => s.pokemonCache)
  const spendJade = usePokeStore((s) => s.spendJade)
  const addPokemon = usePokeStore((s) => s.addPokemon)
  const cacheResult = usePokeStore((s) => s.cacheResult)

  const [isWarping, setIsWarping] = useState(false)
  const [pulled, setPulled] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isWarping) return

    const id = Math.floor(Math.random() * 151) + 1
    const controller = new AbortController()

    // Cache check — no network request if already fetched
    const cached = pokemonCache[id]
    if (cached) {
      setPulled(cached)
      addPokemon(cached)
      setIsWarping(false)
      return
    }

    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const pokemon = {
          id,
          name: data.name,
          type: data.types[0].type.name,
          sprite: data.sprites.other['official-artwork'].front_default,
        }
        cacheResult(id, pokemon)
        addPokemon(pokemon)
        setPulled(pokemon)
        setIsWarping(false)
      })
      .catch((err) => {
        if (err.name === 'AbortError') return
        setError('Warp failed. Try again.')
        setIsWarping(false)
      })

    return () => controller.abort()
  }, [isWarping])

  function handleWarp() {
    if (jade < WARP_COST) return
    spendJade(WARP_COST)
    setError(null)
    setIsWarping(true)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <h1 className="text-3xl font-bold text-cyan-400">Warp Terminal</h1>

      <button
        onClick={handleWarp}
        disabled={isWarping || jade < WARP_COST}
        className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 
                   disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
      >
        {isWarping ? 'Warping...' : `Warp (${WARP_COST} jade)`}
      </button>

      {jade < WARP_COST && (
        <p className="text-red-400 text-sm">Not enough jade. Visit the shop.</p>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {pulled && <PokemonCard pokemon={pulled} />}
    </div>
  )
}
