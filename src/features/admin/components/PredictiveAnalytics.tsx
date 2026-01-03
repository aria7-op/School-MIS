import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Tooltip,
  IconButton,
  Alert,
} from '@mui/material';
import {
  Line,
  Bar,
  Scatter,
  Radar,
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
import usePredictiveAnalytics from '../hooks/usePredictiveAnalytics';

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
      <DialogTitle>Configure Predictive Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Models to Track</InputLabel>
            <Select
              multiple
              value={localConfig.modelsToTrack}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                modelsToTrack: e.target.value,
              })}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value: string) => (
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
            <Typography gutterBottom>Update Interval (minutes)</Typography>
            <Slider
              value={localConfig.updateInterval / (60 * 1000)}
              onChange={(_, value) => setLocalConfig({
                ...localConfig,
                updateInterval: (value as number) * 60 * 1000,
              })}
              min={1}
              max={60}
              marks
              step={1}
              valueLabelDisplay="auto"
            />
          </FormControl>

          <FormControl fullWidth>
            <Typography gutterBottom>Confidence Threshold</Typography>
            <Slider
              value={localConfig.confidenceThreshold}
              onChange={(_, value) => setLocalConfig({
                ...localConfig,
                confidenceThreshold: value as number,
              })}
              min={0}
              max={1}
              step={0.05}
              marks
              valueLabelDisplay="auto"
            />
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label="Max Predictions to Analyze"
            value={localConfig.maxPredictions}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              maxPredictions: parseInt(e.target.value, 10),
            })}
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

const PredictiveAnalytics: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const {
    config,
    setConfig,
    models,
    predictions,
    insights,
    isLoading,
    error,
    generateReport,
  } = usePredictiveAnalytics();

  const performanceData = useMemo(() => {
    if (!insights) return null;

    return {
      labels: insights[0]?.performance.trend.map(p => format(new Date(p.timestamp), 'MM/dd HH:mm')),
      datasets: insights.map(insight => ({
        label: `Model ${insight.modelId}`,
        data: insight.performance.trend.map(p => p.accuracy),
        fill: false,
        borderColor: `hsl(${Math.random() * 360}, 70%, 50%)`,
        tension: 0.4,
      })),
    };
  }, [insights]);

  const featureImportanceData = useMemo(() => {
    if (!insights) return null;

    const selectedModel = insights[0]; // You can add model selection UI
    return {
      labels: selectedModel.featureImportance.map(f => f.feature),
      datasets: [{
        label: 'Feature Importance',
        data: selectedModel.featureImportance.map(f => f.importance),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }],
    };
  }, [insights]);

  const distributionData = useMemo(() => {
    if (!insights) return null;

    const selectedModel = insights[0]; // You can add model selection UI
    return {
      labels: selectedModel.predictionDistribution.histogram.map(h => h.bin),
      datasets: [{
        label: 'Prediction Distribution',
        data: selectedModel.predictionDistribution.histogram.map(h => h.count),
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        borderColor: 'rgba(153, 102, 255, 1)',
        borderWidth: 1,
      }],
    };
  }, [insights]);

  const handleConfigSave = useCallback((newConfig) => {
    setConfig(newConfig);
  }, [setConfig]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading predictive analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading predictive analytics: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Predictive Analytics Dashboard
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
        {/* Model Performance Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Model Performance Trend
                <Tooltip title="Shows the accuracy trend over time for each model">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
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

        {/* Feature Importance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Feature Importance
                <Tooltip title="Shows the relative importance of each feature in the model">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {featureImportanceData && (
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={featureImportanceData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      indexAxis: 'y',
                    }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Prediction Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Prediction Distribution
                <Tooltip title="Shows the distribution of model predictions">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {distributionData && (
                <Box sx={{ height: 300 }}>
                  <Bar
                    data={distributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                    }}
                  />
                </Box>
              )}
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

export default PredictiveAnalytics;
