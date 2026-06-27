# PokeWarp — React Deep Dive
## Complete Session Document

---

# MASTER TIMELINE

```
00:00  Cold open — VS Code, blank app, set the stage        5 min
00:05  Block 1 — React rendering model                     20 min
         slides 1–3 (15 min)
         Excalidraw #1 (5 min)
00:25  Block 2 — Routing                                   15 min
         slides 4–5 (10 min)
         live code: wire up BrowserRouter + 3 routes (5 min)
00:40  Block 3 — State management: local vs global         20 min
         slides 6–8 (10 min)
         Excalidraw #2 (5 min)
         live code: usePokeStore.js (5 min)
01:00  Block 4 — Lifecycle and useEffect                   20 min
         slides 9–11 (10 min)
         live code: warp fetch (10 min)
01:20  ── BREAK ──                                          5 min
01:25  Block 5 — Smart state                               25 min
         slides 12–15 (12 min)
         live code: cache + optimistic update (13 min)
01:50  Block 6 — Rendering performance                     10 min
         slides 16–17 (5 min)
         Excalidraw #3 (5 min)
02:00  Block 7 — Wrap up                                    5 min
         slide 18
02:05  END (5 min buffer built in)
```

---

# COLD OPEN (00:00, 5 min)
*No slides. VS Code only.*

Open a fresh Vite + React project. Delete App.css. Open App.jsx and strip it to:

```jsx
export default function App() {
  return <div>PokeWarp</div>
}
```

**Say:**
Open your laptops and do exactly what I'm doing. Vite, React, blank slate. We are building a Pokémon gacha game today from scratch. By the end of this session you will understand why every single architectural decision in this app is made the way it is. Not just what to write. Why.

The app has three screens. A warp terminal where you spend jade currency to pull a random Pokémon. An inventory where you see everything you've pulled. A shop where you buy more currency. Simple idea. But building it correctly forces you to understand how React actually works under the hood.

Let's go.

---

# BLOCK 1 — REACT RENDERING MODEL
## 00:05, 20 min total (15 min slides + 5 min Excalidraw)

---

## SLIDE 1 — What is a render?

**Title:** What actually happens when React "renders"

**Content:**

A render is just a function call.

```jsx
function Banner({ username }) {
  return (
    <div>
      <h1>{username}</h1>
      <button>Warp</button>
    </div>
  )
}
```

React calls Banner(). It gets back JSX. JSX is not HTML — it is a JavaScript object describing what the UI should look like. That object goes into a process called reconciliation.

React does NOT write to the real DOM every render. It compares the new object to the previous one, finds what changed, and writes only the minimum.

**Key point to put on slide:**
- Render = function call = returns a description of UI
- React keeps a Virtual DOM (lightweight JS copy of the real DOM)
- On each render: diff old VDOM vs new VDOM, write only what changed
- This engine is called the Reconciler

---

## SLIDE 2 — What triggers a render?

**Title:** Three things that cause a component to re-render

**Content:**

```
1. Its own state changes       setCount(5) → Banner re-renders
2. Its props change            parent passes new value → child re-renders
3. Its parent re-renders       even if props didn't change
```

Number 3 is the one that surprises people.

```jsx
function App() {
  const [tick, setTick] = useState(0)
  return (
    <>
      <Banner />        {/* re-renders every time tick changes */}
      <Inventory />     {/* re-renders every time tick changes */}
      <Shop />          {/* re-renders every time tick changes */}
    </>
  )
}
```

If App re-renders, everything inside App re-renders. Even if Banner received no props and nothing about it changed.

**Key point to put on slide:**
- State change in a parent cascades down to all children
- This is called the render cascade
- Most of the time this is fine — renders are cheap
- It becomes a problem only when children are expensive (Block 5)

---

## SLIDE 3 — The VDOM diff in action

**Title:** React only touches what changed

**Content:**

Before state change:
```
App
└── Banner
    ├── CurrencyDisplay  "1600"
    └── WarpButton
```

After setJade(1440):
```
App
└── Banner
    ├── CurrencyDisplay  "1440"   ← VDOM says this changed
    └── WarpButton                ← VDOM says this is identical
```

