import type { Agent, Payment, Task, TaskEvent } from '../types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
async function request<T>(path: string, options?: RequestInit): Promise<T> { const response = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } }); if (!response.ok) throw new Error(`API request failed: ${response.status}`); return response.json() }
export const api = { health: () => request<{ status: string }>('/api/health'), agents: () => request<Agent[]>('/api/agents'), agent: (id: string) => request<Agent>(`/api/agents/${id}`), createTask: (userRequest: string) => request<Task>('/api/tasks', { method: 'POST', body: JSON.stringify({ userRequest }) }), task: (id: string) => request<Task>(`/api/tasks/${id}`), events: (id: string) => request<TaskEvent[]>(`/api/tasks/${id}/events`), payments: () => request<Payment[]>('/api/payments') }
