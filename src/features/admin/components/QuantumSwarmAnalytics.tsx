import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Alert,
  Paper,
  Divider,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  Line,
  Bar,
  Scatter,
  Radar,
  Bubble,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import TimelineIcon from '@mui/icons-material/Timeline';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import useQuantumSwarm from '../hooks/useQuantumSwarm';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;
  config: any;
  onSave: (config: any) => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ open, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure Quantum Swarm</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>Swarm Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Particles"
                type="number"
                value={localConfig.swarm.numParticles}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  swarm: {
                    ...localConfig.swarm,
                    numParticles: parseInt(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Topology</InputLabel>
                <Select
                  value={localConfig.swarm.topology}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    swarm: {
                      ...localConfig.swarm,
                      topology: e.target.value,
                    },
                  })}
                >
                  <MenuItem value="global">Global</MenuItem>
                  <MenuItem value="ring">Ring</MenuItem>
                  <MenuItem value="adaptive">Adaptive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Quantum Parameters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entanglement Strength"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                value={localConfig.quantum.entanglementStrength}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  quantum: {
                    ...localConfig.quantum,
                    entanglementStrength: parseFloat(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Measurement Strategy</InputLabel>
                <Select
                  value={localConfig.quantum.measurementStrategy}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    quantum: {
                      ...localConfig.quantum,
                      measurementStrategy: e.target.value,
                    },
                  })}
                >
                  <MenuItem value="collapse">Collapse</MenuItem>
                  <MenuItem value="weak">Weak</MenuItem>
                  <MenuItem value="adaptive">Adaptive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Optimization Parameters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Inertia Weight"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                value={localConfig.optimization.inertiaWeight}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  optimization: {
                    ...localConfig.optimization,
                    inertiaWeight: parseFloat(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Quantum Factor"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                value={localConfig.optimization.quantumFactor}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  optimization: {
                    ...localConfig.optimization,
                    quantumFactor: parseFloat(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.optimization.adaptiveParameters}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      optimization: {
                        ...localConfig.optimization,
                        adaptiveParameters: e.target.checked,
                      },
                    })}
                  />
                }
                label="Adaptive Parameters"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Configuration
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const QuantumSwarmAnalytics: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const {
    optimizationState,
    error,
    optimize,
    reset,
    isLoading,
  } = useQuantumSwarm();

  const handleConfigSave = useCallback((newConfig) => {
    reset();
    // Implementation for config update
  }, [reset]);

  const toggleOptimization = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      optimize();
    }
  }, [isRunning, optimize]);

  const convergenceData = useMemo(() => {
    if (!optimizationState?.metrics) return null;

    return {
      labels: ['Rate', 'Stability', 'Diversity'],
      datasets: [{
        label: 'Convergence Metrics',
        data: [
          optimizationState.metrics.convergence.rate,
          optimizationState.metrics.convergence.stability,
          optimizationState.metrics.convergence.diversity,
        ],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgb(75, 192, 192)',
        borderWidth: 1,
      }],
    };
  }, [optimizationState]);

  const quantumMetricsData = useMemo(() => {
    if (!optimizationState?.metrics) return null;

    return {
      labels: ['Entanglement', 'Coherence', 'Quantum Speedup'],
      datasets: [{
        label: 'Quantum Metrics',
        data: [
          optimizationState.metrics.quantum.entanglementStrength,
          optimizationState.metrics.quantum.coherenceQuality,
          optimizationState.metrics.quantum.quantumSpeedup,
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1,
      }],
    };
  }, [optimizationState]);

  const performanceData = useMemo(() => {
    if (!optimizationState?.metrics) return null;

    const iterations = Array.from({ length: optimizationState.iteration + 1 }, (_, i) => i);
    return {
      labels: iterations,
      datasets: [
        {
          label: 'Best Fitness',
          data: iterations.map(() => optimizationState.metrics.performance.bestFitness),
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
        },
        {
          label: 'Average Fitness',
          data: iterations.map(() => optimizationState.metrics.performance.averageFitness),
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
        },
      ],
    };
  }, [optimizationState]);

  const objectiveProgressData = useMemo(() => {
    if (!optimizationState?.metrics) return null;

    return {
      labels: optimizationState.metrics.objectives.map(obj => obj.id),
      datasets: [
        {
          label: 'Current Value',
          data: optimizationState.metrics.objectives.map(obj => obj.value),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Constraint Satisfaction',
          data: optimizationState.metrics.objectives.map(obj => obj.constraintSatisfaction),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  }, [optimizationState]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error in quantum swarm optimization: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quantum Swarm Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color={isRunning ? 'secondary' : 'primary'}
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={toggleOptimization}
            disabled={isLoading}
          >
            {isRunning ? 'Pause' : 'Start'} Optimization
          </Button>
          <Tooltip title="Reset Optimization">
            <IconButton onClick={reset} disabled={isRunning}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Configure Swarm">
            <IconButton onClick={() => setConfigModalOpen(true)} disabled={isRunning}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {isLoading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Performance Progress */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Performance Progress
                <Tooltip title="Fitness evolution over iterations">
                  <IconButton size="small">
                    <TimelineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {performanceData && (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={performanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quantum Metrics */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quantum Metrics
                <Tooltip title="Quantum-specific performance indicators">
                  <IconButton size="small">
                    <BubbleChartIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {quantumMetricsData && (
                <Box sx={{ height: 300 }}>
                  <Radar
                    data={quantumMetricsData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        r: {
                          beginAtZero: true,
                          max: 1,
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Convergence Analysis */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Convergence Analysis
                <Tooltip title="Swarm convergence metrics">
                  <IconButton size="small">
                    <ScatterPlotIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {convergenceData && (
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={convergenceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 1,
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Objective Progress */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Objective Progress
                <Tooltip title="Progress across optimization objectives">
                  <IconButton size="small">
                    <TrendingUpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {objectiveProgressData && (
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={objectiveProgressData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 1,
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Optimization Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Optimization Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Iteration
                    </Typography>
                    <Typography variant="h4">
                      {optimizationState?.iteration || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Best Fitness
                    </Typography>
                    <Typography variant="h4">
                      {optimizationState?.metrics?.performance.bestFitness.toFixed(4) || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Quantum Speedup
                    </Typography>
                    <Typography variant="h4">
                      {optimizationState?.metrics?.quantum.quantumSpeedup.toFixed(2) || 0}x
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Convergence Rate
                    </Typography>
                    <Typography variant="h4">
                      {(optimizationState?.metrics?.convergence.rate * 100).toFixed(1) || 0}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={optimizationState?.config}
        onSave={handleConfigSave}
      />
    </Box>
  );
};

export default QuantumSwarmAnalytics;
