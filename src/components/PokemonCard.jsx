import React from 'react'
import BookmarkButton from './BookmarkButton'

const PokemonCard = React.memo(function PokemonCard({ pokemon }) {
  return (
    <div className="flex flex-col items-center gap-3 p-6 bg-gray-800 rounded-xl border border-gray-700 w-56">
      {pokemon.sprite && (
        <img src={pokemon.sprite} alt={pokemon.name} className="w-28 h-28 object-contain" />
      )}
      <p className="capitalize text-lg font-semibold">{pokemon.name}</p>
      <span className="px-2 py-1 bg-gray-700 rounded text-xs uppercase tracking-wider text-cyan-300">
        {pokemon.type}
      </span>
      <BookmarkButton pokemonId={pokemon.id} />
    </div>
  )
})

export default PokemonCard
