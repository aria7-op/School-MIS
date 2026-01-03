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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Line,
  Bar,
  Scatter,
  Radar,
  Bubble,
  Doughnut,
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { format } from 'date-fns';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TimelineIcon from '@mui/icons-material/Timeline';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import useQuantumRL from '../hooks/useQuantumRL';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
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
      <DialogTitle>Configure Quantum RL Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" gutterBottom>Environment Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Episodes"
                type="number"
                value={localConfig.environment.maxEpisodes}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  environment: {
                    ...localConfig.environment,
                    maxEpisodes: parseInt(e.target.value),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Max Steps Per Episode"
                type="number"
                value={localConfig.environment.maxStepsPerEpisode}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  environment: {
                    ...localConfig.environment,
                    maxStepsPerEpisode: parseInt(e.target.value),
                  },
                })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Agent Configuration</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Architecture</InputLabel>
                <Select
                  value={localConfig.agent.architecture}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    agent: {
                      ...localConfig.agent,
                      architecture: e.target.value,
                    },
                  })}
                >
                  <MenuItem value="hybrid_actor_critic">Hybrid Actor-Critic</MenuItem>
                  <MenuItem value="quantum_dqn">Quantum DQN</MenuItem>
                  <MenuItem value="variational_policy">Variational Policy</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Number of Qubits"
                type="number"
                value={localConfig.agent.numQubits}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  agent: {
                    ...localConfig.agent,
                    numQubits: parseInt(e.target.value),
                  },
                })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Quantum Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Noise Model</InputLabel>
                <Select
                  value={localConfig.quantum.noiseModel.type}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    quantum: {
                      ...localConfig.quantum,
                      noiseModel: {
                        ...localConfig.quantum.noiseModel,
                        type: e.target.value,
                      },
                    },
                  })}
                >
                  <MenuItem value="depolarizing">Depolarizing</MenuItem>
                  <MenuItem value="amplitude_damping">Amplitude Damping</MenuItem>
                  <MenuItem value="phase_damping">Phase Damping</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Error Rate"
                type="number"
                inputProps={{ step: 0.001, min: 0, max: 1 }}
                value={localConfig.quantum.noiseModel.parameters.error_rate}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  quantum: {
                    ...localConfig.quantum,
                    noiseModel: {
                      ...localConfig.quantum.noiseModel,
                      parameters: {
                        ...localConfig.quantum.noiseModel.parameters,
                        error_rate: parseFloat(e.target.value),
                      },
                    },
                  },
                })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Exploration Strategy</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Strategy Type</InputLabel>
                <Select
                  value={localConfig.agent.explorationStrategy.type}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    agent: {
                      ...localConfig.agent,
                      explorationStrategy: {
                        ...localConfig.agent.explorationStrategy,
                        type: e.target.value,
                      },
                    },
                  })}
                >
                  <MenuItem value="quantum_inspired">Quantum-Inspired</MenuItem>
                  <MenuItem value="epsilon_greedy">Epsilon-Greedy</MenuItem>
                  <MenuItem value="boltzmann">Boltzmann</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Initial Temperature"
                type="number"
                inputProps={{ step: 0.1, min: 0 }}
                value={localConfig.agent.explorationStrategy.parameters.initial_temperature}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  agent: {
                    ...localConfig.agent,
                    explorationStrategy: {
                      ...localConfig.agent.explorationStrategy,
                      parameters: {
                        ...localConfig.agent.explorationStrategy.parameters,
                        initial_temperature: parseFloat(e.target.value),
                      },
                    },
                  },
                })}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const QuantumRLAnalytics: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const {
    config,
    setConfig,
    quantumRLState,
    isLoading,
    error,
    optimizePolicy,
    generateReport,
  } = useQuantumRL();

  const learningCurveData = useMemo(() => {
    if (!quantumRLState?.agents.length) return null;

    const agent = quantumRLState.agents[0];
    const episodes = agent.performance.episodeReturns.map((_, i) => i);
    const returns = agent.performance.episodeReturns;

    return {
      labels: episodes,
      datasets: [
        {
          label: 'Episode Returns',
          data: returns,
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
        },
      ],
    };
  }, [quantumRLState]);

  const quantumMetricsData = useMemo(() => {
    if (!quantumRLState?.agents.length) return null;

    const agent = quantumRLState.agents[0];
    const metrics = agent.performance.quantumMetrics;

    return {
      labels: ['Fidelity', 'Entanglement', 'Coherence', 'Advantage'],
      datasets: [{
        label: 'Quantum Metrics',
        data: [
          metrics.circuitFidelity[metrics.circuitFidelity.length - 1],
          metrics.entanglementEntropy[metrics.entanglementEntropy.length - 1],
          Math.mean(metrics.quantumFisherInformation.map(row => Math.mean(row))),
          metrics.quantumAdvantageMetric,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      }],
    };
  }, [quantumRLState]);

  const convergenceData = useMemo(() => {
    if (!quantumRLState?.agents.length) return null;

    const agent = quantumRLState.agents[0];
    const metrics = agent.performance.convergenceMetrics;
    const episodes = metrics.episodicReturns.map((_, i) => i);

    return {
      labels: episodes,
      datasets: [
        {
          label: 'Policy Entropy',
          data: metrics.policyEntropy,
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
        },
        {
          label: 'Value Error',
          data: metrics.valueEstimateError,
          borderColor: 'rgb(255, 206, 86)',
          fill: false,
        },
        {
          label: 'Gradient Norm',
          data: metrics.gradientNorm,
          borderColor: 'rgb(153, 102, 255)',
          fill: false,
        },
      ],
    };
  }, [quantumRLState]);

  const handleConfigSave = useCallback((newConfig) => {
    setConfig(newConfig);
  }, [setConfig]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading quantum RL analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading quantum RL analytics: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quantum Reinforcement Learning Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh Data">
            <IconButton onClick={() => window.location.reload()}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Configure Analytics">
            <IconButton onClick={() => setConfigModalOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={generateReport}
          >
            Generate Report
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Learning Progress */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Learning Progress
                <Tooltip title="Episode returns and learning curve">
                  <IconButton size="small">
                    <TrendingUpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {learningCurveData && (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={learningCurveData}
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
                <Tooltip title="Quantum performance indicators">
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
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Convergence Analysis
                <Tooltip title="Policy convergence metrics">
                  <IconButton size="small">
                    <TimelineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {convergenceData && (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={convergenceData}
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

        {/* Agent Details */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Agent Configuration
                <Tooltip title="Current agent settings and architecture">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Architecture</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Type"
                          secondary={config.agent.architecture}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Number of Qubits"
                          secondary={config.agent.numQubits}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Learning Rate"
                          secondary={config.agent.learningRate}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>Quantum Settings</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary="Noise Model"
                          secondary={config.quantum.noiseModel.type}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Error Rate"
                          secondary={config.quantum.noiseModel.parameters.error_rate}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary="Circuit Depth"
                          secondary={config.quantum.maxCircuitDepth}
                        />
                      </ListItem>
                    </List>
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
        config={config}
        onSave={handleConfigSave}
      />
    </Box>
  );
};

export default QuantumRLAnalytics;
