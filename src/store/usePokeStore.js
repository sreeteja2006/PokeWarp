import { create } from 'zustand'

const usePokeStore = create((set) => ({
  jade: 1600,
  inventory: [],
  bookmarks: [],
  pokemonCache: {},

  spendJade: (amount) =>
    set((state) => ({ jade: state.jade - amount })),

  addJade: (amount) =>
    set((state) => ({ jade: state.jade + amount })),

  addPokemon: (pokemon) =>
    set((state) => ({ inventory: [...state.inventory, pokemon] })),

  addBookmark: (id) =>
    set((state) => ({ bookmarks: [...state.bookmarks, id] })),

  removeBookmark: (id) =>
    set((state) => ({ bookmarks: state.bookmarks.filter((b) => b !== id) })),

  cacheResult: (id, data) =>
    set((state) => ({
      pokemonCache: { ...state.pokemonCache, [id]: data },
    })),
}))

export default usePokeStore