React writes exactly one DOM mutation: update the text node inside CurrencyDisplay.

WarpButton is not touched. App is not touched. Nothing else is touched.

**Key point to put on slide:**
- VDOM diff finds the minimum change set
- Real DOM mutations are expensive — React minimizes them
- This is why you never manually querySelector in React

---

## EXCALIDRAW #1 (5 min)
*Switch from slides to Excalidraw. Draw live while talking.*

### Step-by-step drawing instructions:

**Step 1.** Draw a rectangle in the center-top. Label it `App`. Say: this is the root of PokeWarp. Everything lives inside it.

**Step 2.** Draw three rectangles below App connected with lines going down. Label them `WarpPage`, `InventoryPage`, `ShopPage`. Say: React Router will swap between these. Only one is mounted at a time. We will get to that.

**Step 3.** Below WarpPage, draw two rectangles: `Banner` and `PokemonCard`. Connect them to WarpPage. Say: Banner holds the warp button and the currency display. PokemonCard shows the result of a warp.

**Step 4.** Inside Banner, draw two small boxes: `CurrencyDisplay` and `WarpButton`. Say: these are the leaf nodes. The lowest level.

**Step 5.** Now draw a lightning bolt icon on Banner. Say: imagine the user clicks Warp. Banner's state changes. Watch what re-renders.

**Step 6.** Shade Banner and its two children (CurrencyDisplay, WarpButton) in one color. Leave everything else unshaded. Say: only Banner and its children re-render. WarpPage does not re-render. App does not re-render. InventoryPage is not even mounted right now so it definitely does not re-render. This is the reconciler doing its job.

**Step 7.** Now draw a lightning bolt on App. Shade everything in the tree. Say: if something in App's state changes, everything re-renders. This is the cascade. This is what you want to avoid by being smart about where state lives.

**Say to close:** Keep this tree in your head. Every decision we make for the rest of the session is about controlling which parts of this tree re-render, and when.

---

# BLOCK 2 — ROUTING
## 00:25, 15 min total (10 min slides + 5 min live code)

---

## SLIDE 4 — The problem with multiple pages

**Title:** How do you show different screens without reloading the page?

**Content:**

PokeWarp has three screens. The naive approach: conditionally render them based on a variable.

```jsx
function App() {
  const [page, setPage] = useState('warp')

  if (page === 'warp')      return <WarpPage />
  if (page === 'inventory') return <InventoryPage />
  if (page === 'shop')      return <ShopPage />
}
```

This works but the URL never changes. The user cannot bookmark the inventory page. They cannot share a link to the shop. The browser back button does nothing. You have a multi-screen app that behaves like a single screen.

A traditional website solves this by loading a new HTML file from the server on every link click. The entire page reloads — JavaScript restarts, all state is lost, the screen flashes white.

React Router gives you the best of both: the URL changes and is bookmarkable, but the page never reloads. It intercepts navigation, reads the URL, and swaps the component. The JavaScript runtime keeps running. Zustand state survives navigation.

**Key point to put on slide:**
- URL should reflect what the user is looking at
- Traditional nav = full page reload = state lost
- React Router = URL changes + component swaps + no reload
- This model is called a Single Page Application (SPA)

---

## SLIDE 5 — React Router setup and usage

**Title:** BrowserRouter, Routes, Route, Link

**Content:**

Install: `npm install react-router-dom`

Wire it up in main.jsx — wrap the entire app:

```jsx
// main.jsx
import { BrowserRouter } from 'react-router-dom'
import App from './App'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

Define routes in App.jsx:

```jsx
// App.jsx
import { Routes, Route } from 'react-router-dom'

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<WarpPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/shop"      element={<ShopPage />} />
      </Routes>
    </>
  )
}
```

Navigate without reloading — use Link, not `<a href>`:

```jsx
import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav>
      <Link to="/">Warp</Link>
      <Link to="/inventory">Inventory</Link>
      <Link to="/shop">Shop</Link>
    </nav>
  )
}
```

Programmatic navigation (after a form submit or action):

```jsx
import { useNavigate } from 'react-router-dom'

