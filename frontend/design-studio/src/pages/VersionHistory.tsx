import { useParams } from 'react-router-dom'
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Divider,
  Button,
  Stack,
} from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import RestoreIcon from '@mui/icons-material/Restore'
import CompareIcon from '@mui/icons-material/Compare'
import { formatDateTime } from "@agenticai/shared"

export default function VersionHistory(): JSX.Element {
  const { workflowId } = useParams()

  // Mock version history data
  const versionHistory = [
    {
      version: 3,
      author: 'John Doe',
      timestamp: new Date('2024-03-01T12:30:00Z'),
      changes: 'Updated approval rules and added new validation step',
      status: 'current',
    },
    {
      version: 2,
      author: 'Jane Smith',
      timestamp: new Date('2024-02-15T10:15:00Z'),
      changes: 'Added email notifications and improved error handling',
      status: 'previous',
    },
    {
      version: 1,
      author: 'System',
      timestamp: new Date('2024-01-20T09:00:00Z'),
      changes: 'Initial workflow creation with basic approval flow',
      status: 'archived',
    },
  ]

  if (!workflowId) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Alert severity="info">
            <Typography variant="h6">Select a workflow to view its version history</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              Go to the Workflows section and select a workflow to see its edit history and versions.
            </Typography>
          </Alert>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Version History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Track changes and restore previous versions of workflow {workflowId.slice(-4)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<CompareIcon />}>
              Compare Versions
            </Button>
            <Button variant="contained" startIcon={<RestoreIcon />}>
              Restore Version
            </Button>
          </Stack>
        </Stack>

        <Card>
          <CardContent sx={{ p: 0 }}>
            <List>
              {versionHistory.map((version, index) => (
                <Box key={version.version}>
                  <ListItem sx={{ py: 3 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: version.status === 'current' ? 'primary.main' : 'grey.400' }}>
                        <HistoryIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Typography variant="h6">
                            Version {version.version}
                          </Typography>
                          <Chip
                            label={version.status.toUpperCase()}
                            size="small"
                            color={version.status === 'current' ? 'primary' : 'default'}
                            variant={version.status === 'current' ? 'filled' : 'outlined'}
                          />
                        </Stack>
                      }
                      secondary={
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {version.changes}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              by {version.author}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDateTime(version.timestamp)}
                            </Typography>
                          </Stack>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < versionHistory.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Version Control Features
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Automatic versioning on every save<br />
            • Compare versions side-by-side<br />
            • Restore previous versions<br />
            • Audit trail of all changes<br />
            • Rollback capabilities
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
