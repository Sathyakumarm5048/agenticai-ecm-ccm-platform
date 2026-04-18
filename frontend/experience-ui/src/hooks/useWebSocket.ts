import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAppDispatch } from '../state/hooks'
import { updateExecutionStatus, updateStepExecution } from '../state/executionSlice'
import { updateMetrics } from '../state/dashboardSlice'
import { ExecutionUpdate } from '@shared/types'

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8008'

export function useWebSocket() {
  const dispatch = useAppDispatch()
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(WS_URL, {
      transports: ['websocket'],
      upgrade: false,
    })

    const socket = socketRef.current

    // Handle execution updates
    socket.on('execution_update', (data: ExecutionUpdate) => {
      if (data.step_id) {
        // Step-level update
        dispatch(updateStepExecution({
          execution_id: data.execution_id,
          step_id: data.step_id,
          ...data.data,
        }))
      } else {
        // Execution-level update
        dispatch(updateExecutionStatus({
          executionId: data.execution_id,
          status: data.data.status,
        }))
      }
    })

    // Handle dashboard metrics updates
    socket.on('metrics_update', (data: any) => {
      dispatch(updateMetrics(data))
    })

    // Handle connection events
    socket.on('connect', () => {
      console.log('Connected to WebSocket server')
    })

    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server')
    })

    socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })

    // Cleanup on unmount
    return () => {
      socket.disconnect()
    }
  }, [dispatch])

  return socketRef.current
}