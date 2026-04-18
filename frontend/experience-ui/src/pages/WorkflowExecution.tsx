import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  AccessTime as TimeIcon,
  Replay as RetryIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import { loadExecutionById, retryExecution } from '../state/executionSlice'
import { LoadingSpinner } from '@shared/components'
import { ExecutionStatus } from '@shared/types'

export default function WorkflowExecution(): JSX.Element {
  const { executionId } = useParams<{ executionId: string }>()
  const dispatch = useAppDispatch()
  const { currentExecution, loading, saving } = useAppSelector((state) => state.executions)
  const [retryDialogOpen, setRetryDialogOpen] = useState(false)
  const [retryStepId, setRetryStepId] = useState<string>('')

  useEffect(() => {
    if (executionId) {
      dispatch(loadExecutionById(executionId))
    }
  }, [dispatch, executionId])

  const handleRetryExecution = async () => {
    if (!executionId) return

    try {
      await dispatch(retryExecution({ executionId, stepId: retryStepId || undefined })).unwrap()
      setRetryDialogOpen(false)
      setRetryStepId('')
      // Reload execution data
      dispatch(loadExecutionById(executionId))
    } catch (error) {
      console.error('Failed to retry execution:', error)
    }
  }

  const failedSteps = currentExecution?.steps.filter(step => step.status === 'FAILED') || []

  if (loading || !currentExecution) {
    return <LoadingSpinner />
  }

  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <SuccessIcon color="success" />
      case 'FAILED':
        return <ErrorIcon color="error" />
      case 'RUNNING':
        return <PlayIcon color="primary" />
      case 'PENDING':
        return <ScheduleIcon color="action" />
      default:
        return <WarningIcon color="warning" />
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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workflow Execution Details
      </Typography>

      <Grid container spacing={3}>
        {/* Execution Overview */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {getStatusIcon(currentExecution.status)}
                <Typography variant="h6" sx={{ ml: 1 }}>
                  Execution {currentExecution.execution_id.slice(-8)}
                </Typography>
                <Chip
                  label={currentExecution.status}
                  color={getStatusColor(currentExecution.status)}
                  sx={{ ml: 2 }}
                />
                {(currentExecution.status === 'FAILED' || failedSteps.length > 0) && (
                  <Button
                    variant="outlined"
                    startIcon={<RetryIcon />}
                    onClick={() => setRetryDialogOpen(true)}
                    sx={{ ml: 2 }}
                    disabled={saving}
                  >
                    Retry
                  </Button>
                )}
              </Box>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Workflow
                  </Typography>
                  <Typography variant="body1">
                    {currentExecution.workflow_id.slice(-8)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Started
                  </Typography>
                  <Typography variant="body1">
                    {new Date(currentExecution.started_at).toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration(currentExecution.duration_seconds)}
                  </Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="textSecondary">
                    Success Rate
                  </Typography>
                  <Typography variant="body1">
                    {Math.round(currentExecution.success_rate * 100)}%
                  </Typography>
                </Grid>
              </Grid>

              {currentExecution.status === 'RUNNING' && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    Progress
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={(currentExecution.steps.filter(s => s.status === 'COMPLETED').length / currentExecution.steps.length) * 100}
                  />
                </Box>
              )}

              {currentExecution.incidents_created.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    {currentExecution.incidents_created.length} incident(s) created during execution
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Execution Stats */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statistics
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Total Records</Typography>
                  <Typography variant="body1">
                    {currentExecution.total_records_processed + currentExecution.total_records_failed}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="success.main">Processed</Typography>
                  <Typography variant="body1" color="success.main">
                    {currentExecution.total_records_processed}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="error.main">Failed</Typography>
                  <Typography variant="body1" color="error.main">
                    {currentExecution.total_records_failed}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2">Steps Completed</Typography>
                  <Typography variant="body1">
                    {currentExecution.steps.filter(s => s.status === 'COMPLETED').length} / {currentExecution.steps.length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Step Execution Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Step Execution Details
              </Typography>
              <Stepper orientation="vertical">
                {currentExecution.steps.map((step) => (
                  <Step key={step.step_id} active={step.status === 'RUNNING'} completed={step.status === 'COMPLETED'}>
                    <StepLabel
                      StepIconComponent={() => getStatusIcon(step.status)}
                      optional={
                        step.completed_at ? (
                          <Typography variant="caption">
                            Completed {new Date(step.completed_at).toLocaleTimeString()}
                          </Typography>
                        ) : step.started_at ? (
                          <Typography variant="caption">
                            Started {new Date(step.started_at).toLocaleTimeString()}
                          </Typography>
                        ) : null
                      }
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{step.step_name}</Typography>
                        <Chip label={step.status} size="small" color={getStatusColor(step.status)} />
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Box sx={{ pl: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {step.agent_type ? 'Agent' : step.connector_type ? 'Connector' : 'Step'} • Step {step.step_number}
                        </Typography>

                        {step.duration_seconds && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <TimeIcon sx={{ mr: 0.5, fontSize: 16 }} />
                            <Typography variant="caption">
                              Duration: {formatDuration(step.duration_seconds)}
                            </Typography>
                          </Box>
                        )}

                        {step.records_affected !== undefined && (
                          <Typography variant="caption" display="block">
                            Records affected: {step.records_affected}
                          </Typography>
                        )}

                        {step.error_message && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <Typography variant="body2">{step.error_message}</Typography>
                          </Alert>
                        )}

                        {step.agent_decisions && step.agent_decisions.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" display="block" gutterBottom>
                              Agent Decisions:
                            </Typography>
                            {step.agent_decisions.map((decision, idx) => (
                              <Chip key={idx} label={decision} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                            ))}
                          </Box>
                        )}
                      </Box>
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Retry Dialog */}
      <Dialog open={retryDialogOpen} onClose={() => setRetryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Retry Execution</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Choose how you want to retry this execution:
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Retry Scope</InputLabel>
            <Select
              value={retryStepId}
              onChange={(e) => setRetryStepId(e.target.value)}
              label="Retry Scope"
            >
              <MenuItem value="">
                <em>Retry entire execution</em>
              </MenuItem>
              {failedSteps.map((step) => (
                <MenuItem key={step.step_id} value={step.step_id}>
                  Retry only: {step.step_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              {retryStepId
                ? `This will retry only the selected step and continue execution from there.`
                : `This will restart the entire execution from the beginning.`
              }
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetryDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRetryExecution}
            variant="contained"
            disabled={saving}
            startIcon={<RetryIcon />}
          >
            {saving ? 'Retrying...' : 'Retry Execution'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}