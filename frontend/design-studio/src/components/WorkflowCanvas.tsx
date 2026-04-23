import { useCallback, useEffect, useMemo } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type EdgeChange,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { WorkflowDefinition, WorkflowStep } from '@agenticai/shared'

interface WorkflowCanvasProps {
  workflow: WorkflowDefinition | null
}

function buildNodes(workflow: WorkflowDefinition | null): Node[] {
  if (!workflow) return []

  const nodes: Node[] = []

  nodes.push({
    id: 'start',
    type: 'default',
    data: { label: 'Trigger Event' },
    position: { x: 0, y: 0 },
    style: { width: 200, padding: 16 },
  })

  workflow.steps.forEach((step, index) => {
    nodes.push({
      id: step.step_id,
      type: 'default',
      data: { label: step.name, step },
      position: { x: (index + 1) * 300, y: 0 },
      style: { width: 220, padding: 16 },
    })
  })

  nodes.push({
    id: 'end',
    type: 'default',
    data: { label: 'Complete Workflow' },
    position: { x: (workflow.steps.length + 1) * 300, y: 0 },
    style: { width: 220, padding: 16 },
  })

  return nodes
}

function buildEdges(workflow: WorkflowDefinition | null): Edge[] {
  if (!workflow) return []

  const edges: Edge[] = []

  edges.push({
    id: 'e-start-1',
    source: 'start',
    target: workflow.steps[0]?.step_id || 'end',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
  })

  for (let i = 0; i < workflow.steps.length - 1; i++) {
    edges.push({
      id: `e-${i + 1}-${i + 2}`,
      source: workflow.steps[i].step_id,
      target: workflow.steps[i + 1].step_id,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    })
  }

  if (workflow.steps.length > 0) {
    edges.push({
      id: `e-${workflow.steps.length}-end`,
      source: workflow.steps[workflow.steps.length - 1].step_id,
      target: 'end',
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
    })
  }

  return edges
}

export default function WorkflowCanvas({ workflow }: WorkflowCanvasProps): JSX.Element {
  const workflowNodes = useMemo(() => buildNodes(workflow), [workflow])
  const workflowEdges = useMemo(() => buildEdges(workflow), [workflow])

  const [nodes, setNodes, onNodesChange] = useNodesState(workflowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflowEdges)

  useEffect(() => {
    setNodes(workflowNodes)
    setEdges(workflowEdges)
  }, [workflowNodes, workflowEdges, setNodes, setEdges])

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge(connection, eds))
    },
    [setEdges]
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes)
    },
    [onNodesChange]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes)
    },
    [onEdgesChange]
  )

  const legend = useMemo(
    () => [
      { label: 'Trigger event', color: '#1976d2' },
      { label: 'Connector step', color: '#9c27b0' },
      { label: 'Agent decision', color: '#ec407a' },
      { label: 'Complete workflow', color: '#43a047' },
    ],
    []
  )

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
      <Card variant="outlined" sx={{ p: 2, mb: 1 }}>
        <CardContent sx={{ '& p': { mb: 0 } }}>
          <Typography variant="subtitle2" color="textSecondary">
            Drag nodes, connect edges, and inspect the workflow path. Use the canvas to prototype
            workflow execution flows with connectors, agents, and branches.
          </Typography>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
        <Box
          id="workflow-canvas"
          sx={{
            flex: 1,
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 2,
            overflow: 'hidden',
            minHeight: 520,
            position: 'relative',
          }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            fitView
            minZoom={0.5}
            maxZoom={2}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <>
              <Background color="#aaa" gap={16} />
              <Controls showInteractive={false} />
              <MiniMap
                nodeStrokeColor={(node): string => {
                  if (node.id === 'start') return '#1976d2'
                  if (node.id === 'end') return '#43a047'
                  const step = (node.data as any)?.step as WorkflowStep | undefined
                  if (step?.step_type === 'connector') return '#9c27b0'
                  if (step?.step_type === 'agent') return '#ec407a'
                  return '#ff9800'
                }}
                nodeColor={(node): string => {
                  if (node.id === 'start') return '#bbdefb'
                  if (node.id === 'end') return '#c8e6c9'
                  const step = (node.data as any)?.step as WorkflowStep | undefined
                  if (step?.step_type === 'connector') return '#e1bee7'
                  if (step?.step_type === 'agent') return '#f8bbd0'
                  return '#fff3e0'
                }}
              />
            </>
          </ReactFlow>
        </Box>

        <Box sx={{ width: 280, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Card variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Canvas Legend
            </Typography>
            {legend.map((item) => (
              <Box
                key={item.label}
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
              >
                <Box sx={{ width: 16, height: 16, borderRadius: 1, background: item.color }} />
                <Typography variant="body2">{item.label}</Typography>
              </Box>
            ))}
          </Card>

          <Card variant="outlined" sx={{ p: 2, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Quick Actions
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Connect new nodes by dragging from the output handle of any node. Use standard
              modifiers to pan and zoom in the canvas.
            </Typography>
          </Card>
        </Box>
      </Box>
    </Box>
  )
}