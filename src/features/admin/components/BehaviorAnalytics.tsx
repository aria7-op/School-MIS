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
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Assessment as AssessmentIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { Line, Scatter, Radar, Bubble } from 'react-chartjs-2';
import { format } from 'date-fns';
import useBehaviorAnalytics from '../hooks/useBehaviorAnalytics';

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

const BehaviorAnalytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<string>('all');
  const [minConfidence, setMinConfidence] = useState(0.7);
  const [maxClusters, setMaxClusters] = useState(5);

  const {
    filter,
    setFilter,
    insights,
    isLoading,
    error,
    generateReport,
    exportData,
  } = useBehaviorAnalytics({
    minConfidence,
    maxClusters,
  });

  const handleConfigUpdate = useCallback(() => {
    setFilter({
      ...filter,
      minConfidence,
      maxClusters,
    });
    setIsConfigOpen(false);
  }, [filter, setFilter, minConfidence, maxClusters]);

  const userSegmentData = useMemo(() => {
    if (!insights?.userProfiles) return null;

    const profiles = selectedSegment === 'all'
      ? insights.userProfiles
      : insights.userProfiles.filter(p => p.segments.includes(selectedSegment));

    return {
      labels: ['Engagement', 'Risk', 'Activity', 'Pattern Confidence', 'Retention'],
      datasets: profiles.map(profile => ({
        label: `User ${profile.userId}`,
        data: [
          profile.engagementScore,
          profile.riskScore,
          profile.behaviorPatterns.length,
          profile.behaviorPatterns.reduce((acc, p) => acc + p.confidence, 0) /
            profile.behaviorPatterns.length,
          0.8, // Placeholder for retention score
        ],
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() *
          255}, 0.2)`,
        borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() *
          255}, 1)`,
      })),
    };
  }, [insights, selectedSegment]);

  const clusterVisualization = useMemo(() => {
    if (!insights?.clusters) return null;

    return {
      datasets: insights.clusters.map(cluster => ({
        label: `Cluster ${cluster.clusterId}`,
        data: [
          {
            x: cluster.centralTendencies.engagement || 0,
            y: cluster.centralTendencies.activity || 0,
            r: (cluster.size / insights.userProfiles.length) * 50,
          },
        ],
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() *
          255}, 0.5)`,
      })),
    };
  }, [insights]);

  const patternAnalysis = useMemo(() => {
    if (!insights?.userProfiles || !selectedSegment) return null;

    const profiles = selectedSegment === 'all'
      ? insights.userProfiles
      : insights.userProfiles.filter(p => p.segments.includes(selectedSegment));

    const patterns = new Map<string, { count: number; confidence: number }>();
    profiles.forEach(profile => {
      profile.behaviorPatterns.forEach(pattern => {
        const existing = patterns.get(pattern.pattern) || { count: 0, confidence: 0 };
        patterns.set(pattern.pattern, {
          count: existing.count + 1,
          confidence: existing.confidence + pattern.confidence,
        });
      });
    });

    return Array.from(patterns.entries())
      .map(([pattern, stats]) => ({
        pattern,
        count: stats.count,
        avgConfidence: stats.confidence / stats.count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [insights, selectedSegment]);

  const riskDistribution = useMemo(() => {
    if (!insights?.userProfiles) return null;

    const riskLevels = {
      low: 0,
      medium: 0,
      high: 0,
    };

    insights.userProfiles.forEach(profile => {
      if (profile.riskScore < 30) riskLevels.low++;
      else if (profile.riskScore < 70) riskLevels.medium++;
      else riskLevels.high++;
    });

    return {
      labels: ['Low Risk', 'Medium Risk', 'High Risk'],
      datasets: [
        {
          data: [riskLevels.low, riskLevels.medium, riskLevels.high],
          backgroundColor: [
            'rgba(75, 192, 192, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(255, 99, 132, 0.5)',
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(255, 99, 132, 1)',
          ],
        },
      ],
    };
  }, [insights]);

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">User Behavior Analytics</Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton onClick={() => setIsConfigOpen(true)}>
                <SettingsIcon />
              </IconButton>
              <Button
                variant="outlined"
                startIcon={<AssessmentIcon />}
                onClick={() => generateReport()}
              >
                Generate Report
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportData('json')}
              >
                Export Data
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Risk Overview
              </Typography>
              {insights && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    High Risk Users
                  </Typography>
                  <Typography variant="h4" color="error">
                    {insights.userProfiles.filter(p => p.riskScore >= 70).length}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={
                      (insights.userProfiles.filter(p => p.riskScore >= 70).length /
                        insights.userProfiles.length) *
                      100
                    }
                    color="error"
                    sx={{ mt: 1, mb: 2 }}
                  />
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              centered
            >
              <Tab icon={<GroupIcon />} label="User Segments" />
              <Tab icon={<TimelineIcon />} label="Pattern Analysis" />
              <Tab icon={<WarningIcon />} label="Risk Analysis" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ mb: 2 }}>
                <FormControl size="small">
                  <InputLabel>Segment</InputLabel>
                  <Select
                    value={selectedSegment}
                    onChange={(e) => setSelectedSegment(e.target.value)}
                    label="Segment"
                  >
                    <MenuItem value="all">All Users</MenuItem>
                    {insights?.userProfiles[0]?.segments.map(segment => (
                      <MenuItem key={segment} value={segment}>
                        {segment}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              {userSegmentData && (
                <Box sx={{ height: 400 }}>
                  <Radar data={userSegmentData} />
                </Box>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  {clusterVisualization && (
                    <Box sx={{ height: 400 }}>
                      <Bubble
                        data={clusterVisualization}
                        options={{
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Engagement Score',
                              },
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Activity Level',
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="h6" gutterBottom>
                    Common Patterns
                  </Typography>
                  {patternAnalysis && (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Pattern</TableCell>
                            <TableCell align="right">Count</TableCell>
                            <TableCell align="right">Confidence</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {patternAnalysis.map(pattern => (
                            <TableRow key={pattern.pattern}>
                              <TableCell>{pattern.pattern}</TableCell>
                              <TableCell align="right">{pattern.count}</TableCell>
                              <TableCell align="right">
                                {(pattern.avgConfidence * 100).toFixed(1)}%
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Grid>
              </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  {riskDistribution && (
                    <Box sx={{ height: 400 }}>
                      <Scatter
                        data={{
                          datasets: insights?.userProfiles.map(profile => ({
                            label: `User ${profile.userId}`,
                            data: [
                              {
                                x: profile.engagementScore,
                                y: profile.riskScore,
                              },
                            ],
                            backgroundColor:
                              profile.riskScore >= 70
                                ? 'rgba(255, 99, 132, 0.5)'
                                : profile.riskScore >= 30
                                ? 'rgba(255, 206, 86, 0.5)'
                                : 'rgba(75, 192, 192, 0.5)',
                          })),
                        }}
                        options={{
                          scales: {
                            x: {
                              title: {
                                display: true,
                                text: 'Engagement Score',
                              },
                            },
                            y: {
                              title: {
                                display: true,
                                text: 'Risk Score',
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    High Risk Users
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>User ID</TableCell>
                          <TableCell align="right">Risk Score</TableCell>
                          <TableCell align="right">Last Active</TableCell>
                          <TableCell>Key Factors</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {insights?.userProfiles
                          .filter(profile => profile.riskScore >= 70)
                          .map(profile => (
                            <TableRow key={profile.userId}>
                              <TableCell>{profile.userId}</TableCell>
                              <TableCell align="right">
                                {profile.riskScore.toFixed(1)}
                              </TableCell>
                              <TableCell align="right">
                                {format(new Date(profile.lastActive), 'MMM d, yyyy')}
                              </TableCell>
                              <TableCell>
                                {profile.behaviorPatterns
                                  .filter(p => p.confidence < 0.5)
                                  .map(p => (
                                    <Chip
                                      key={p.pattern}
                                      label={p.pattern}
                                      size="small"
                                      color="error"
                                      sx={{ mr: 0.5, mb: 0.5 }}
                                    />
                                  ))}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
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
            <Typography gutterBottom>Minimum Confidence Level</Typography>
            <Slider
              value={minConfidence}
              onChange={(_, value) => setMinConfidence(value as number)}
              min={0.5}
              max={0.95}
              step={0.05}
              valueLabelDisplay="auto"
              valueLabelFormat={value => `${(value * 100).toFixed(0)}%`}
            />
            <Typography gutterBottom sx={{ mt: 2 }}>
              Maximum Clusters
            </Typography>
            <Slider
              value={maxClusters}
              onChange={(_, value) => setMaxClusters(value as number)}
              min={2}
              max={10}
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

export default BehaviorAnalytics;
