import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  LinearProgress,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Schedule as PendingIcon,
  PlayArrow as RunningIcon,
} from "@mui/icons-material";
import { WorkflowExecution, ExecutionStatus } from "@shared/types";
import { getTestExecutionStatus } from "../services/testExecutionApi";

interface TestExecutionDialogProps {
  open: boolean;
  execution: WorkflowExecution | null;
  onClose: () => void;
}

export default function TestExecutionDialog({
  open,
  execution,
  onClose,
}: TestExecutionDialogProps): JSX.Element {
  const [currentExecution, setCurrentExecution] = useState<WorkflowExecution | null>(execution);

  // Convert ISO timestamps to seconds
  const computeDuration = (start?: string, end?: string) => {
    if (!start || !end) return undefined;
    const s = new Date(start).getTime();
    const e = new Date(end).getTime();
    return Math.max(0, Math.floor((e - s) / 1000));
  };

  useEffect(() => {
    if (execution && open) {
      setCurrentExecution(execution);

      if (execution.status === "running" || execution.status === "pending") {
        const pollInterval = setInterval(async () => {
          try {
            const updated = await getTestExecutionStatus(execution.id);
            setCurrentExecution(updated);

            if (updated.status !== "running" && updated.status !== "pending") {
              clearInterval(pollInterval);
            }
          } catch (error) {
            console.error("Failed to fetch execution status:", error);
          }
        }, 1000);

        return () => clearInterval(pollInterval);
      }
    }
  }, [execution, open]);

  if (!currentExecution) {
    return <Dialog open={open} onClose={onClose} />;
  }

  // -----------------------------
  // STATUS ICONS + COLORS
  // -----------------------------
  const getStatusIcon = (status: ExecutionStatus) => {
    switch (status) {
      case "succeeded":
        return <SuccessIcon color="success" />;
      case "failed":
        return <ErrorIcon color="error" />;
      case "running":
        return <RunningIcon color="primary" />;
      case "pending":
        return <PendingIcon color="action" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ExecutionStatus) => {
    switch (status) {
      case "succeeded":
        return "success";
      case "failed":
        return "error";
      case "running":
        return "primary";
      case "pending":
        return "default";
      default:
        return "warning";
    }
  };

  const isRunning =
    currentExecution.status === "running" || currentExecution.status === "pending";

  const completedSteps = currentExecution.steps.filter(
    (s) => s.status === "succeeded" || s.status === "failed"
  ).length;

  const progressPercent =
    currentExecution.steps.length > 0
      ? (completedSteps / currentExecution.steps.length) * 100
      : 0;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const totalDuration = computeDuration(
    currentExecution.started_at,
    currentExecution.finished_at
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {getStatusIcon(currentExecution.status)}
          Workflow Test Execution
          <Chip
            label={currentExecution.status}
            color={getStatusColor(currentExecution.status)}
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {isRunning && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Test execution in progress...</Typography>
            </Box>
          </Alert>
        )}

        {/* Progress */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Progress: {completedSteps} / {currentExecution.steps.length} steps completed
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progressPercent}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Execution Summary */}
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="body2" color="textSecondary">
              Execution ID
            </Typography>
            <Typography variant="body1">{currentExecution.id.slice(-8)}</Typography>
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary">
              Status
            </Typography>
            <Chip
              label={currentExecution.status}
              color={getStatusColor(currentExecution.status)}
              size="small"
            />
          </Box>

          <Box>
            <Typography variant="body2" color="textSecondary">
              Duration
            </Typography>
            <Typography variant="body1">{formatDuration(totalDuration)}</Typography>
          </Box>
        </Box>

        {/* Step Details */}
        {currentExecution.steps.length > 0 && (
          <>
            <Typography variant="subtitle2" gutterBottom>
              Step Execution Details
            </Typography>

            <TableContainer component={Paper} sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableCell>Step</TableCell>
                    <TableCell align="center">Status</TableCell>
                    <TableCell align="center">Duration</TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {currentExecution.steps.map((step) => {
                    const stepDuration = computeDuration(step.started_at, step.finished_at);

                    return (
                      <TableRow key={step.step_id}>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            {getStatusIcon(step.status)}
                            <Typography variant="body2">{step.name}</Typography>
                          </Box>
                        </TableCell>

                        <TableCell align="center">
                          <Chip
                            label={step.status}
                            color={getStatusColor(step.status)}
                            size="small"
                          />
                        </TableCell>

                        <TableCell align="center">
                          <Typography variant="body2">
                            {formatDuration(stepDuration)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}

        {/* Error Section */}
        {currentExecution.status === "failed" &&
          currentExecution.steps.some((s) => s.error_message) && (
            <>
              <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                Errors
              </Typography>

              <Box
                sx={{
                  backgroundColor: "#fff3cd",
                  p: 2,
                  borderRadius: 1,
                  borderLeft: "4px solid #ff6b6b",
                }}
              >
                {currentExecution.steps
                  .filter((s) => s.error_message)
                  .map((step) => (
                    <Box key={step.step_id} sx={{ mb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {step.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {step.error_message}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </>
          )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}