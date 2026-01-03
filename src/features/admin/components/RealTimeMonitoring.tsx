import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Chip,
  Tooltip,
  LinearProgress,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { Line, Bar, Scatter } from 'react-chartjs-2';
import { format, subMinutes } from 'date-fns';
import useRealTimeData from '../hooks/useRealTimeData';

interface ThresholdConfig {
  metric: string;
  min: number;
  max: number;
  criticalMin: number;
  criticalMax: number;
}

const RealTimeMonitoring: React.FC = () => {
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState('cpu');
  const [timeRange, setTimeRange] = useState(5); // minutes
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [thresholdConfig, setThresholdConfig] = useState<ThresholdConfig>({
    metric: 'cpu',
    min: 0,
    max: 80,
    criticalMin: 0,
    criticalMax: 90,
  });

  const {
    metrics,
    alerts,
    isConnected,
    lastUpdate,
    connectionStatus,
    error,
    connect,
    disconnect,
    clearData,
    getMetricsByType,
    getAlertsBySeverity,
    getMetricsByTimeRange,
    setThreshold,
    exportData,
  } = useRealTimeData({
    bufferSize: 1000,
    updateInterval: 1000,
    reconnectAttempts: 5,
    reconnectDelay: 5000,
    metricThresholds: [
      {
        metric: 'cpu',
        min: 0,
        max: 80,
        criticalMin: 0,
        criticalMax: 90,
      },
      {
        metric: 'memory',
        min: 0,
        max: 85,
        criticalMin: 0,
        criticalMax: 95,
      },
      {
        metric: 'disk',
        min: 0,
        max: 85,
        criticalMin: 0,
        criticalMax: 95,
      },
    ],
  });

  const handleThresholdUpdate = useCallback(() => {
    setThreshold(thresholdConfig);
    setIsConfigOpen(false);
  }, [setThreshold, thresholdConfig]);

  const metricData = useMemo(() => {
    const now = new Date();
    const start = subMinutes(now, timeRange);
    const filteredMetrics = getMetricsByTimeRange(start, now);

    return {
      labels: filteredMetrics.map(m => format(new Date(m.timestamp), 'HH:mm:ss')),
      datasets: [
        {
          label: selectedMetricType.toUpperCase(),
          data: filteredMetrics
            .filter(m => m.type === selectedMetricType)
            .map(m => ({ x: new Date(m.timestamp), y: m.value })),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1,
          pointRadius: 1,
        },
      ],
    };
  }, [getMetricsByTimeRange, selectedMetricType, timeRange]);

  const alertStats = useMemo(() => {
    return {
      critical: getAlertsBySeverity('critical').length,
      warning: getAlertsBySeverity('warning').length,
      info: getAlertsBySeverity('info').length,
    };
  }, [getAlertsBySeverity]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (isConnected) {
          // Trigger a re-render
          setTimeRange(prev => prev);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isConnected]);

  const chartOptions = {
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'second' as const,
          displayFormats: {
            second: 'HH:mm:ss',
          },
        },
        title: {
          display: true,
          text: 'Time',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Value',
        },
      },
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Real-Time System Monitoring</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                label={`Status: ${connectionStatus}`}
                color={connectionStatus === 'connected' ? 'success' : 'error'}
                sx={{ mr: 1 }}
              />
              {lastUpdate && (
                <Typography variant="body2" color="text.secondary">
                  Last Update: {format(lastUpdate, 'HH:mm:ss')}
                </Typography>
              )}
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
              <IconButton onClick={() => setIsConfigOpen(true)}>
                <SettingsIcon />
              </IconButton>
              <IconButton onClick={() => exportData('json')}>
                <DownloadIcon />
              </IconButton>
              <IconButton onClick={clearData}>
                <DeleteIcon />
              </IconButton>
              <Button
                variant="contained"
                color={isConnected ? 'error' : 'primary'}
                onClick={isConnected ? disconnect : connect}
              >
                {isConnected ? 'Disconnect' : 'Connect'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl size="small">
                <InputLabel>Metric Type</InputLabel>
                <Select
                  value={selectedMetricType}
                  onChange={(e) => setSelectedMetricType(e.target.value)}
                  label="Metric Type"
                >
                  <MenuItem value="cpu">CPU Usage</MenuItem>
                  <MenuItem value="memory">Memory Usage</MenuItem>
                  <MenuItem value="disk">Disk Usage</MenuItem>
                  <MenuItem value="network">Network Traffic</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small">
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(Number(e.target.value))}
                  label="Time Range"
                >
                  <MenuItem value={1}>1 Minute</MenuItem>
                  <MenuItem value={5}>5 Minutes</MenuItem>
                  <MenuItem value={15}>15 Minutes</MenuItem>
                  <MenuItem value={30}>30 Minutes</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Scatter data={metricData} options={chartOptions} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, height: 400, overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              Alert Summary
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Tooltip title="Critical Alerts">
                <Chip
                  icon={<ErrorIcon />}
                  label={alertStats.critical}
                  color="error"
                  sx={{ mr: 1 }}
                />
              </Tooltip>
              <Tooltip title="Warning Alerts">
                <Chip
                  icon={<WarningIcon />}
                  label={alertStats.warning}
                  color="warning"
                  sx={{ mr: 1 }}
                />
              </Tooltip>
              <Tooltip title="Info Alerts">
                <Chip
                  icon={<InfoIcon />}
                  label={alertStats.info}
                  color="info"
                />
              </Tooltip>
            </Box>
            <Box sx={{ mt: 2 }}>
              {alerts.slice().reverse().map((alert) => (
                <Alert
                  key={alert.id}
                  severity={alert.severity}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2">
                    {format(new Date(alert.timestamp), 'HH:mm:ss')} - {alert.message}
                  </Typography>
                </Alert>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isConfigOpen} onClose={() => setIsConfigOpen(false)}>
        <DialogTitle>Threshold Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Metric</InputLabel>
              <Select
                value={thresholdConfig.metric}
                onChange={(e) =>
                  setThresholdConfig(prev => ({ ...prev, metric: e.target.value }))
                }
                label="Metric"
              >
                <MenuItem value="cpu">CPU Usage</MenuItem>
                <MenuItem value="memory">Memory Usage</MenuItem>
                <MenuItem value="disk">Disk Usage</MenuItem>
                <MenuItem value="network">Network Traffic</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Warning Min"
              type="number"
              value={thresholdConfig.min}
              onChange={(e) =>
                setThresholdConfig(prev => ({ ...prev, min: Number(e.target.value) }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Warning Max"
              type="number"
              value={thresholdConfig.max}
              onChange={(e) =>
                setThresholdConfig(prev => ({ ...prev, max: Number(e.target.value) }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Critical Min"
              type="number"
              value={thresholdConfig.criticalMin}
              onChange={(e) =>
                setThresholdConfig(prev => ({ ...prev, criticalMin: Number(e.target.value) }))
              }
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Critical Max"
              type="number"
              value={thresholdConfig.criticalMax}
              onChange={(e) =>
                setThresholdConfig(prev => ({ ...prev, criticalMax: Number(e.target.value) }))
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfigOpen(false)}>Cancel</Button>
          <Button onClick={handleThresholdUpdate} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error.message}
        </Alert>
      )}
    </Box>
  );
};

export default RealTimeMonitoring;
