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
import TuneIcon from '@mui/icons-material/Tune';
import useDeepLearningAnalytics from '../hooks/useDeepLearningAnalytics';

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
      <DialogTitle>Configure Deep Learning Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Models to Monitor</InputLabel>
            <Select
              multiple
              value={localConfig.modelIds}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                modelIds: e.target.value as string[],
              })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {/* Add model options dynamically */}
              <MenuItem value="model1">Model 1</MenuItem>
              <MenuItem value="model2">Model 2</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <Typography gutterBottom>Update Interval (seconds)</Typography>
            <Slider
              value={localConfig.updateInterval / 1000}
              onChange={(_, value) => setLocalConfig({
                ...localConfig,
                updateInterval: (value as number) * 1000,
              })}
              min={1}
              max={60}
              marks
              step={1}
              valueLabelDisplay="auto"
            />
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Monitored Metrics</InputLabel>
            <Select
              multiple
              value={localConfig.monitoredMetrics}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                monitoredMetrics: e.target.value as string[],
              })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              <MenuItem value="loss">Loss</MenuItem>
              <MenuItem value="accuracy">Accuracy</MenuItem>
              <MenuItem value="gradients">Gradients</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="subtitle1" gutterBottom>Visualization Settings</Typography>
          <FormControlLabel
            control={
              <Switch
                checked={localConfig.visualizationSettings.showGradients}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  visualizationSettings: {
                    ...localConfig.visualizationSettings,
                    showGradients: e.target.checked,
                  },
                })}
              />
            }
            label="Show Gradients"
          />
          <FormControlLabel
            control={
              <Switch
                checked={localConfig.visualizationSettings.showActivations}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  visualizationSettings: {
                    ...localConfig.visualizationSettings,
                    showActivations: e.target.checked,
                  },
                })}
              />
            }
            label="Show Activations"
          />
          <FormControlLabel
            control={
              <Switch
                checked={localConfig.visualizationSettings.showAttention}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  visualizationSettings: {
                    ...localConfig.visualizationSettings,
                    showAttention: e.target.checked,
                  },
                })}
              />
            }
            label="Show Attention Patterns"
          />
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

const DeepLearningAnalytics: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  const {
    config,
    setConfig,
    models,
    activations,
    attentionPatterns,
    analyses,
    isLoading,
    error,
    optimizeModel,
    generateReport,
  } = useDeepLearningAnalytics();

  const selectedModel = useMemo(
    () => models.find(m => m.modelId === selectedModelId),
    [models, selectedModelId]
  );

  const selectedAnalysis = useMemo(
    () => analyses?.find(a => a.modelId === selectedModelId),
    [analyses, selectedModelId]
  );

  const trainingMetricsData = useMemo(() => {
    if (!selectedModel) return null;

    const epochs = Array.from({ length: selectedModel.performance.epochs }, (_, i) => i + 1);
    return {
      labels: epochs,
      datasets: [
        {
          label: 'Training Loss',
          data: selectedModel.performance.trainLoss,
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
        },
        {
          label: 'Validation Loss',
          data: selectedModel.performance.validationLoss,
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
        },
        {
          label: 'Training Accuracy',
          data: selectedModel.performance.trainAccuracy,
          borderColor: 'rgb(54, 162, 235)',
          fill: false,
        },
        {
          label: 'Validation Accuracy',
          data: selectedModel.performance.validationAccuracy,
          borderColor: 'rgb(255, 159, 64)',
          fill: false,
        },
      ],
    };
  }, [selectedModel]);

  const gradientAnalysisData = useMemo(() => {
    if (!selectedModel) return null;

    const layerNames = Object.keys(selectedModel.gradients.layerGradients);
    return {
      labels: layerNames,
      datasets: [
        {
          label: 'Gradient Mean',
          data: layerNames.map(layer => selectedModel.gradients.layerGradients[layer].mean),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
        },
        {
          label: 'Gradient Variance',
          data: layerNames.map(layer => selectedModel.gradients.layerGradients[layer].variance),
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
        },
      ],
    };
  }, [selectedModel]);

  const handleConfigSave = useCallback((newConfig) => {
    setConfig(newConfig);
  }, [setConfig]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading deep learning analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading deep learning analytics: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Deep Learning Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Select Model</InputLabel>
            <Select
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value as string)}
              label="Select Model"
            >
              {models.map((model) => (
                <MenuItem key={model.modelId} value={model.modelId}>
                  {model.modelId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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

      {selectedModel && selectedAnalysis && (
        <Grid container spacing={3}>
          {/* Model Architecture */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Model Architecture
                  <Tooltip title="Neural network architecture and layer information">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Architecture Type</Typography>
                      <Typography>{selectedModel.architecture.type}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Total Parameters</Typography>
                      <Typography>
                        {selectedModel.architecture.totalParameters.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Layer Efficiency</Typography>
                      {Object.entries(selectedAnalysis.layerEfficiency).map(([layer, stats]) => (
                        <Box key={layer} sx={{ mt: 1 }}>
                          <Typography variant="body2">
                            {layer} - Efficiency: {(stats.efficiency * 100).toFixed(1)}%
                            {stats.bottleneck && (
                              <Chip
                                size="small"
                                color="warning"
                                label="Bottleneck"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          <Slider
                            value={stats.efficiency * 100}
                            disabled
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      ))}
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Training Metrics */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Training Metrics
                  <Tooltip title="Model training and validation metrics over time">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                {trainingMetricsData && (
                  <Box sx={{ height: 300 }}>
                    <Line
                      data={trainingMetricsData}
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

          {/* Gradient Analysis */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Gradient Analysis
                  <Tooltip title="Layer-wise gradient statistics and health metrics">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                {gradientAnalysisData && (
                  <Box sx={{ height: 300 }}>
                    <Bar
                      data={gradientAnalysisData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                      }}
                    />
                  </Box>
                )}
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity={selectedAnalysis.gradientAnalysis.healthScore > 0.7 ? 'success' : 'warning'}
                    sx={{ mb: 1 }}
                  >
                    Model Health Score: {(selectedAnalysis.gradientAnalysis.healthScore * 100).toFixed(1)}%
                  </Alert>
                  {selectedAnalysis.gradientAnalysis.recommendations.map((rec, i) => (
                    <Typography key={i} variant="body2" color="text.secondary">
                      • {rec}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Convergence Analysis */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Convergence Analysis
                  <Tooltip title="Training convergence metrics and optimization suggestions">
                    <IconButton size="small">
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Convergence Rate</Typography>
                      <Typography>
                        {(selectedAnalysis.convergenceAnalysis.convergenceRate * 100).toFixed(2)}%
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle2">Status</Typography>
                      <Chip
                        color={selectedAnalysis.convergenceAnalysis.isOverfitting ? 'error' : 'success'}
                        label={selectedAnalysis.convergenceAnalysis.isOverfitting ? 'Overfitting' : 'Stable'}
                        sx={{ mt: 1 }}
                      />
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2">Optimization Suggestions</Typography>
                      {selectedAnalysis.convergenceAnalysis.suggestions.map((suggestion, i) => (
                        <Typography key={i} variant="body2" sx={{ mt: 1 }}>
                          • {suggestion}
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

export default DeepLearningAnalytics;
