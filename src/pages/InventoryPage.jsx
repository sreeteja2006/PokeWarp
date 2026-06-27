import usePokeStore from '../store/usePokeStore'
import PokemonCard from '../components/PokemonCard'

export default function InventoryPage() {
  const inventory = usePokeStore((s) => s.inventory)

  // Derived state — never stored separately
  const inventoryCount = inventory.length
  const typeGroups = inventory.reduce((acc, p) => {
    acc[p.type] = (acc[p.type] || 0) + 1
    return acc
  }, {})

  if (inventoryCount === 0) {
    return (
      <div className="flex flex-col items-center py-20 gap-4 text-gray-500">
        <p className="text-2xl">No Pokémon yet</p>
        <p>Go to the Warp terminal to pull some.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-cyan-400">Inventory</h2>
        <span className="text-gray-400">{inventoryCount} pulled</span>
      </div>

      {/* Type breakdown — fully derived */}
      <div className="flex gap-2 flex-wrap mb-8">
        {Object.entries(typeGroups).map(([type, count]) => (
          <span key={type} className="px-3 py-1 bg-gray-800 rounded-full text-sm text-cyan-300">
            {type} × {count}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {inventory.map((pokemon, index) => (
          // Note: using index as key here is okay because inventory is append-only
          // If you ever allow deletion or reordering, switch to pokemon.id + timestamp
          <PokemonCard key={`${pokemon.id}-${index}`} pokemon={pokemon} />
        ))}
      </div>
    </div>
  )
}
