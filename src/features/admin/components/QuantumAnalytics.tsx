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
import DownloadIcon from '@mui/icons-material/Download';
import InfoIcon from '@mui/icons-material/Info';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import useQuantumAnalytics from '../hooks/useQuantumAnalytics';

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
      <DialogTitle>Configure Quantum Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography gutterBottom>Maximum Qubits</Typography>
                <Slider
                  value={localConfig.maxQubits}
                  onChange={(_, value) => setLocalConfig({
                    ...localConfig,
                    maxQubits: value as number,
                  })}
                  min={1}
                  max={10}
                  marks
                  step={1}
                  valueLabelDisplay="auto"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography gutterBottom>Maximum Circuit Depth</Typography>
                <Slider
                  value={localConfig.maxCircuitDepth}
                  onChange={(_, value) => setLocalConfig({
                    ...localConfig,
                    maxCircuitDepth: value as number,
                  })}
                  min={10}
                  max={100}
                  step={10}
                  marks
                  valueLabelDisplay="auto"
                />
              </FormControl>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Error Model</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Gate Errors</Typography>
              {Object.entries(localConfig.errorModel.gateErrors).map(([gate, error]) => (
                <FormControl key={gate} fullWidth sx={{ mb: 1 }}>
                  <Typography variant="body2">{gate} Gate Error Rate</Typography>
                  <Slider
                    value={error as number}
                    onChange={(_, value) => setLocalConfig({
                      ...localConfig,
                      errorModel: {
                        ...localConfig.errorModel,
                        gateErrors: {
                          ...localConfig.errorModel.gateErrors,
                          [gate]: value as number,
                        },
                      },
                    })}
                    min={0}
                    max={0.1}
                    step={0.001}
                    valueLabelDisplay="auto"
                  />
                </FormControl>
              ))}
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" gutterBottom>Decoherence Settings</Typography>
              {localConfig.errorModel.decoherence.map((model, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <FormControl fullWidth sx={{ mb: 1 }}>
                    <InputLabel>Decoherence Type</InputLabel>
                    <Select
                      value={model.type}
                      onChange={(e) => {
                        const newDecoherence = [...localConfig.errorModel.decoherence];
                        newDecoherence[index] = {
                          ...newDecoherence[index],
                          type: e.target.value as string,
                        };
                        setLocalConfig({
                          ...localConfig,
                          errorModel: {
                            ...localConfig.errorModel,
                            decoherence: newDecoherence,
                          },
                        });
                      }}
                    >
                      <MenuItem value="amplitude-damping">Amplitude Damping</MenuItem>
                      <MenuItem value="phase-damping">Phase Damping</MenuItem>
                      <MenuItem value="depolarizing">Depolarizing</MenuItem>
                    </Select>
                  </FormControl>
                  <Slider
                    value={model.parameters.rate}
                    onChange={(_, value) => {
                      const newDecoherence = [...localConfig.errorModel.decoherence];
                      newDecoherence[index] = {
                        ...newDecoherence[index],
                        parameters: {
                          ...newDecoherence[index].parameters,
                          rate: value as number,
                        },
                      };
                      setLocalConfig({
                        ...localConfig,
                        errorModel: {
                          ...localConfig.errorModel,
                          decoherence: newDecoherence,
                        },
                      });
                    }}
                    min={0}
                    max={1}
                    step={0.1}
                    valueLabelDisplay="auto"
                  />
                </Box>
              ))}
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Simulation Settings</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <Typography gutterBottom>Number of Shots</Typography>
                <Slider
                  value={localConfig.simulationSettings.shots}
                  onChange={(_, value) => setLocalConfig({
                    ...localConfig,
                    simulationSettings: {
                      ...localConfig.simulationSettings,
                      shots: value as number,
                    },
                  })}
                  min={100}
                  max={10000}
                  step={100}
                  valueLabelDisplay="auto"
                />
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.simulationSettings.enableNoiseSimulation}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      simulationSettings: {
                        ...localConfig.simulationSettings,
                        enableNoiseSimulation: e.target.checked,
                      },
                    })}
                  />
                }
                label="Enable Noise Simulation"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.simulationSettings.enableStateVisualization}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      simulationSettings: {
                        ...localConfig.simulationSettings,
                        enableStateVisualization: e.target.checked,
                      },
                    })}
                  />
                }
                label="Enable State Visualization"
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

