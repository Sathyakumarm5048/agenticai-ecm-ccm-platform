/// <reference types="vite/client" />

import axios from 'axios'
import { DashboardMetrics } from '@shared/types'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8008'

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const response = await axiosInstance.get<DashboardMetrics>('/dashboard/metrics')
  return response.data
}

export async function fetchExecutionStats(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
  executions: Array<{
    timestamp: Date;
    count: number;
    status: string;
  }>;
  performance: Array<{
    timestamp: Date;
    avgDuration: number;
    successRate: number;
  }>;
}> {
  const response = await axiosInstance.get(`/dashboard/stats?timeRange=${timeRange}`)
  return response.data
}