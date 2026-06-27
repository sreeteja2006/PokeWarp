import usePokeStore from '../store/usePokeStore'

const PACKAGES = [
  { amount: 1600, price: '$0.99', label: 'Starter' },
  { amount: 8000, price: '$4.99', label: 'Explorer' },
  { amount: 20000, price: '$9.99', label: 'Master' },
]

export default function ShopPage() {
  const jade = usePokeStore((s) => s.jade)
  const addJade = usePokeStore((s) => s.addJade)

  return (
    <div className="max-w-xl mx-auto px-6 py-10">
      <h2 className="text-2xl font-bold text-cyan-400 mb-2">Shop</h2>
      <p className="text-gray-400 mb-8">Current balance: {jade} jade</p>

      <div className="flex flex-col gap-4">
        {PACKAGES.map((pkg) => (
          <div
            key={pkg.amount}
            className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700"
          >
            <div>
              <p className="font-semibold">{pkg.label}</p>
              <p className="text-cyan-300 text-sm">{pkg.amount.toLocaleString()} jade</p>
            </div>
            <button
              onClick={() => addJade(pkg.amount)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-semibold transition-colors"
            >
              {pkg.price}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
