import {
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import ScheduleIcon from '@mui/icons-material/Schedule'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { useNavigate } from 'react-router-dom'
import { formatDateTime } from '@agenticai/shared'

export default function WorkflowCard({ workflow, deleting, onDelete }) {
  const navigate = useNavigate()

  return (
    <Card
      variant="outlined"
      sx={{
        minHeight: 280,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        '&:hover': { boxShadow: 3, transform: 'translateY(-2px)' },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header */}
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
              <Chip label="DISABLED" size="small" variant="outlined" />
            )}
          </Stack>
        </Stack>

        {/* Description */}
        <Typography color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
          {workflow.description || 'No description available'}
        </Typography>

        {/* Tags */}
        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
          {workflow.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
          ))}
        </Stack>

        {/* Metadata */}
        <Stack spacing={0.5}>
          <MetaRow label="Created:" value={formatDateTime(workflow.created_at)} />
          <MetaRow label="Modified:" value={formatDateTime(workflow.modified_at)} />

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

      {/* Actions */}
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
              onClick={() => onDelete(workflow.workflow_id)}
              disabled={deleting}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  )
}

function MetaRow({ label, value }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  )
}