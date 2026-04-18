import { useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  NetworkCheck as NetworkIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import { loadDashboardMetrics } from '../state/dashboardSlice'
import { loadExecutions } from '../state/executionSlice'
import { LoadingSpinner } from '@shared/components'

export default function Dashboard(): JSX.Element {
  const dispatch = useAppDispatch()
  const { metrics, loading: metricsLoading } = useAppSelector((state) => state.dashboard)
  const { executions, loading: executionsLoading } = useAppSelector((state) => state.executions)

  useEffect(() => {
    dispatch(loadDashboardMetrics())
    dispatch(loadExecutions())
  }, [dispatch])

  if (metricsLoading || executionsLoading) {
    return <LoadingSpinner />
  }

  if (!metrics) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Failed to load dashboard data
        </Typography>
      </Box>
    )
  }

  const activeExecutions = executions.filter(e => e.status === 'RUNNING' || e.status === 'PENDING')

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Execution Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Key Metrics */}
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PlayIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Executions</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {metrics.totalExecutions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Active</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {metrics.activeExecutions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <SuccessIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Success Rate</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {Math.round(metrics.successRate * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={metrics.successRate * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ErrorIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Failed</Typography>
              </Box>
              <Typography variant="h3" color="error.main">
                {metrics.failedExecutions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* System Health */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MemoryIcon sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    CPU
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.systemHealth.cpu}
                    sx={{ flex: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {Math.round(metrics.systemHealth.cpu)}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MemoryIcon sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    Memory
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.systemHealth.memory}
                    sx={{ flex: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {Math.round(metrics.systemHealth.memory)}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StorageIcon sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    Disk
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.systemHealth.disk}
                    sx={{ flex: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {Math.round(metrics.systemHealth.disk)}%
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NetworkIcon sx={{ mr: 1 }} />
                  <Typography variant="body2" sx={{ minWidth: 60 }}>
                    Network
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={metrics.systemHealth.network}
                    sx={{ flex: 1, mr: 1 }}
                  />
                  <Typography variant="body2">
                    {Math.round(metrics.systemHealth.network)}%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Executions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Executions
              </Typography>
              {activeExecutions.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No active executions
                </Typography>
              ) : (
                <List>
                  {activeExecutions.slice(0, 5).map((execution) => (
                    <ListItem key={execution.execution_id} divider>
                      <ListItemIcon>
                        <PlayIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={`Execution ${execution.execution_id.slice(-8)}`}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={execution.status}
                              size="small"
                              color={execution.status === 'RUNNING' ? 'primary' : 'default'}
                            />
                            <Typography variant="caption">
                              Started {new Date(execution.started_at).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Incidents */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Incidents
              </Typography>
              {metrics.recentIncidents.length === 0 ? (
                <Typography variant="body2" color="textSecondary">
                  No recent incidents
                </Typography>
              ) : (
                <List>
                  {metrics.recentIncidents.slice(0, 5).map((incident: any, index: number) => (
                    <div key={incident.incident_id}>
                      <ListItem>
                        <ListItemIcon>
                          {incident.severity === 'CRITICAL' ? (
                            <ErrorIcon color="error" />
                          ) : incident.severity === 'HIGH' ? (
                            <WarningIcon color="warning" />
                          ) : (
                            <WarningIcon color="info" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={incident.title}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={incident.severity}
                                size="small"
                                color={
                                  incident.severity === 'CRITICAL' ? 'error' :
                                  incident.severity === 'HIGH' ? 'warning' : 'info'
                                }
                              />
                              <Typography variant="caption">
                                {new Date(incident.detected_at).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < metrics.recentIncidents.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}