function SomeComponent() {
  const navigate = useNavigate()
  function handleDone() {
    navigate('/inventory')   // push to history, no reload
  }
}
```

**Key point to put on slide:**
- BrowserRouter wraps main.jsx, not App.jsx
- Routes renders only the first Route that matches the current URL
- Link replaces anchor tags — never use `<a href>` for internal navigation
- Navbar sits outside Routes so it renders on every page
- useNavigate() for navigation triggered by code, not clicks

---

## LIVE CODE — Wire up routing (5 min)

**What to type, in order:**

```
1. npm install react-router-dom
2. Wrap <App /> in <BrowserRouter> inside main.jsx
3. Create three placeholder page components: WarpPage, InventoryPage, ShopPage
   (just a div with the page name for now)
4. Add Routes + Route in App.jsx
5. Create Navbar with three Link components
6. Run dev server, click between links, show URL changing in address bar
7. Open DevTools Network tab — show zero requests on navigation
```

**Say while doing step 7:**
Watch the network tab as I click between pages. Nothing. No requests. The server is not involved. React Router is reading the URL, matching it against the route definitions, and swapping the component. The HTML file loaded once. It will not load again for the lifetime of this session.

---

# BLOCK 3 — STATE MANAGEMENT
## 00:40, 20 min total (10 min slides + 5 min Excalidraw + 5 min live code)

---

## SLIDE 6 — Local state is not enough

**Title:** The problem: jade currency needs to be everywhere

**Content:**

In PokeWarp, jade currency is needed in:
- Banner — to check if you can afford a warp (160 jade)
- CurrencyDisplay — to show the current balance
- Shop — to add currency when you buy
- Navbar — to show the balance at all times

Where do you put it?

Option A: put it in Banner's local state with useState.

```jsx
function Banner() {
  const [jade, setJade] = useState(1600)
  // Shop can never see this. Navbar can never see this.
}
```

This fails immediately. Shop is on a completely different route. It cannot reach into Banner's state.

Option B: lift it to App, pass it down as props.

```jsx
function App() {
  const [jade, setJade] = useState(1600)
  return (
    <>
      <Navbar jade={jade} />
      <WarpPage jade={jade} setJade={setJade} />
      <Shop jade={jade} setJade={setJade} />
    </>
  )
}
```

This works but now every intermediate component carries jade as a prop even if it does not use it. Add 5 more shared pieces of state and App.jsx becomes unmanageable.

**Key point to put on slide:**
- Local state: fine for UI that only one component cares about (is the dropdown open, is this card flipped)
- Lifted state: fine for state shared between 2-3 nearby components
- Global state: needed when multiple unrelated components across routes need the same data

---

## SLIDE 7 — Prop drilling

**Title:** Prop drilling — the symptom, not the solution

**Content:**

```
App (owns jade)
└── WarpPage (receives jade, passes it down)
    └── Banner (receives jade, passes it down)
        └── CurrencyDisplay (finally uses jade)
```

WarpPage and Banner carry jade only to pass it. They do not use it. If you add a new layer between Banner and CurrencyDisplay, you add another prop to thread through.

This is prop drilling. It is not a bug. It works. But it makes refactoring painful and components harder to read because their prop signatures include things they don't actually care about.

**Key point to put on slide:**
- Prop drilling = passing data through layers that don't use it
- Components become coupled to data they don't own
- Adding/moving components requires updating the entire chain

---

## SLIDE 8 — Zustand

**Title:** Zustand — a store outside the React tree

**Content:**

Zustand creates a store that is a plain JavaScript object living outside of any component. Any component anywhere imports it and reads from it or writes to it directly. No threading. No prop chains.

```js
// src/store/usePokeStore.js
import { create } from 'zustand'

const usePokeStore = create((set) => ({
  jade: 1600,
  inventory: [],

  spendJade: (amount) =>
    set((state) => ({ jade: state.jade - amount })),

  addPokemon: (pokemon) =>
    set((state) => ({ inventory: [...state.inventory, pokemon] })),
}))

