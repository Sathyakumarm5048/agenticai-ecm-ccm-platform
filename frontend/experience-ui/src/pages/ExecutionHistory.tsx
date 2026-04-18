import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Checkbox,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as RunningIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Stop as StopIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import {
  loadExecutions,
  setFilters,
  toggleExecutionSelection,
  selectAllExecutions,
  deselectAllExecutions,
  bulkRetry,
  bulkStop,
} from '../state/executionSlice'
import { ExecutionStatus } from '@shared/types'

export default function ExecutionHistory(): JSX.Element {
  const dispatch = useAppDispatch()
  const { executions, filters, selectedExecutionIds, bulkOperationInProgress } = useAppSelector((state) => state.executions)
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'retry' | 'stop' | null>(null)

  useEffect(() => {
    dispatch(loadExecutions())
  }, [dispatch])

  const handleFilterChange = () => {
    const newFilters = { ...filters }
    dispatch(setFilters(newFilters))
    dispatch(loadExecutions(newFilters))
  }

  const filteredExecutions = executions.filter(execution =>
    execution.execution_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    execution.workflow_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

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

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleBulkRetry = async () => {
    if (selectedExecutionIds.size === 0) return
    try {
      await dispatch(bulkRetry(Array.from(selectedExecutionIds))).unwrap()
      setConfirmDialogOpen(false)
      setBulkAction(null)
    } catch (error) {
      console.error('Bulk retry failed:', error)
    }
  }

  const handleBulkStop = async () => {
    if (selectedExecutionIds.size === 0) return
    try {
      await dispatch(bulkStop(Array.from(selectedExecutionIds))).unwrap()
      setConfirmDialogOpen(false)
      setBulkAction(null)
    } catch (error) {
      console.error('Bulk stop failed:', error)
    }
  }

  const handleConfirmBulkAction = async () => {
    if (bulkAction === 'retry') {
      await handleBulkRetry()
    } else if (bulkAction === 'stop') {
      await handleBulkStop()
    }
  }

  const isAllSelected = selectedExecutionIds.size === filteredExecutions.length && filteredExecutions.length > 0

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Execution History
      </Typography>

      {/* Bulk Actions Bar */}
      {selectedExecutionIds.size > 0 && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setBulkAction('retry')
                  setConfirmDialogOpen(true)
                }}
                disabled={bulkOperationInProgress}
              >
                Retry ({selectedExecutionIds.size})
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<StopIcon />}
                onClick={() => {
                  setBulkAction('stop')
                  setConfirmDialogOpen(true)
                }}
                disabled={bulkOperationInProgress}
              >
                Stop ({selectedExecutionIds.size})
              </Button>
              <Button
                size="small"
                onClick={() => dispatch(deselectAllExecutions())}
                disabled={bulkOperationInProgress}
              >
                Clear
              </Button>
            </Box>
          }
        >
          <Typography variant="body2">
            {selectedExecutionIds.size} execution(s) selected
          </Typography>
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                select
                fullWidth
                label="Status"
                value={filters.status || ''}
                onChange={(e) => {
                  const newFilters = { ...filters, status: e.target.value || null }
                  dispatch(setFilters(newFilters))
                  dispatch(loadExecutions(newFilters))
                }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="RUNNING">Running</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                variant="contained"
                onClick={handleFilterChange}
                fullWidth
              >
                Apply Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Executions Table */}
      <Card>
        <CardContent>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell width="50">
                    <Checkbox
                      indeterminate={selectedExecutionIds.size > 0 && !isAllSelected}
                      checked={isAllSelected}
                      onChange={() => {
                        if (isAllSelected) {
                          dispatch(deselectAllExecutions())
                        } else {
                          dispatch(selectAllExecutions())
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>Execution ID</TableCell>
                  <TableCell>Workflow</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Started</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Success Rate</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredExecutions.map((execution) => (
                  <TableRow
                    key={execution.execution_id}
                    hover
                    selected={selectedExecutionIds.has(execution.execution_id)}
                    sx={{
                      backgroundColor: selectedExecutionIds.has(execution.execution_id) ? '#f0f0f0' : 'inherit',
                      cursor: 'pointer',
                    }}
                  >
                    <TableCell width="50">
                      <Checkbox
                        checked={selectedExecutionIds.has(execution.execution_id)}
                        onChange={() => dispatch(toggleExecutionSelection(execution.execution_id))}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusIcon(execution.status)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {execution.execution_id.slice(-8)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {execution.workflow_id.slice(-8)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={execution.status}
                        size="small"
                        color={getStatusColor(execution.status)}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(execution.started_at).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDuration(execution.duration_seconds)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {Math.round(execution.success_rate * 100)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button
                        component={Link}
                        to={`/execution/${execution.execution_id}`}
                        size="small"
                        variant="outlined"
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredExecutions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography variant="body2" color="textSecondary">
                        No executions found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          Confirm {bulkAction === 'retry' ? 'Bulk Retry' : 'Bulk Stop'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to {bulkAction === 'retry' ? 'retry' : 'stop'} {selectedExecutionIds.size} execution(s)?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmBulkAction}
            variant="contained"
            color={bulkAction === 'stop' ? 'error' : 'primary'}
            disabled={bulkOperationInProgress}
          >
            {bulkOperationInProgress ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}