const QuantumAnalytics: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('');
  
  const {
    config,
    setConfig,
    circuits,
    simulations,
    analyses,
    isLoading,
    error,
    runSimulation,
    generateReport,
  } = useQuantumAnalytics();

  const selectedSimulation = useMemo(
    () => simulations.find(s => s.circuit.circuitId === selectedCircuitId),
    [simulations, selectedCircuitId]
  );

  const selectedAnalysis = useMemo(
    () => analyses?.find(a => a.simulationId === selectedSimulation?.simulationId),
    [analyses, selectedSimulation]
  );

  const stateEvolutionData = useMemo(() => {
    if (!selectedSimulation) return null;

    return {
      labels: selectedSimulation.results.intermediateStates.map(s => `Step ${s.step}`),
      datasets: selectedSimulation.circuit.qubits > 0 ? [
        {
          label: 'State Vector Magnitude',
          data: selectedSimulation.results.intermediateStates.map(
            s => Math.max(...s.state.stateVector.map(v => v.magnitude))
          ),
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
        },
        {
          label: 'Entanglement',
          data: selectedSimulation.results.intermediateStates.map(
            (_, i) => selectedSimulation.results.entanglementMetrics.concurrence[i] || 0
          ),
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
        },
      ] : [],
    };
  }, [selectedSimulation]);

  const measurementData = useMemo(() => {
    if (!selectedSimulation) return null;

    return {
      labels: selectedSimulation.results.measurements.map(m => `Qubit ${m.qubit}`),
      datasets: [
        {
          label: '|0⟩ State Probability',
          data: selectedSimulation.results.measurements.map(
            m => m.outcomes.find(o => o.value === 0)?.probability || 0
          ),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
        },
        {
          label: '|1⟩ State Probability',
          data: selectedSimulation.results.measurements.map(
            m => m.outcomes.find(o => o.value === 1)?.probability || 0
          ),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
        },
      ],
    };
  }, [selectedSimulation]);

  const handleConfigSave = useCallback((newConfig) => {
    setConfig(newConfig);
  }, [setConfig]);

  const handleRunSimulation = useCallback(async () => {
    if (!selectedCircuitId) return;
    const circuit = circuits.find(c => c.circuitId === selectedCircuitId);
    if (circuit) {
      await runSimulation(circuit);
    }
  }, [selectedCircuitId, circuits, runSimulation]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading quantum analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading quantum analytics: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quantum Analytics Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Circuit</InputLabel>
            <Select
              value={selectedCircuitId}
              onChange={(e) => setSelectedCircuitId(e.target.value as string)}
              label="Select Circuit"
            >
              {circuits.map((circuit) => (
                <MenuItem key={circuit.circuitId} value={circuit.circuitId}>
                  {`Circuit ${circuit.circuitId} (${circuit.qubits} qubits)`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PlayArrowIcon />}
            onClick={handleRunSimulation}
            disabled={!selectedCircuitId}
          >
            Run Simulation
          </Button>
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

      {selectedSimulation && selectedAnalysis && (
        <Grid container spacing={3}>
          {/* Circuit Information */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quantum Circuit Information
                  <Tooltip title="Details about the quantum circuit and its properties">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Circuit Properties</Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>Number of Qubits</TableCell>
                            <TableCell>{selectedSimulation.circuit.qubits}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Circuit Depth</TableCell>
                            <TableCell>{selectedSimulation.circuit.depth}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Gate Count</TableCell>
                            <TableCell>{selectedSimulation.circuit.gates.length}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Performance Metrics</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2">Execution Time</Typography>
                          <Typography>
                            {selectedSimulation.performance.executionTime.toFixed(2)} ms
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2">Memory Usage</Typography>
                          <Typography>
                            {(selectedSimulation.performance.memoryUsage / 1024 / 1024).toFixed(2)} MB
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* State Evolution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quantum State Evolution
                  <Tooltip title="Evolution of quantum state and entanglement over circuit execution">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                {stateEvolutionData && (
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={stateEvolutionData}
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

          {/* Measurement Results */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Measurement Results
                  <Tooltip title="Probability distribution of measurement outcomes">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                {measurementData && (
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={measurementData}
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

          {/* Entanglement Analysis */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Entanglement Analysis
                  <Tooltip title="Analysis of quantum entanglement and correlations">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Entanglement Metrics</Typography>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell>von Neumann Entropy</TableCell>
                            <TableCell>
                              {selectedSimulation.results.entanglementMetrics.vonNeumannEntropy.toFixed(3)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>Entanglement Strength</TableCell>
                            <TableCell>
                              {selectedAnalysis.entanglementAnalysis.entanglementStrength.toFixed(3)}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Recommendations</Typography>
                      {selectedAnalysis.entanglementAnalysis.recommendations.map((rec, i) => (
                        <Typography key={i} variant="body2" sx={{ mt: 1 }}>
                          • {rec}
                        </Typography>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <ConfigModal
        open={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        config={config}
        onSave={handleConfigSave}
      />
    </Box>
  );
};

export default QuantumAnalytics;
