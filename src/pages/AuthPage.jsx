import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import usePokeStore from '../store/usePokeStore'

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(null)

    const loginStore = usePokeStore((s) => s.login)
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null)

        const endpoint = isLogin ? '/login' : '/register'

        try {
            const res = await fetch(`http://localhost:8080${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            })

            if (!res.ok) throw new Error(await res.text())

            if (isLogin) {
                const data = await res.json()
                loginStore(data) // Load DB data into Zustand!
                navigate('/')    // Go to warp terminal
            } else {
                setIsLogin(true) // Switch to login after successful register
                setError("Account created! Please log in.")
            }
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center pt-20">
            <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 w-96">
                <h2 className="text-2xl font-bold text-cyan-400 mb-6">
                    {isLogin ? 'Login to PokeWarp' : 'Create Account'}
                </h2>

                {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        className="p-3 bg-gray-800 rounded border border-gray-700 text-white focus:outline-cyan-500"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        className="p-3 bg-gray-800 rounded border border-gray-700 text-white focus:outline-cyan-500"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button className="py-3 bg-cyan-600 hover:bg-cyan-500 rounded font-bold transition-colors">
                        {isLogin ? 'Login' : 'Register'}
                    </button>
                </form>

                <button
                    onClick={() => setIsLogin(!isLogin)}
                    className="mt-4 text-sm text-gray-400 hover:text-cyan-300 w-full text-center"
                >
                    {isLogin ? 'Need an account? Register' : 'Already have one? Login'}
                </button>
            </div>
        </div>
    )
}