import { Routes, Route } from 'react-router-dom'
import { Box } from '@mui/material'
import { Layout } from '@shared/components'
import { useWebSocket } from './hooks/useWebSocket'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import ExecutionComparison from './pages/ExecutionComparison'
import WorkflowExecution from './pages/WorkflowExecution'
import ExecutionHistory from './pages/ExecutionHistory'

function App(): JSX.Element {
  // Initialize WebSocket connection for real-time updates
  useWebSocket()

  return (
    <Layout>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/comparison" element={<ExecutionComparison />} />
          <Route path="/execution/:executionId" element={<WorkflowExecution />} />
          <Route path="/history" element={<ExecutionHistory />} />
        </Routes>
      </Box>
    </Layout>
  )
}

export default App