export default usePokeStore
```

Any component:
```jsx
function CurrencyDisplay() {
  const jade = usePokeStore((s) => s.jade)
  return <span>{jade} jade</span>
}

function Shop() {
  const spendJade = usePokeStore((s) => s.spendJade)
  // no prop needed. direct access.
}
```

**Key point to put on slide:**
- create() defines the initial state and the actions
- Actions call set() — Zustand's updater — always immutably
- Components subscribe with a selector: usePokeStore(s => s.jade)
- Selector = only re-render this component when jade changes, not when inventory changes

---

## EXCALIDRAW #2 (5 min)

### Step-by-step drawing instructions:

**Step 1.** On a fresh canvas, draw the same component tree from Excalidraw #1 but smaller, on the right side of the canvas: App, WarpPage, Banner, Shop.

**Step 2.** Now draw a large rectangle on the LEFT side of the canvas, clearly separated from the tree. Label it `Zustand Store`. Inside it, write three lines:
```
jade: 1600
inventory: []
spendJade: fn
```
Say: this box does not live inside the React tree. It is not a component. It is a plain JavaScript module.

**Step 3.** Draw an arrow from `CurrencyDisplay` (inside Banner) pointing LEFT to the store. Label the arrow `reads jade`. Say: CurrencyDisplay subscribes directly. No props involved.

**Step 4.** Draw an arrow from `Shop` pointing LEFT to the store. Label it `calls spendJade`. Say: Shop also reaches the store directly. Banner does not need to know Shop exists.

**Step 5.** Draw an arrow from `Navbar` (draw it as a small box at the top of the tree) pointing LEFT to the store. Label it `reads jade`.

**Step 6.** Now draw a lightning bolt on the store next to jade. Draw a dotted line from the store to each subscriber (CurrencyDisplay, Navbar). Say: when jade changes in the store, only the components that subscribed to jade re-render. Shop subscribed to spendJade, not jade, so Shop does not re-render. This is what a selector gives you.

**Say to close:** The store is the single source of truth. No component owns jade. The store owns jade. Components just read from it or write to it.

---

## LIVE CODE 1 — usePokeStore.js (5 min)

**What to type, in order:**

```
1. Create src/store/usePokeStore.js
2. npm install zustand (if not done)
3. Write the store exactly as shown in slide 6
4. Import and use jade in App.jsx temporarily to prove it works
5. Show the Zustand devtools in browser if installed
```

**Say while coding:**
Notice I am not wrapping anything in a Provider. Zustand does not need one. That is the entire point. You import, you use. The selector I pass to usePokeStore controls exactly which state changes cause this component to re-render.

---

# BLOCK 4 — LIFECYCLE AND useEffect
## 01:00, 20 min total (10 min slides + 10 min live code)

---

## SLIDE 7 — The three phases of a component

**Title:** Mount, Update, Unmount

**Content:**

Every React component goes through three phases:

```
MOUNT        Component appears in the tree for the first time.
             The DOM nodes are created. The screen updates.

UPDATE       State or props change.
             React re-renders. The DOM is patched minimally.
             This happens as many times as state changes.

UNMOUNT      Component is removed from the tree.
             For PokeWarp: navigating away from WarpPage.
             The DOM nodes are destroyed.
