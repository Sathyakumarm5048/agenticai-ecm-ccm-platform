import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Stack,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
} from '@mui/material'
import SettingsIcon from '@mui/icons-material/Settings'
import SecurityIcon from '@mui/icons-material/Security'
import NotificationsIcon from '@mui/icons-material/Notifications'
import StorageIcon from '@mui/icons-material/Storage'
import PeopleIcon from '@mui/icons-material/People'
import IntegrationIcon from '@mui/icons-material/IntegrationInstructions'
import SaveIcon from '@mui/icons-material/Save'

export default function Configuration(): JSX.Element {
  const configSections = [
    {
      title: 'Workflow Settings',
      description: 'Configure default workflow behaviors and limits',
      icon: <SettingsIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      items: [
        'Default approval timeouts',
        'Maximum workflow steps',
        'Auto-save intervals',
        'Version retention policy',
      ],
    },
    {
      title: 'Security & Access',
      description: 'Manage permissions and security policies',
      icon: <SecurityIcon sx={{ fontSize: 40, color: 'error.main' }} />,
      items: [
        'User roles and permissions',
        'Workflow access controls',
        'Audit logging settings',
        'Encryption policies',
      ],
    },
    {
      title: 'Notifications',
      description: 'Configure alerts and notification preferences',
      icon: <NotificationsIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      items: [
        'Email notification templates',
        'Slack integration settings',
        'Alert thresholds',
        'Escalation rules',
      ],
    },
    {
      title: 'Data Management',
      description: 'Configure data storage and backup policies',
      icon: <StorageIcon sx={{ fontSize: 40, color: 'info.main' }} />,
      items: [
        'Database connections',
        'Backup schedules',
        'Data retention policies',
        'Export settings',
      ],
    },
    {
      title: 'User Management',
      description: 'Manage users, teams, and organizations',
      icon: <PeopleIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      items: [
        'User invitations',
        'Team management',
        'Organization settings',
        'SSO configuration',
      ],
    },
    {
      title: 'Integrations',
      description: 'Connect external systems and APIs',
      icon: <IntegrationIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      items: [
        'API key management',
        'Webhook configurations',
        'External service connections',
        'Custom connectors',
      ],
    },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage system settings, security policies, and integrations
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<SaveIcon />}>
            Save Changes
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {configSections.map((section) => (
            <Grid item xs={12} md={6} key={section.title}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'grey.100' }}>
                      {section.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{section.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {section.description}
                      </Typography>
                    </Box>
                  </Stack>

                  <List dense>
                    {section.items.map((item) => (
                      <ListItem key={item} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <Box
                            sx={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                            }}
                          />
                        </ListItemIcon>
                        <ListItemText
                          primary={item}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ my: 2 }} />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                      Quick Actions
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined">
                        Configure
                      </Button>
                      <Switch size="small" defaultChecked />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, p: 3, bgcolor: 'primary.light', borderRadius: 2, color: 'white' }}>
          <Typography variant="h6" gutterBottom>
            System Health
          </Typography>
          <Stack spacing={1}>
            <Typography variant="body2">
              • Database: Connected ✓
            </Typography>
            <Typography variant="body2">
              • API Services: Operational ✓
            </Typography>
            <Typography variant="body2">
              • Background Jobs: Running ✓
            </Typography>
            <Typography variant="body2">
              • Last Backup: 2 hours ago ✓
            </Typography>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}
