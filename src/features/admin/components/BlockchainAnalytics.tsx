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
import SecurityIcon from '@mui/icons-material/Security';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import useBlockchainAnalytics from '../hooks/useBlockchainAnalytics';

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
      <DialogTitle>Configure Blockchain Analytics</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Network</InputLabel>
            <Select
              value={localConfig.network}
              onChange={(e) => setLocalConfig({
                ...localConfig,
                network: e.target.value,
              })}
            >
              <MenuItem value="mainnet">Mainnet</MenuItem>
              <MenuItem value="testnet">Testnet</MenuItem>
              <MenuItem value="local">Local</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="RPC URL"
            value={localConfig.rpcUrl}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              rpcUrl: e.target.value,
            })}
          />

          <TextField
            fullWidth
            label="API Key"
            type="password"
            value={localConfig.apiKey}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              apiKey: e.target.value,
            })}
          />

          <Typography variant="h6" gutterBottom>Scan Period</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Blocks to Scan</Typography>
              <Slider
                value={localConfig.scanPeriod.blocks}
                onChange={(_, value) => setLocalConfig({
                  ...localConfig,
                  scanPeriod: {
                    ...localConfig.scanPeriod,
                    blocks: value as number,
                  },
                })}
                min={100}
                max={10000}
                step={100}
                valueLabelDisplay="auto"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography gutterBottom>Days to Analyze</Typography>
              <Slider
                value={localConfig.scanPeriod.days}
                onChange={(_, value) => setLocalConfig({
                  ...localConfig,
                  scanPeriod: {
                    ...localConfig.scanPeriod,
                    days: value as number,
                  },
                })}
                min={1}
                max={30}
                step={1}
                valueLabelDisplay="auto"
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Alert Thresholds</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Large Transaction Value (ETH)"
                type="number"
                value={BigInt(localConfig.alertThresholds.largeTransactionValue) / BigInt(1e18)}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  alertThresholds: {
                    ...localConfig.alertThresholds,
                    largeTransactionValue: (BigInt(Math.floor(parseFloat(e.target.value) * 1e18))).toString(),
                  },
                })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="High Gas Price (Gwei)"
                type="number"
                value={BigInt(localConfig.alertThresholds.highGasPrice) / BigInt(1e9)}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  alertThresholds: {
                    ...localConfig.alertThresholds,
                    highGasPrice: (BigInt(Math.floor(parseFloat(e.target.value) * 1e9))).toString(),
                  },
                })}
              />
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom>Monitored Addresses</Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Enter addresses (one per line)"
            value={localConfig.monitoredAddresses.join('\n')}
            onChange={(e) => setLocalConfig({
              ...localConfig,
              monitoredAddresses: e.target.value.split('\n').filter(Boolean),
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

const BlockchainAnalytics: React.FC = () => {
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const {
    config,
    setConfig,
    transactions,
    blocks,
    contracts,
    networkMetrics,
    analyses,
    isLoading,
    error,
    generateReport,
  } = useBlockchainAnalytics();

  const transactionMetricsData = useMemo(() => {
    if (!transactions.length) return null;

    const timestamps = transactions.map(tx => format(tx.timestamp * 1000, 'MM/dd HH:mm'));
    const values = transactions.map(tx => Number(BigInt(tx.value) / BigInt(1e18))); // Convert to ETH
    const gasPrices = transactions.map(tx => Number(BigInt(tx.gasPrice) / BigInt(1e9))); // Convert to Gwei

    return {
      labels: timestamps,
      datasets: [
        {
          label: 'Transaction Value (ETH)',
          data: values,
          borderColor: 'rgb(75, 192, 192)',
          fill: false,
        },
        {
          label: 'Gas Price (Gwei)',
          data: gasPrices,
          borderColor: 'rgb(255, 99, 132)',
          fill: false,
        },
      ],
    };
  }, [transactions]);

  const contractSecurityData = useMemo(() => {
    if (!analyses?.contractAnalyses.length) return null;

    return {
      labels: analyses.contractAnalyses.map(ca => ca.address.slice(0, 8) + '...'),
      datasets: [{
        label: 'Risk Score',
        data: analyses.contractAnalyses.map(ca => ca.analysis.riskScore),
        backgroundColor: analyses.contractAnalyses.map(ca =>
          ca.analysis.riskScore > 0.7 ? 'rgba(255, 99, 132, 0.5)' :
          ca.analysis.riskScore > 0.4 ? 'rgba(255, 206, 86, 0.5)' :
          'rgba(75, 192, 192, 0.5)'
        ),
      }],
    };
  }, [analyses]);

  const handleConfigSave = useCallback((newConfig) => {
    setConfig(newConfig);
  }, [setConfig]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <Typography>Loading blockchain analytics...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error loading blockchain analytics: {error.message}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Blockchain Analytics Dashboard
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
        {/* Network Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Network Overview
                <Tooltip title="Current network status and metrics">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Block Time</Typography>
                    <Typography variant="h6">
                      {networkMetrics?.blockTime.toFixed(2)}s
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Active Addresses</Typography>
                    <Typography variant="h6">
                      {networkMetrics?.activeAddresses.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Pending Transactions</Typography>
                    <Typography variant="h6">
                      {networkMetrics?.pendingTransactions.toLocaleString()}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle2">Average Gas Price</Typography>
                    <Typography variant="h6">
                      {(Number(BigInt(networkMetrics?.averageGasPrice || '0') / BigInt(1e9))).toFixed(2)} Gwei
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Transaction Metrics */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Metrics
                <Tooltip title="Transaction values and gas prices over time">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              {transactionMetricsData && (
                <Box sx={{ height: 300 }}>
                  <Line
                    data={transactionMetricsData}
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

        {/* Security Alerts */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Security Alerts
                <Tooltip title="Active security alerts and warnings">
                  <IconButton size="small">
                    <SecurityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <List>
                {analyses?.securityAlerts.map((alert, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {alert.type === 'high' ? (
                        <ErrorIcon color="error" />
                      ) : alert.type === 'medium' ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <InfoIcon color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={alert.description}
                      secondary={
                        <>
                          {format(alert.timestamp, 'MM/dd HH:mm')}
                          <br />
                          {alert.recommendation}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Contract Security Analysis */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Contract Security Analysis
                <Tooltip title="Security analysis of monitored smart contracts">
                  <IconButton size="small">
                    <SecurityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  {contractSecurityData && (
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={contractSecurityData}
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
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto' }}>
                    <Typography variant="subtitle2" gutterBottom>Vulnerabilities</Typography>
                    {analyses?.contractAnalyses.map((ca, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">
                          Contract: {ca.address.slice(0, 8)}...
                          <Chip
                            size="small"
                            label={`Risk: ${(ca.analysis.riskScore * 100).toFixed(1)}%`}
                            color={ca.analysis.riskScore > 0.7 ? 'error' : ca.analysis.riskScore > 0.4 ? 'warning' : 'success'}
                            sx={{ ml: 1 }}
                          />
                        </Typography>
                        {ca.analysis.vulnerabilities.map((v, i) => (
                          <Typography key={i} variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            • {v.description}
                          </Typography>
                        ))}
                      </Box>
                    ))}
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

export default BlockchainAnalytics;
