import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import { Box } from '@mui/material'
import { Layout } from '@shared/components'
import WorkflowBuilder from './pages/WorkflowBuilder'
import WorkflowList from './pages/WorkflowList'
import VersionHistory from './pages/VersionHistory'
import Templates from './pages/Templates'
import Configuration from './pages/Configuration'

function AppShell(): JSX.Element {
  const navigate = useNavigate()

  return (
    <Layout
      title="AgenticAI Design Studio"
      navItems={[
        { label: 'Workflows', href: '/' },
        { label: 'Templates', href: '/templates' },
        { label: 'History', href: '/versions' },
        { label: 'Configuration', href: '/admin' },
      ]}
      onNavigate={navigate}
    >
      <Box sx={{ p: 3 }}>
        <Routes>
          <Route path="/" element={<WorkflowList />} />
          <Route path="/builder/:workflowId" element={<WorkflowBuilder />} />
          <Route path="/builder/new" element={<WorkflowBuilder />} />
          <Route path="/versions/:workflowId" element={<VersionHistory />} />
          <Route path="/versions" element={<VersionHistory />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/admin" element={<Configuration />} />
        </Routes>
      </Box>
    </Layout>
  )
}

export default function App(): JSX.Element {
  return (
    <Router>
      <AppShell />
    </Router>
  )
}