```

Why does this matter? Because some code needs to run at specific phases. Fetching a Pokémon should happen after mount. Cancelling a pending request should happen at unmount. useEffect is the hook that gives you access to these phases.

**Key point to put on slide:**
- Mount: run setup code (fetch, subscribe, start timers)
- Update: respond to specific value changes (re-fetch when ID changes)
- Unmount: run cleanup code (cancel requests, clear timers)

---

## SLIDE 8 — useEffect

**Title:** useEffect — code that runs outside the render

**Content:**

React's render function must be pure. Same input, same output, no side effects. Fetching data is a side effect. If you put a fetch inside the component body, it runs on every render, which updates state, which triggers a render, which runs the fetch again. Infinite loop.

useEffect runs after the render is committed to the DOM. React paints the screen first, then runs your effect.

```jsx
useEffect(() => {
  // this runs AFTER render
  // safe to fetch, safe to subscribe
}, [dependency])
```

The dependency array controls when the effect re-runs:

```
[]              runs once on mount only
[pokemonId]     runs on mount + whenever pokemonId changes
nothing         runs after every single render — almost always a bug
```

**Key point to put on slide:**
- Render first, effect second
- Dependency array = the list of values this effect cares about
- If a value is used inside the effect, it belongs in the dependency array
- Omitting something from the array = stale closure bug

---

## SLIDE 9 — Cleanup

**Title:** The cleanup function — what runs on unmount

**Content:**

useEffect can return a function. React calls it before running the next effect and when the component unmounts. This is how you cancel work that is no longer needed.

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`, {
    signal: controller.signal
  })
    .then(r => r.json())
    .then(data => setPokemon(data))
    .catch(err => {
      if (err.name === 'AbortError') return // navigation happened, ignore
    })

  return () => {
    controller.abort() // cancels the fetch if component unmounts
  }
}, [id])
```

Scenario: user clicks Warp, fetch starts. User immediately navigates to Inventory. Without cleanup, the fetch resolves and tries to call setPokemon on an unmounted component. With cleanup, the fetch is aborted the moment the component unmounts.

**Key point to put on slide:**
- Return a function from useEffect = cleanup
- Runs on unmount AND before the next effect execution
- Use AbortController for fetch cleanup
- Use clearInterval / clearTimeout for timer cleanup

---

## LIVE CODE 2 — Warp fetch in Banner (10 min)

**What to build, in order:**

```
1. Create Banner.jsx
2. Add isWarping state (boolean) and pulled state (null or pokemon object)
3. Write the useEffect with [isWarping] dependency
4. Inside the effect: if !isWarping return early
5. Start the fetch to pokeapi.co/api/v2/pokemon/{random 1-151}
6. Extract name, types[0].type.name, sprites.other.official-artwork.front_default
7. Call setPulled with the extracted data
8. Return cleanup with AbortController
9. Wire the Warp button to setIsWarping(true)
```

**Deliberately make the bug first:**

```jsx
// Do this first, show the infinite loop in console
useEffect(() => {
  fetch('https://pokeapi.co/api/v2/pokemon/1')
    .then(r => r.json())
    .then(d => setPulled(d))  // state update → re-render → effect again → loop
})  // no dependency array
```

**Say while showing the loop:**
Look at the network tab. Requests are firing continuously. Every fetch updates state. State triggers a render. Render triggers the effect. Effect triggers a fetch. This is why the dependency array exists — it breaks the loop by telling React exactly when this effect should run.

Then fix it by adding [isWarping] and the early return.

---

# BREAK (01:05, 5 min)

---

# BLOCK 4 — SMART STATE
## 01:10, 30 min total (15 min slides + 15 min live code)

---

## SLIDE 10 — Derived state

**Title:** Never store what you can compute

**Content:**

Bad pattern — two pieces of state that must be kept in sync manually:

```jsx
const [inventory, setInventory] = useState([])
const [inventoryCount, setInventoryCount] = useState(0)

function addPokemon(pokemon) {
  setInventory(prev => [...prev, pokemon])
  setInventoryCount(prev => prev + 1)  // easy to forget this
}
```

What happens when you remove a Pokémon? You have to remember to decrement the count. What happens when you filter the inventory? The count is now wrong.

Correct pattern — derive the count from the array:

```jsx
const [inventory, setInventory] = useState([])

const inventoryCount = inventory.length  // always correct. always in sync.
```

In PokeWarp, every stat you might want to show (count by type, total base experience, rarest pull) is derived from the inventory array. Never store them separately.

**Key point to put on slide:**
- If a value can be computed from existing state, do not put it in state
- Two pieces of state that describe the same thing will go out of sync
- Derived values live in the render function, not in useState

---

## SLIDE 11 — Caching: don't fetch what you already have

**Title:** The cache pattern — fetch once, reuse forever

**Content:**

In PokeWarp, every warp hits PokeAPI. The API has rate limits. Network is slow. If the user pulls Bulbasaur (#1) three times in a session, why make three network requests?

The pattern: store fetched Pokémon in a cache object keyed by ID. Before fetching, check the cache.

```js
// In the Zustand store:
pokemonCache: {},   // { 1: { name: 'bulbasaur', ... }, 25: { name: 'pikachu', ... } }

