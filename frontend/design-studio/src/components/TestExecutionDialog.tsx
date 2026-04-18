// frontend/design-studio/src/components/TestExecutionDialog.tsx

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as RunningIcon,
} from '@mui/icons-material'
import { WorkflowExecution, ExecutionStatus } from '@shared/types'
import { getTestExecutionStatus } from '../services/testExecutionApi'

interface TestExecutionDialogProps {
  open: boolean
  execution: WorkflowExecution | null
  onClose: () => void
}

export default function TestExecutionDialog({
  open,
  execution,
  onClose,
}: TestExecutionDialogProps): JSX.Element {
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(execution)

  useEffect(() => {
    if (execution && open) {
      setCurrentExecution(execution)
      if (execution.status === 'RUNNING' || execution.status === 'PENDING') {
        const pollInterval = setInterval(async () => {
          try {
            const updated = await getTestExecutionStatus(execution.execution_id)
            setCurrentExecution(updated)
            if (updated.status !== 'RUNNING' && updated.status !== 'PENDING') {
              clearInterval(pollInterval)
            }
          } catch (error) {
            console.error('Failed to fetch execution status:', error)
          }
        }, 1000)

        return () => clearInterval(pollInterval)
      }
    }
  }, [execution, open])

  if (!currentExecution) {
    return <Dialog open={open} onClose={onClose} />
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <SuccessIcon color="success" />
      case 'FAILED':
        return <ErrorIcon color="error" />
      case 'RUNNING':
        return <RunningIcon color="primary" />
      case 'PENDING':
        return <PendingIcon color="action" />
      default:
        return null
    }
  }

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'FAILED':
        return 'error'
      case 'RUNNING':
        return 'primary'
      case 'PENDING':
        return 'default'
      default:
        return 'warning'
    }
  }

  const isRunning = currentExecution.status === 'RUNNING' || currentExecution.status === 'PENDING'
  const completedSteps = currentExecution.steps.filter(
    (s) => s.status === 'COMPLETED' || s.status === 'FAILED'
  ).length
  const progressPercent = (completedSteps / currentExecution.steps.length) * 100

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon(currentExecution.status)}
          Workflow Test Execution
          <Chip label={currentExecution.status} color={getStatusColor(currentExecution.status)} size="small" />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isRunning && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Test execution in progress...</Typography>
            </Box>
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress: {completedSteps} / {currentExecution.steps.length} steps completed
          </Typography>
          <LinearProgress variant="determinate" value={progressPercent} sx={{ height: 8, borderRadius: 4 }} />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Execution ID
            </Typography>
            <Typography variant="body1">{currentExecution.execution_id.slice(-8)}</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Status
            </Typography>
            <Chip label={currentExecution.status} color={getStatusColor(currentExecution.status)} size="small" />
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Success Rate
            </Typography>
            <Typography variant="body1">{Math.round(currentExecution.success_rate * 100)}%</Typography>
          </Box>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Duration
            </Typography>
            <Typography variant="body1">{formatDuration(currentExecution.duration_seconds)}</Typography>
          </Box>
        </Box>

        {currentExecution.steps.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Step Execution Details
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>Step</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Duration</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentExecution.steps.map((step) => (
                    <TableRow key={step.step_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(step.status)}
                          <Typography variant="body2">{step.step_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip label={step.status} color={getStatusColor(step.status)} size="small" />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2">{formatDuration(step.duration_seconds)}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {currentExecution.status === 'FAILED' && currentExecution.steps.some((s) => s.error_message) && (
          <>
            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Errors
            </Typography>
            <Box sx={{ backgroundColor: '#fff3cd', p: 2, borderRadius: 1, borderLeft: '4px solid #ff6b6b' }}>
              {currentExecution.steps
                .filter((s) => s.error_message)
                .map((step) => (
                  <Box key={step.step_id} sx={{ mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {step.step_name}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {step.error_message}
                    </Typography>
                  </Box>
                ))}
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}
