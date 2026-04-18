import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as RunningIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import { loadExecutions } from '../state/executionSlice'
import { WorkflowExecution, ExecutionStatus } from '@shared/types'

interface ComparisonMetric {
  label: string
  exec1: string | number
  exec2: string | number
  unit?: string
  improved?: boolean
}

export default function ExecutionComparison(): JSX.Element {
  const dispatch = useAppDispatch()
  const { executions } = useAppSelector((state) => state.executions)
  const [selectedExec1, setSelectedExec1] = useState<WorkflowExecution | null>(null)
  const [selectedExec2, setSelectedExec2] = useState<WorkflowExecution | null>(null)
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetric[]>([])

  useEffect(() => {
    dispatch(loadExecutions())
  }, [dispatch])

  useEffect(() => {
    if (selectedExec1 && selectedExec2) {
      generateComparisonMetrics()
    }
  }, [selectedExec1, selectedExec2])

  const generateComparisonMetrics = () => {
    if (!selectedExec1 || !selectedExec2) return

    const metrics: ComparisonMetric[] = []

    // Status comparison
    metrics.push({
      label: 'Status',
      exec1: selectedExec1.status,
      exec2: selectedExec2.status,
    })

    // Duration comparison
    const duration1 = selectedExec1.duration_seconds ?? 0
    const duration2 = selectedExec2.duration_seconds ?? 0
    metrics.push({
      label: 'Duration',
      exec1: formatDuration(duration1),
      exec2: formatDuration(duration2),
      improved: duration2 < duration1,
    })

    // Success rate
    metrics.push({
      label: 'Success Rate',
      exec1: `${Math.round(selectedExec1.success_rate * 100)}%`,
      exec2: `${Math.round(selectedExec2.success_rate * 100)}%`,
      improved: selectedExec2.success_rate > selectedExec1.success_rate,
    })

    // Records processed
    metrics.push({
      label: 'Records Processed',
      exec1: selectedExec1.total_records_processed,
      exec2: selectedExec2.total_records_processed,
    })

    // Records failed
    metrics.push({
      label: 'Records Failed',
      exec1: selectedExec1.total_records_failed,
      exec2: selectedExec2.total_records_failed,
      improved: selectedExec2.total_records_failed < selectedExec1.total_records_failed,
    })

    // Steps count
    metrics.push({
      label: 'Total Steps',
      exec1: selectedExec1.steps.length,
      exec2: selectedExec2.steps.length,
    })

    // Failed steps
    const failedSteps1 = selectedExec1.steps.filter((s) => s.status === 'FAILED').length
    const failedSteps2 = selectedExec2.steps.filter((s) => s.status === 'FAILED').length
    metrics.push({
      label: 'Failed Steps',
      exec1: failedSteps1,
      exec2: failedSteps2,
      improved: failedSteps2 < failedSteps1,
    })

    setComparisonMetrics(metrics)
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

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getStepComparison = () => {
    if (!selectedExec1 || !selectedExec2) return []

    const steps1 = selectedExec1.steps
    const steps2 = selectedExec2.steps

    return steps1.map((step1, idx) => {
      const step2 = steps2[idx]
      return {
        stepId: step1.step_id,
        stepName: step1.step_name,
        status1: step1.status,
        status2: step2?.status,
        duration1: step1.duration_seconds ?? 0,
        duration2: step2?.duration_seconds ?? 0,
        statusMatch: step1.status === step2?.status,
      }
    })
  }

  const renderMetricDiff = (metric: ComparisonMetric) => {
    if (metric.improved === undefined) return '-'
    return metric.improved ? '↓ Better' : '↑ Worse'
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Execution Comparison
      </Typography>

      {/* Selection Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Execution 1
              </Typography>
              <Autocomplete
                options={executions}
                getOptionLabel={(option) => `${option.execution_id.slice(-8)} (${option.status})`}
                value={selectedExec1}
                onChange={(_, newValue) => setSelectedExec1(newValue)}
                renderInput={(params) => <TextField {...params} label="Select execution" />}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    {getStatusIcon(option.status)}
                    <Typography sx={{ ml: 1 }}>
                      {option.execution_id.slice(-8)} - {new Date(option.started_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              />
              {selectedExec1 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Workflow: {selectedExec1.workflow_id.slice(-8)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {selectedExec1.status}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Execution 2
              </Typography>
              <Autocomplete
                options={executions}
                getOptionLabel={(option) => `${option.execution_id.slice(-8)} (${option.status})`}
                value={selectedExec2}
                onChange={(_, newValue) => setSelectedExec2(newValue)}
                renderInput={(params) => <TextField {...params} label="Select execution" />}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    {getStatusIcon(option.status)}
                    <Typography sx={{ ml: 1 }}>
                      {option.execution_id.slice(-8)} - {new Date(option.started_at).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              />
              {selectedExec2 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    Workflow: {selectedExec2.workflow_id.slice(-8)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Status: {selectedExec2.status}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Comparison Results */}
      {selectedExec1 && selectedExec2 && (
        <>
          {/* Metrics Comparison */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Metrics
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Metric</TableCell>
                      <TableCell align="center">Execution 1</TableCell>
                      <TableCell align="center">Execution 2</TableCell>
                      <TableCell align="center">Difference</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {comparisonMetrics.map((metric, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2">{metric.label}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{metric.exec1}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">{metric.exec2}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={renderMetricDiff(metric)}
                            size="small"
                            color={metric.improved ? 'success' : metric.improved === false ? 'error' : 'default'}
                            variant={metric.improved !== undefined ? 'filled' : 'outlined'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Step-by-Step Comparison */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Step-by-Step Comparison
              </Typography>
              <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Step</TableCell>
                      <TableCell align="center">Exec 1 Status</TableCell>
                      <TableCell align="center">Exec 1 Duration</TableCell>
                      <TableCell align="center">Exec 2 Status</TableCell>
                      <TableCell align="center">Exec 2 Duration</TableCell>
                      <TableCell align="center">Status Match</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getStepComparison().map((comparison, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Typography variant="body2">{comparison.stepName}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={comparison.status1}
                            size="small"
                            color={getStatusColor(comparison.status1)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatDuration(comparison.duration1)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={comparison.status2}
                            size="small"
                            color={getStatusColor(comparison.status2 as ExecutionStatus)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatDuration(comparison.duration2)}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={comparison.statusMatch ? 'Match' : 'Different'}
                            size="small"
                            color={comparison.statusMatch ? 'success' : 'error'}
                            variant="filled"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {!selectedExec1 || !selectedExec2 ? (
        <Card sx={{ mt: 3, backgroundColor: '#f5f5f5' }}>
          <CardContent>
            <Typography variant="body2" color="textSecondary" align="center">
              Select two executions to compare their performance metrics and step-by-step execution details
            </Typography>
          </CardContent>
        </Card>
      ) : null}
    </Box>
  )
}