cacheResult: (id, data) =>
  set((state) => ({
    pokemonCache: { ...state.pokemonCache, [id]: data }
  }))
```

```jsx
// In the warp effect:
useEffect(() => {
  if (!isWarping) return

  const id = Math.floor(Math.random() * 151) + 1

  // Check cache first
  const cached = pokemonCache[id]
  if (cached) {
    setPulled(cached)
    setIsWarping(false)
    return   // done. no network request.
  }

  // Not in cache — fetch
  fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    .then(r => r.json())
    .then(data => {
      const pokemon = { id, name: data.name, type: data.types[0].type.name }
      cacheResult(id, pokemon)  // store for future use
      setPulled(pokemon)
      setIsWarping(false)
    })
}, [isWarping])
```

**Key point to put on slide:**
- Cache in the Zustand store persists across route changes
- Object keyed by ID = O(1) lookup
- Cache check before fetch = instant result for previously seen Pokémon
- In production apps this pattern is what React Query / SWR automate

---

## SLIDE 12 — Optimistic updates

**Title:** Update the UI before the server confirms

**Content:**

Scenario: the user clicks bookmark on a Pokémon card. Your app needs to save this to a backend. The naive approach:

```
1. User clicks
2. Send request to server
3. Wait for response (200ms? 500ms?)
4. Update UI
```

The user clicked a button and nothing happened for half a second. That feels broken.

Optimistic approach:
```
1. User clicks
2. Update UI immediately (assume it will succeed)
3. Send request to server in background
4. If it fails: revert the UI and show an error
```

```jsx
function BookmarkButton({ pokemonId }) {
  const { bookmarks, addBookmark, removeBookmark } = usePokeStore()
  const isBookmarked = bookmarks.includes(pokemonId)

  async function handleToggle() {
    // Step 1: update immediately
    if (isBookmarked) {
      removeBookmark(pokemonId)
    } else {
      addBookmark(pokemonId)
    }

    // Step 2: try to persist
    try {
      await saveBookmarkToServer(pokemonId)
    } catch {
      // Step 3: revert on failure
      if (isBookmarked) {
        addBookmark(pokemonId)      // put it back
      } else {
        removeBookmark(pokemonId)   // undo the add
      }
    }
  }
}
```

**Key point to put on slide:**
- Update state first, persist second
- Catch errors and revert state to what it was before
- The UI feels instant because it is instant
- Only use this when a failure is unlikely and the revert is cheap

---

## SLIDE 13 — When to use which pattern

**Title:** Decision guide

**Content:**

```
QUESTION                                   ANSWER

Is this value computed from other state?   Derived — don't store it
Do I fetch the same ID multiple times?     Cache it in the store
Does a user action need to feel instant?   Optimistic update
Does failure need to be perfectly safe?    Skip optimistic, wait for server
```

Real example from PokeWarp:

```
inventory.length          → derived, never store as separate state
pulled Pokémon data       → cache by ID in Zustand
bookmark toggle           → optimistic (failure is rare, revert is trivial)
spending jade currency    → NOT optimistic (you do not want to show 0 jade
                            and then give it back if something fails)
