import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Utilisable côté client (formulaires, actions interactives)
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 'Une erreur est survenue'
    return Promise.reject(new Error(message))
  }
)

// Utilisable côté serveur (Server Components) — nécessite de transmettre
// le cookie de session manuellement, car il n'y a pas de navigateur ici.
export async function apiServer(path, options = {}) {
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const cookieHeader = cookieStore.toString()

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
      ...options.headers,
    },
    cache: 'no-store', // à ajuster page par page (voir Phase 2)
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || 'Une erreur est survenue')
  }
  return res.json()
}