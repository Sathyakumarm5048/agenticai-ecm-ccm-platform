import { useEffect, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
} from '@mui/material'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import { loadExecutions } from '../state/executionSlice'

interface ExecutionTrendData {
  date: string
  completed: number
  failed: number
  running: number
}

interface WorkflowPerformance {
  workflow_id: string
  workflow_name: string
  total: number
  completed: number
  failed: number
  success_rate: number
  avg_duration: number
}

interface StepPerformance {
  step_id: string
  step_name: string
  total: number
  failed: number
  avg_duration: number
  failure_rate: number
}

export default function Analytics(): JSX.Element {
  const dispatch = useAppDispatch()
  const { executions, loading } = useAppSelector((state) => state.executions)
  const [dateRange, setDateRange] = useState<'day' | 'week' | 'month'>('week')
  const [trendData, setTrendData] = useState<ExecutionTrendData[]>([])
  const [workflowPerformance, setWorkflowPerformance] = useState<WorkflowPerformance[]>([])
  const [stepPerformance, setStepPerformance] = useState<StepPerformance[]>([])

  useEffect(() => {
    dispatch(loadExecutions())
  }, [dispatch])

  useEffect(() => {
    if (executions.length > 0) {
      generateTrendData()
      generateWorkflowPerformance()
      generateStepPerformance()
    }
  }, [executions, dateRange])

  const generateTrendData = () => {
    const now = new Date()
    const days = dateRange === 'day' ? 1 : dateRange === 'week' ? 7 : 30
    const data: ExecutionTrendData[] = []

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

      const dayExecutions = executions.filter((exec) => {
        const execDate = new Date(exec.started_at)
        return execDate.toLocaleDateString() === date.toLocaleDateString()
      })

      data.push({
        date: dateStr,
        completed: dayExecutions.filter((e) => e.status === 'COMPLETED').length,
        failed: dayExecutions.filter((e) => e.status === 'FAILED').length,
        running: dayExecutions.filter((e) => e.status === 'RUNNING').length,
      })
    }

    setTrendData(data)
  }

  const generateWorkflowPerformance = () => {
    const workflows = new Map<string, WorkflowPerformance>()

    executions.forEach((exec) => {
      if (!workflows.has(exec.workflow_id)) {
        workflows.set(exec.workflow_id, {
          workflow_id: exec.workflow_id,
          workflow_name: `Workflow-${exec.workflow_id.slice(-4)}`,
          total: 0,
          completed: 0,
          failed: 0,
          success_rate: 0,
          avg_duration: 0,
        })
      }

      const perf = workflows.get(exec.workflow_id)!
      perf.total += 1
      if (exec.status === 'COMPLETED') perf.completed += 1
      if (exec.status === 'FAILED') perf.failed += 1
      perf.avg_duration += exec.duration_seconds ?? 0
    })

    const performanceArray = Array.from(workflows.values())
      .map((p) => ({
        ...p,
        success_rate: (p.completed / p.total) * 100,
        avg_duration: p.avg_duration / p.total,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)

    setWorkflowPerformance(performanceArray)
  }

  const generateStepPerformance = () => {
    const steps = new Map<string, StepPerformance>()

    executions.forEach((exec) => {
      exec.steps.forEach((step) => {
        if (!steps.has(step.step_id)) {
          steps.set(step.step_id, {
            step_id: step.step_id,
            step_name: step.step_name,
            total: 0,
            failed: 0,
            avg_duration: 0,
            failure_rate: 0,
          })
        }

        const stepPerf = steps.get(step.step_id)!
        stepPerf.total += 1
        if (step.status === 'FAILED') stepPerf.failed += 1
        stepPerf.avg_duration += step.duration_seconds ?? 0
      })
    })

    const performanceArray = Array.from(steps.values())
      .map((s) => ({
        ...s,
        avg_duration: s.avg_duration / s.total,
        failure_rate: (s.failed / s.total) * 100,
      }))
      .filter((s) => s.failure_rate > 0)
      .sort((a, b) => b.failure_rate - a.failure_rate)
      .slice(0, 10)

    setStepPerformance(performanceArray)
  }

  const totalExecutions = executions.length
  const completedExecutions = executions.filter((e) => e.status === 'COMPLETED').length
  const failedExecutions = executions.filter((e) => e.status === 'FAILED').length
  const avgExecutionTime =
    totalExecutions > 0
      ? executions.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0) / totalExecutions
      : 0
  const successRate = totalExecutions > 0 ? (completedExecutions / totalExecutions) * 100 : 0

  const statusDistribution = [
    { name: 'Completed', value: completedExecutions, color: '#4CAF50' },
    { name: 'Failed', value: failedExecutions, color: '#F44336' },
    { name: 'Running', value: executions.filter((e) => e.status === 'RUNNING').length, color: '#2196F3' },
    { name: 'Pending', value: executions.filter((e) => e.status === 'PENDING').length, color: '#FFC107' },
  ].filter((s) => s.value > 0)

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (loading && executions.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Analytics & Reporting</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            label="Date Range"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'day' | 'week' | 'month')}
            sx={{ width: 120 }}
          >
            <MenuItem value="day">Last 24h</MenuItem>
            <MenuItem value="week">Last 7 days</MenuItem>
            <MenuItem value="month">Last 30 days</MenuItem>
          </TextField>
          <Button variant="contained" onClick={() => dispatch(loadExecutions())}>
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Key Metrics */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Executions
              </Typography>
              <Typography variant="h4">{totalExecutions}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Success Rate
              </Typography>
              <Typography variant="h4" sx={{ color: '#4CAF50' }}>
                {Math.round(successRate)}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Duration
              </Typography>
              <Typography variant="h4">{formatDuration(avgExecutionTime)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Failed Executions
              </Typography>
              <Typography variant="h4" sx={{ color: '#F44336' }}>
                {failedExecutions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Execution Trend */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Execution Trend
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="completed" stroke="#4CAF50" name="Completed" />
                  <Line type="monotone" dataKey="failed" stroke="#F44336" name="Failed" />
                  <Line type="monotone" dataKey="running" stroke="#2196F3" name="Running" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Status Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Workflows by Success Rate
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={workflowPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="workflow_name"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip formatter={(value) => `${Math.round(value as number)}%`} />
                  <Bar dataKey="success_rate" fill="#4CAF50" name="Success Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Step Performance Issues */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Steps with Highest Failure Rates
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stepPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis
                    dataKey="step_name"
                    type="category"
                    width={150}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip formatter={(value) => `${Math.round(value as number)}%`} />
                  <Bar dataKey="failure_rate" fill="#F44336" name="Failure Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Workflow Performance Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Workflow Performance Summary
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                        Workflow
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        Total
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        Completed
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        Failed
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        Success Rate
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                        Avg Duration
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {workflowPerformance.map((perf, idx) => (
                      <tr
                        key={idx}
                        style={{
                          backgroundColor: idx % 2 === 0 ? '#fafafa' : 'white',
                          borderBottom: '1px solid #eee',
                        }}
                      >
                        <td style={{ padding: '12px' }}>{perf.workflow_name}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>{perf.total}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#4CAF50' }}>
                          {perf.completed}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#F44336' }}>
                          {perf.failed}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {Math.round(perf.success_rate)}%
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {formatDuration(perf.avg_duration)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
