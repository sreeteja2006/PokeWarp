import usePokeStore from '../store/usePokeStore'

// Simulates a slow/failing server call
function saveBookmarkToServer(id, shouldFail = false) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error('Server error'))
      else resolve()
    }, 800)
  })
}

export default function BookmarkButton({ pokemonId }) {
  const bookmarks = usePokeStore((s) => s.bookmarks)
  const addBookmark = usePokeStore((s) => s.addBookmark)
  const removeBookmark = usePokeStore((s) => s.removeBookmark)

  const isBookmarked = bookmarks.includes(pokemonId)

  // For demo purposes — toggle this to show failure + revert
  const simulateFailure = false

  async function handleToggle() {
    // Optimistic update — change UI immediately
    if (isBookmarked) {
      removeBookmark(pokemonId)
    } else {
      addBookmark(pokemonId)
    }

    try {
      await saveBookmarkToServer(pokemonId, simulateFailure)
    } catch {
      // Revert on failure
      if (isBookmarked) {
        addBookmark(pokemonId)
      } else {
        removeBookmark(pokemonId)
      }
      alert('Failed to save bookmark. Reverted.')
    }
  }

  return (
    <button
      onClick={handleToggle}
      className="text-xl transition-transform hover:scale-110"
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
    >
      {isBookmarked ? '⭐' : '☆'}
    </button>
  )
}
