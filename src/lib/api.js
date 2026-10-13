import axios from 'axios'
import { suivreReponseApi } from '@/lib/analytics'


const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

// Utilisable côté client (formulaires, actions interactives)
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
   (response) => {
    suivreReponseApi(response)
    return response
  },
  async (error) => {
    let message = error.response?.data?.error || 'Une erreur est survenue'
    // Avec responseType: 'blob', le message du serveur arrive sous forme de Blob
    if (error.response?.data instanceof Blob) {
      try {
        message = JSON.parse(await error.response.data.text()).error || message
      } catch {}
    }
    const erreur = new Error(message)
    erreur.code = error.code
    erreur.status = error.response?.status
    return Promise.reject(erreur)
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