import { useEffect } from 'react'
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../state/hooks.js'
import { deleteWorkflow, loadWorkflows } from '../state/workflowSlice.js'
import { LoadingSpinner } from '@agenticai/shared'
import WorkflowCard from '../components/WorkflowCard.js'

export default function WorkflowList(): JSX.Element {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { workflows, loading, deleting } = useAppSelector((state) => state.workflows)

  useEffect(() => {
    dispatch(loadWorkflows())
  }, [dispatch])

  const handleDelete = async (workflowId: string) => {
    if (!window.confirm('Delete this workflow? This action cannot be undone.')) return
    await dispatch(deleteWorkflow(workflowId))
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
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

        {/* Loading */}
        {loading && <LoadingSpinner message="Loading workflows…" />}

        {/* Empty State */}
        {!loading && workflows.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="textSecondary">
              No workflows yet. Create one to get started!
            </Typography>
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/builder/new')}>
              Create Workflow
            </Button>
          </Box>
        )}

        {/* Workflow Grid */}
        {!loading && workflows.length > 0 && (
          <Grid container spacing={3}>
            {workflows.map((workflow) => (
              <Grid item xs={12} md={6} lg={4} key={workflow.workflow_id}>
                <WorkflowCard
                  workflow={workflow}
                  deleting={deleting}
                  onDelete={handleDelete}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  )
}