```

**Key point to put on slide:**
- These are not mutually exclusive — use all three in the same app
- Pick per feature based on the failure consequences
- Derived state is always free. Cache is almost always worth it. Optimistic is situational.

---

## LIVE CODE 3 — Cache + optimistic bookmark (15 min)

**Part A: Cache (8 min)**

```
1. Add pokemonCache: {} to usePokeStore
2. Add cacheResult action to the store
3. In Banner's useEffect, read pokemonCache from the store
4. Add the cache check before the fetch call
5. Add cacheResult call after successful fetch
6. Open network tab, warp multiple times, show the requests stopping for repeat IDs
```

**Say while coding:**
Open the network tab. Filter by XHR. First warp — you see a request. Pull again and get the same Pokémon — zero requests. The cache returned the result immediately. The user experience is now instant for any Pokémon they've seen before.

**Part B: Optimistic bookmark (7 min)**

```
1. Add bookmarks: [] to the store
2. Add addBookmark and removeBookmark actions
3. Create a small BookmarkButton component
4. Implement handleToggle with the optimistic pattern from slide 12
5. Add a "simulate failure" checkbox that makes saveBookmarkToServer throw
6. Show: without failure — instant toggle. With failure — toggle then revert.
```

**Say while showing the failure revert:**
Turn on the failure simulation. Click bookmark. Watch it turn on instantly — that is the optimistic update. Then watch it revert — that is the catch block undoing the state change. The user gets feedback immediately in both cases.

---

# BLOCK 5 — RENDERING PERFORMANCE
## 01:40, 15 min total (10 min slides + 5 min Excalidraw)

---

## SLIDE 14 — The problem: over-rendering

**Title:** Why your inventory page re-renders 100 cards on every warp

**Content:**

PokeWarp inventory has 100 Pokémon cards. The user clicks Warp on a different route, jade changes in the store. Back on the inventory page, every card re-renders even though their data did not change.

Why? Because of a bad selector:

```jsx
// BAD — subscribes to the entire store
function PokemonCard({ id }) {
  const store = usePokeStore()   // re-renders when ANYTHING in store changes
  return <div>{store.inventory[id].name}</div>
}
```

When jade updates, the store object changes, usePokeStore() returns a new reference, PokemonCard re-renders. Even though jade is irrelevant to PokemonCard.

**Key point to put on slide:**
- Subscribing to the whole store = re-render on any store change
- 100 cards × every warp = unnecessary work
- The fix is selector granularity

---

## SLIDE 15 — Narrow your selectors

**Title:** Only subscribe to what you actually need

**Content:**

```jsx
// GOOD — subscribes only to the specific pokemon
function PokemonCard({ id }) {
  const pokemon = usePokeStore((s) => s.inventory.find(p => p.id === id))
  // re-renders ONLY when this specific pokemon in inventory changes
  return <div>{pokemon.name}</div>
}
```

```jsx
// GOOD — subscribes only to jade
function CurrencyDisplay() {
  const jade = usePokeStore((s) => s.jade)
  // re-renders ONLY when jade changes
}
```

Zustand's selector does a shallow equality check on the return value. If jade changes but you are selecting inventory, your component does not re-render.

The rule: select the smallest slice of state your component actually uses.

**Key point to put on slide:**
- Selector = function passed to usePokeStore()
- Zustand compares previous and next selector output
- If they are the same reference / value: no re-render
- For objects: use zustand's shallow import for shallow comparison

---

## SLIDE 16 — Keys and React.memo

**Title:** Two more tools — keys and memo

**Content:**

**Keys:**

React uses the key prop to identify list items across renders. Wrong key = React unmounts and remounts components it could have reused.

```jsx
// BAD — index as key
{inventory.map((p, i) => <PokemonCard key={i} pokemon={p} />)}
// When you add a pokemon at the start, ALL existing cards get new indices
// React thinks every card changed → remounts everything

