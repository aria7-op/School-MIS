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
import DownloadIcon from '@mui/icons-material/Download';
import TimelineIcon from '@mui/icons-material/Timeline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import useQuantumEvolution from '../hooks/useQuantumEvolution';
import { QueryClient, QueryClientProvider } from 'react-query';

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

  // If config is undefined, don't render the modal
  if (!config || !config.population || !config.quantum || !config.evolution) {
    return null;
  }

  const defaultConfig = {
    population: {
      size: 100,
      numGenes: 50,
      initializationStrategy: 'quantum',
    },
    quantum: {
      entanglementThreshold: 0.7,
      superpositionDecayRate: 0.01,
      phaseRotationAngle: Math.PI / 4,
      measurementStrategy: 'probabilistic',
    },
    evolution: {
      maxGenerations: 1000,
      mutationRate: 0.01,
      crossoverRate: 0.8,
      selectionPressure: 0.1,
      adaptiveParameters: true,
    },
    objectives: [
      {
        id: 'efficiency',
        name: 'System Efficiency',
        weight: 0.4,
        target: 'maximize',
        constraints: {
          min: 0,
          max: 1,
          type: 'soft',
        },
      },
      {
        id: 'complexity',
        name: 'Solution Complexity',
        weight: 0.3,
        target: 'minimize',
        constraints: {
          min: 0,
          max: 1,
          type: 'soft',
        },
      },
      {
        id: 'stability',
        name: 'System Stability',
        weight: 0.3,
        target: 'maximize',
        constraints: {
          min: 0.5,
          max: 1,
          type: 'hard',
        },
      },
    ],
    constraints: {
      timeLimit: 3600,
      resourceLimit: 1000,
      diversityThreshold: 0.1,
    },
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Configure Quantum Evolution</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>Population Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Population Size"
                type="number"
                value={localConfig.population.size}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  population: {
                    ...localConfig.population,
                    size: parseInt(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Genes"
                type="number"
                value={localConfig.population.numGenes}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  population: {
                    ...localConfig.population,
                    numGenes: parseInt(e.target.value),
                  },
                })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Quantum Parameters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Entanglement Threshold"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                value={localConfig.quantum.entanglementThreshold}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  quantum: {
                    ...localConfig.quantum,
                    entanglementThreshold: parseFloat(e.target.value),
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
                  <MenuItem value="probabilistic">Probabilistic</MenuItem>
                  <MenuItem value="deterministic">Deterministic</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Evolution Parameters</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Mutation Rate"
                type="number"
                inputProps={{ step: 0.01, min: 0, max: 1 }}
                value={localConfig.evolution.mutationRate}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  evolution: {
                    ...localConfig.evolution,
                    mutationRate: parseFloat(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Crossover Rate"
                type="number"
                inputProps={{ step: 0.1, min: 0, max: 1 }}
                value={localConfig.evolution.crossoverRate}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  evolution: {
                    ...localConfig.evolution,
                    crossoverRate: parseFloat(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.evolution.adaptiveParameters}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      evolution: {
                        ...localConfig.evolution,
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

const QuantumEvolutionAnalyticsContent: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const {
    evolutionState,
    error,
    evolve,
    reset,
    isLoading,
  } = useQuantumEvolution();

  const handleConfigSave = useCallback((newConfig) => {
    reset();
    // Implementation for config update
  }, [reset]);

  const toggleEvolution = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      evolve();
    }
  }, [isRunning, evolve]);

  const fitnessData = useMemo(() => {
    if (!evolutionState?.metrics) return null;

    const generations = Array.from({ length: evolutionState.generation + 1 }, (_, i) => i);
    return {
      labels: generations,
      datasets: [
        {
          label: 'Best Fitness',
          data: generations.map(() => evolutionState.metrics.populationStats.bestFitness),
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
        },
        {
          label: 'Average Fitness',
          data: generations.map(() => evolutionState.metrics.populationStats.averageFitness),
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
        },
      ],
    };
  }, [evolutionState]);

  const quantumMetricsData = useMemo(() => {
    if (!evolutionState?.metrics) return null;

    return {
      labels: ['Entanglement', 'Superposition', 'Quantum Advantage'],
      datasets: [{
        label: 'Quantum Metrics',
        data: [
          evolutionState.metrics.quantumMetrics.entanglementStrength,
          evolutionState.metrics.quantumMetrics.superpositionQuality,
          evolutionState.metrics.quantumMetrics.quantumAdvantage,
        ],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        borderColor: 'rgb(153, 102, 255)',
        borderWidth: 1,
      }],
    };
  }, [evolutionState]);

  const objectiveProgressData = useMemo(() => {
    if (!evolutionState?.metrics) return null;

    return {
      labels: evolutionState.metrics.objectives.map(obj => obj.id),
      datasets: [
        {
          label: 'Current Value',
          data: evolutionState.metrics.objectives.map(obj => obj.currentValue),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Improvement Rate',
          data: evolutionState.metrics.objectives.map(obj => obj.improvement),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  }, [evolutionState]);

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error in quantum evolution: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quantum Evolution Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color={isRunning ? 'secondary' : 'primary'}
            startIcon={isRunning ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={toggleEvolution}
            disabled={isLoading}
          >
            {isRunning ? 'Pause' : 'Start'} Evolution
          </Button>
          <Tooltip title="Reset Evolution">
            <IconButton onClick={reset} disabled={isRunning}>
              <RestartAltIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Configure Evolution">
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
        {/* Fitness Progress */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Fitness Progress
                <Tooltip title="Evolution fitness over generations">
                  <IconButton size="small">
                    <TimelineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {fitnessData && (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={fitnessData}
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
                <Tooltip title="Quantum-specific performance metrics">
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

        {/* Objective Progress */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Objective Progress
                <Tooltip title="Progress across multiple objectives">
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
                        },
                      },
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Evolution Status */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Evolution Status</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Generation
                    </Typography>
                    <Typography variant="h4">
                      {evolutionState?.generation || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Best Fitness
                    </Typography>
                    <Typography variant="h4">
                      {evolutionState?.metrics?.populationStats.bestFitness.toFixed(4) || 0}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Quantum Advantage
                    </Typography>
                    <Typography variant="h4">
                      {evolutionState?.metrics?.quantumMetrics.quantumAdvantage.toFixed(4) || 0}
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
        config={{
          population: {
            size: 100,
            numGenes: 50,
            initializationStrategy: 'quantum',
          },
          quantum: {
            entanglementThreshold: 0.7,
            superpositionDecayRate: 0.01,
            phaseRotationAngle: Math.PI / 4,
            measurementStrategy: 'probabilistic',
          },
          evolution: {
            maxGenerations: 1000,
            mutationRate: 0.01,
            crossoverRate: 0.8,
            selectionPressure: 0.1,
            adaptiveParameters: true,
          },
          objectives: [
            {
              id: 'efficiency',
              name: 'System Efficiency',
              weight: 0.4,
              target: 'maximize',
              constraints: {
                min: 0,
                max: 1,
                type: 'soft',
              },
            },
            {
              id: 'complexity',
              name: 'Solution Complexity',
              weight: 0.3,
              target: 'minimize',
              constraints: {
                min: 0,
                max: 1,
                type: 'soft',
              },
            },
            {
              id: 'stability',
              name: 'System Stability',
              weight: 0.3,
              target: 'maximize',
              constraints: {
                min: 0.5,
                max: 1,
                type: 'hard',
              },
            },
          ],
          constraints: {
            timeLimit: 3600,
            resourceLimit: 1000,
            diversityThreshold: 0.1,
          },
        }}
        onSave={handleConfigSave}
      />
    </Box>
  );
};

const QuantumEvolutionAnalytics: React.FC = () => {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <QuantumEvolutionAnalyticsContent />
    </QueryClientProvider>
  );
};

export default QuantumEvolutionAnalytics;
