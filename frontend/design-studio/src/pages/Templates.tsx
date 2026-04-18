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
  Chip,
} from '@mui/material'
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks'
import AddIcon from '@mui/icons-material/Add'
import DownloadIcon from '@mui/icons-material/Download'
import UploadIcon from '@mui/icons-material/Upload'

export default function Templates(): JSX.Element {
  const templateCategories = [
    {
      title: 'Document Workflows',
      description: 'Templates for document processing, approval, and management',
      icon: <LibraryBooksIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      count: 12,
      color: 'primary',
    },
    {
      title: 'Approval Processes',
      description: 'Multi-step approval workflows with escalation rules',
      icon: <LibraryBooksIcon sx={{ fontSize: 40, color: 'success.main' }} />,
      count: 8,
      color: 'success',
    },
    {
      title: 'Integration Templates',
      description: 'Pre-built connectors for external systems',
      icon: <LibraryBooksIcon sx={{ fontSize: 40, color: 'warning.main' }} />,
      count: 15,
      color: 'warning',
    },
  ]

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Workflow Templates
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Pre-built workflow templates to accelerate your automation projects
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<UploadIcon />}>
              Import Template
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
              Create Template
            </Button>
          </Stack>
        </Stack>

        <Grid container spacing={3}>
          {templateCategories.map((category) => (
            <Grid item xs={12} md={4} key={category.title}>
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
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <Avatar
                    sx={{
                      width: 64,
                      height: 64,
                      mx: 'auto',
                      mb: 2,
                      bgcolor: `${category.color}.light`,
                    }}
                  >
                    {category.icon}
                  </Avatar>
                  <Typography variant="h6" gutterBottom>
                    {category.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {category.description}
                  </Typography>
                  <Chip
                    label={`${category.count} templates`}
                    color={category.color as any}
                    size="small"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Need a Custom Template?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Don&apos;t see what you need? Create your own template from scratch or modify existing ones.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="outlined" startIcon={<DownloadIcon />}>
              Browse Marketplace
            </Button>
            <Button variant="contained" startIcon={<AddIcon />}>
              Build Custom Template
            </Button>
          </Stack>
        </Box>
      </Box>
    </Container>
  )
}
