import { useEffect } from 'react'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  Grid,
  Stack,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../state/hooks'
import { deleteWorkflow, loadWorkflows } from '../state/workflowSlice'
import { LoadingSpinner } from '@shared/components'
import { formatDateTime } from '@shared/utils'

export default function WorkflowList(): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { workflows, loading, deleting } = useAppSelector((state) => state.workflows)

  useEffect(() => {
    dispatch(loadWorkflows())
  }, [dispatch])

  const handleDelete = async (workflowId: string) => {
    if (!window.confirm('Delete this workflow? This action cannot be undone.')) {
      return
    }
    await dispatch(deleteWorkflow(workflowId))
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4">Workflows</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/builder/new')}
          >
            New Workflow
          </Button>
        </Box>

        {loading ? (
          <LoadingSpinner message="Loading workflows…" />
        ) : workflows.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary">
              No workflows yet. Create one to get started!
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/builder/new')}>
              Create Workflow
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {workflows.map((workflow) => (
              <Grid item xs={12} md={6} lg={4} key={workflow.workflow_id}>
                <Card
                  variant="outlined"
                  sx={{
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      boxShadow: 3,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            bgcolor: workflow.published ? 'success.main' : 'warning.main',
                            fontSize: '0.875rem',
                          }}
                        >
                          {workflow.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                            {workflow.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            v{workflow.version}
                          </Typography>
                        </Box>
                      </Stack>
                      <Stack direction="row" spacing={0.5}>
                        <Chip
                          label={workflow.published ? 'PUBLISHED' : 'DRAFT'}
                          size="small"
                          color={workflow.published ? 'success' : 'warning'}
                          variant={workflow.published ? 'filled' : 'outlined'}
                        />
                        {workflow.enabled ? (
                          <Chip
                            label="ENABLED"
                            size="small"
                            color="primary"
                            variant="outlined"
                            icon={<CheckCircleIcon />}
                          />
                        ) : (
                          <Chip
                            label="DISABLED"
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Stack>

                    <Typography color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                      {workflow.description || 'No description available'}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                      {workflow.tags.map((tag) => (
                        <Chip
                          key={tag}
                          label={tag}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                    </Stack>

                    <Stack spacing={0.5}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                          Created:
                        </Typography>
                        <Typography variant="body2">
                          {formatDateTime(workflow.created_at)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
                          Modified:
                        </Typography>
                        <Typography variant="body2">
                          {formatDateTime(workflow.modified_at)}
                        </Typography>
                      </Stack>
                      {workflow.schedule && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <ScheduleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            Scheduled: {workflow.schedule}
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>

                  <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => navigate(`/builder/${workflow.workflow_id}`)}
                        sx={{ flex: 1 }}
                      >
                        Edit
                      </Button>
                      <Tooltip title="Test Workflow">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => navigate(`/builder/${workflow.workflow_id}?test=true`)}
                        >
                          <PlayArrowIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Workflow">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(workflow.workflow_id)}
                          disabled={deleting}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  )
}
