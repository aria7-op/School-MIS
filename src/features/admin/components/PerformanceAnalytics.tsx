import React, { useState, useMemo, useCallback } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Slider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Analytics as AnalyticsIcon,
  Timeline as TimelineIcon,
  BubbleChart as BubbleChartIcon,
} from '@mui/icons-material';
import { Line, Scatter, Bubble, Radar } from 'react-chartjs-2';
import { format, addDays, subDays } from 'date-fns';
import usePerformanceMetrics from '../hooks/usePerformanceMetrics';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
);

const PerformanceAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [dateRange, setDateRange] = useState(30); // days
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);
  const [outlierThreshold, setOutlierThreshold] = useState(2.5);

  const {
    filter,
    setFilter,
    performanceData,
    analyzedData,
    isLoading,
    error,
    generateReport,
    exportData,
  } = usePerformanceMetrics({
    startDate: subDays(new Date(), dateRange),
    endDate: new Date(),
    metrics: [],
    aggregation: 'day',
    confidenceLevel,
    outlierThreshold,
  });

  const handleConfigUpdate = useCallback(() => {
    setFilter({
      ...filter,
      confidenceLevel,
      outlierThreshold,
    });
    setIsConfigOpen(false);
  }, [filter, setFilter, confidenceLevel, outlierThreshold]);

  const metricTrendData = useMemo(() => {
    if (!analyzedData?.metrics || !selectedMetric) return null;

    const metricData = analyzedData.metrics[selectedMetric];
    if (!metricData) return null;

    return {
      labels: metricData.trends.forecast.map(f => f.timestamp),
      datasets: [
        {
          label: 'Actual Values',
          data: performanceData
            ?.filter(d => d.metric === selectedMetric)
            .map(d => ({ x: d.timestamp, y: d.value })),
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          type: 'scatter',
        },
        {
          label: 'Trend Line',
          data: metricData.trends.forecast.map(f => ({ x: f.timestamp, y: f.value })),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          borderDash: [5, 5],
          type: 'line',
        },
      ],
    };
  }, [analyzedData, selectedMetric, performanceData]);

  const correlationData = useMemo(() => {
    if (!analyzedData?.correlations) return null;

    return {
      labels: analyzedData.correlations.map(c => `${c.metric1} vs ${c.metric2}`),
      datasets: [
        {
          label: 'Correlation Coefficient',
          data: analyzedData.correlations.map(c => c.correlation),
          backgroundColor: analyzedData.correlations.map(c =>
            c.correlation > 0
              ? `rgba(75, 192, 192, ${Math.abs(c.correlation)})`
              : `rgba(255, 99, 132, ${Math.abs(c.correlation)})`
          ),
        },
      ],
    };
  }, [analyzedData]);

  const outlierData = useMemo(() => {
    if (!analyzedData?.metrics || !selectedMetric) return null;

    const metricData = analyzedData.metrics[selectedMetric];
    if (!metricData) return null;

    return {
      datasets: [
        {
          label: 'Outliers',
          data: metricData.outliers.map(o => ({
            x: o.timestamp,
            y: o.value,
            r: Math.abs((o.value - metricData.mean) / metricData.standardDeviation) * 5,
          })),
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
        },
      ],
    };
  }, [analyzedData, selectedMetric]);

  const statisticalSummary = useMemo(() => {
    if (!analyzedData?.metrics || !selectedMetric) return null;

    const metricData = analyzedData.metrics[selectedMetric];
    if (!metricData) return null;

    return [
      { label: 'Mean', value: metricData.mean.toFixed(2) },
      { label: 'Median', value: metricData.median.toFixed(2) },
      { label: 'Standard Deviation', value: metricData.standardDeviation.toFixed(2) },
      { label: '25th Percentile', value: metricData.percentiles.p25.toFixed(2) },
      { label: '75th Percentile', value: metricData.percentiles.p75.toFixed(2) },
      { label: '95th Percentile', value: metricData.percentiles.p95.toFixed(2) },
      { label: 'Trend Slope', value: metricData.trends.slope.toFixed(4) },
      { label: 'R-squared', value: metricData.trends.rSquared.toFixed(4) },
    ];
  }, [analyzedData, selectedMetric]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">Performance Analytics Dashboard</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton onClick={() => setIsConfigOpen(true)}>
                <SettingsIcon />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                onClick={() => generateReport()}
              >
                Generate Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportData('pdf')}
              >
                Export Analysis
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              centered
            >
              <Tab icon={<TimelineIcon />} label="Trend Analysis" />
              <Tab icon={<BubbleChartIcon />} label="Outlier Detection" />
              <Tab icon={<AnalyticsIcon />} label="Correlation Analysis" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={9}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                      <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Metric</InputLabel>
                        <Select
                          value={selectedMetric}
                          onChange={(e) => setSelectedMetric(e.target.value)}
                          label="Metric"
                        >
                          {analyzedData?.metrics &&
                            Object.keys(analyzedData.metrics).map(metric => (
                              <MenuItem key={metric} value={metric}>
                                {metric}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Box>
                    {metricTrendData && <Line data={metricTrendData} />}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Statistical Summary
                    </Typography>
                    {statisticalSummary && (
                      <Table size="small">
                        <TableBody>
                          {statisticalSummary.map(stat => (
                            <TableRow key={stat.label}>
                              <TableCell>{stat.label}</TableCell>
                              <TableCell align="right">{stat.value}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    {outlierData && <Bubble data={outlierData} />}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, height: 400 }}>
                    {correlationData && (
                      <Bar
                        data={correlationData}
                        options={{
                          scales: {
                            y: {
                              beginAtZero: true,
                              min: -1,
                              max: 1,
                            },
                          },
                        }}
                      />
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={isConfigOpen} onClose={() => setIsConfigOpen(false)}>
        <DialogTitle>Analysis Configuration</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography gutterBottom>Confidence Level</Typography>
            <Slider
              value={confidenceLevel}
              onChange={(_, value) => setConfidenceLevel(value as number)}
              min={0.8}
              max={0.99}
              step={0.01}
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${(value * 100).toFixed(0)}%`}
            />
            <Typography gutterBottom sx={{ mt: 2 }}>Outlier Threshold (σ)</Typography>
            <Slider
              value={outlierThreshold}
              onChange={(_, value) => setOutlierThreshold(value as number)}
              min={1}
              max={4}
              step={0.1}
              valueLabelDisplay="auto"
            />
            <Typography gutterBottom sx={{ mt: 2 }}>Date Range (days)</Typography>
            <Slider
              value={dateRange}
              onChange={(_, value) => setDateRange(value as number)}
              min={7}
              max={90}
              step={1}
              valueLabelDisplay="auto"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsConfigOpen(false)}>Cancel</Button>
          <Button onClick={handleConfigUpdate} variant="contained" color="primary">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PerformanceAnalytics;