// GOOD — stable unique ID as key
{inventory.map(p => <PokemonCard key={p.id} pokemon={p} />)}
// React correctly identifies which card is which across renders
```

**React.memo:**

Wrapping a component in React.memo tells React to skip re-rendering it if its props have not changed.

```jsx
const PokemonCard = React.memo(function PokemonCard({ pokemon }) {
  return <div>{pokemon.name}</div>
})
// If parent re-renders but pokemon prop reference is the same → PokemonCard is skipped
```

Use it when: a component is expensive to render AND its parent re-renders frequently AND its own props rarely change. In PokeWarp: PokemonCard in the inventory list is a good candidate.

**Key point to put on slide:**
- Always use stable unique IDs as keys in lists
- React.memo = skip re-render if props are shallowly equal
- Profile before optimizing — React is fast, don't add complexity you don't need

---

## EXCALIDRAW #3 (5 min)

### Step-by-step drawing instructions:

**Step 1.** Draw the Zustand store box on the left. Inside write: `jade`, `inventory`, `bookmarks`.

**Step 2.** On the right, draw a column of 5 small rectangles labeled `PokemonCard ×100`. Stack them vertically with a little gap. Say: this is the inventory page. 100 cards.

**Step 3.** Draw a thick arrow from the store to ALL 100 cards. Label it `usePokeStore()` (no selector). Say: every card subscribes to the entire store. This is the bad pattern.

**Step 4.** Draw a lightning bolt on `jade` in the store. Then shade all 100 cards red. Say: jade changes because the user warped. Every single card re-renders. None of them use jade. Pure waste.

**Step 5.** Now on a new section of the canvas (or erase), redraw. Same store. Same 100 cards. But this time draw thin arrows from each card to only the `inventory` slice of the store. Label the arrows `s => s.inventory[id]`.

**Step 6.** Draw the lightning bolt on jade again. This time shade ONLY the `jade` area of the store. The 100 cards stay unshaded. Say: jade changed. But the selector returns inventory data. Inventory did not change. Zustand does the equality check, sees nothing changed, skips all 100 re-renders.

**Say to close:** One selector change. Zero extra code complexity. 100 unnecessary re-renders eliminated. This is why selectors exist.

---

# BLOCK 6 — WRAP UP
## 01:55, 5 min

---

## SLIDE 17 — What you now know

**Title:** The mental models

**Content:**

```
Render          Function call returning a description of UI.
                React diffs it against the previous description.

Reconciler      The engine that turns the diff into minimal DOM writes.

Render cascade  Parent re-renders → all children re-render.
                Fix it by controlling where state lives.

Local state     useState. One component's private memory.
Zustand         Shared store outside the tree. Selector = precision subscription.

useEffect       Side effects after render. Dep array = when it re-runs.
Cleanup         Return function from useEffect. Runs on unmount.

Derived state   Compute from existing state. Never store redundantly.
Cache           Store fetch results in Zustand by ID. Check before fetching.
Optimistic      Update UI first. Persist async. Revert on failure.

Keys            Stable unique IDs. Never use array index.
Selectors       Subscribe to the smallest slice you need.
```

**Homework — extend PokeWarp:**

- Pity system: add pullCount to the store. After 10 pulls, force Pokémon #150 (Mewtwo). Reset count.
- Shop page: new route, button that calls addJade(1600) from the store
- Type filter on inventory: filter the inventory array by type. The filtered list is derived state — do not store it.

**Next session:**
Code splitting and lazy loading, custom hooks, and if there's appetite, React Query as the production-grade version of the caching pattern you built today.

---

# QUICK REFERENCE — THINGS THAT WILL GO WRONG LIVE

**Someone asks why not use Context instead of Zustand:**
Context is built in and works. The problem is that every consumer of a Context re-renders when the context value changes, even if they only care about a small slice. Zustand's selector solves this. For simple cases Context is fine. For anything with frequent updates across many components, Zustand wins.

**Someone asks why usePokeStore is a custom hook (starts with use):**
React hooks rules apply — must be called at the top level of a component, not inside conditions or loops. The use prefix is a convention that signals this. Zustand's create returns a hook, which is why you call it usePokeStore, not getPokeStore.

**Infinite loop happens during live code:**
It will. Show it on purpose first (slide 8 covers this). Say: this is exactly what I expected. Watch the network tab. Now look at why. No dependency array = runs after every render = updates state = triggers render = runs again. Add the dep array. Fixed.

**Someone asks what happens when two components call setJade at the same time:**
React 18 batches all state updates in the same event loop tick into one render. If they happen in genuinely concurrent async callbacks, the last write wins — Zustand's set is synchronous and applies immediately. For PokeWarp this is not a real concern.

**Cache seems too simple — someone asks about stale data:**
It is simple on purpose. In production you add a timestamp to each cache entry and compare against a max age. Or you use React Query which handles this automatically. What we built today is the pattern. React Query is the production implementation of the same pattern with staleness, background refetching, and invalidation built in.
