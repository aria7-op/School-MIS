import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { saveAs } from 'file-saver';
import useCustomerAnalytics from '../../hooks/useCustomerAnalytics';

ChartJS.register(ArcElement, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const safeArray = (arr: any) => {
  if (!Array.isArray(arr)) return [];
  return arr.filter(item => item !== null && item !== undefined);
};

const safeObject = (obj: any) => {
  return obj && typeof obj === 'object' ? obj : {};
};

const AnalyticsDashboard: React.FC = () => {
  const [exporting, setExporting] = useState(false);

  const {
    loading,
    error,
    dashboard,
    reports,
    getAnalyticsDashboard,
    getAnalyticsReports,
  } = useCustomerAnalytics();

  useEffect(() => {
    const fetchData = async () => {
      try {
        await getAnalyticsDashboard();
        await getAnalyticsReports();
      } catch (err) {
        
      }
    };
    fetchData();
  }, [getAnalyticsDashboard, getAnalyticsReports]);

  // Debug: Log the actual response structure
  useEffect(() => {

  }, [dashboard, reports, error]);

  // Handle different response structures
  const getReportsData = () => {
    if (!reports) return null;
    
    // If reports has a data property, use that
    if (reports && typeof reports === 'object' && 'data' in reports && Array.isArray((reports as any).data)) {
      return (reports as any).data;
    }
    
    // If reports is an array, use it directly
    if (Array.isArray(reports)) {
      return reports;
    }
    
    // If reports is an object with the expected structure, use it
    if (typeof reports === 'object' && reports !== null) {
      return reports;
    }
    
    return null;
  };

  const getDashboardData = () => {
    if (!dashboard) return null;
    
    // If dashboard has a data property, use that
    if (dashboard && typeof dashboard === 'object' && 'data' in dashboard && Array.isArray((dashboard as any).data)) {
      return (dashboard as any).data;
    }
    
    // If dashboard is an array, use it directly
    if (Array.isArray(dashboard)) {
      return dashboard;
    }
    
    // If dashboard is an object with the expected structure, use it
    if (typeof dashboard === 'object' && dashboard !== null) {
      return dashboard;
    }
    
    return null;
  };

  // Use the processed data
  const reportsData = getReportsData();
  const dashboardData = getDashboardData();

  // Use only backend data - no mock data fallback
  const summary = safeObject(reportsData?.summary);
  const genderBreakdown = safeArray(reportsData?.genderBreakdown);
  const sourceBreakdown = safeArray(reportsData?.sourceBreakdown);
  const conversionFunnel = safeArray(reportsData?.conversionFunnel);
  const monthlyTrends = safeArray(reportsData?.monthlyTrends);
  const topPerformers = safeArray(reportsData?.topPerformers);

  // Prepare chart data with better null checks
  const genderData = {
    labels: genderBreakdown.map((g: any) => g?.gender || 'Unknown'),
    datasets: [{
      data: genderBreakdown.map((g: any) => g?.count || 0),
      backgroundColor: ['#42a5f5', '#ef5350', '#ffb300', '#66bb6a'],
    }],
  };

  const sourceData = {
    labels: sourceBreakdown.map((s: any) => s?.source || 'Unknown'),
    datasets: [{
      data: sourceBreakdown.map((s: any) => s?.count || 0),
      backgroundColor: ['#7e57c2', '#26a69a', '#ffa726', '#8d6e63'],
    }],
  };

  const funnelData = {
    labels: conversionFunnel.map((f: any) => f?.stage || 'Unknown'),
    datasets: [{
      label: 'Customers',
      data: conversionFunnel.map((f: any) => f?.count || 0),
      backgroundColor: '#42a5f5',
    }],
  };

  const trendsData = {
    labels: monthlyTrends.map((t: any) => t?.month || 'Unknown'),
    datasets: [
      {
        label: 'New Customers',
        data: monthlyTrends.map((t: any) => t?.newCustomers || 0),
        borderColor: '#42a5f5',
        fill: false,
      },
      {
        label: 'Converted',
        data: monthlyTrends.map((t: any) => t?.convertedCustomers || 0),
        borderColor: '#66bb6a',
        fill: false,
      },
    ],
  };

  // Export to CSV
  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = [
        ['Month', 'New Visitors', 'Converted Visitors', 'Total Value'],
        ...monthlyTrends.map((t: any) => [t?.month || '', t?.newCustomers || 0, t?.convertedCustomers || 0, t?.totalValue || 0]),
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      saveAs(blob, `customer-analytics-${Date.now()}.csv`);
    } catch (e) {
      alert('Export failed');
    }
    setExporting(false);
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;

  // Show message if no data is available
  if (!reportsData && !dashboardData) {
    return (
      <Box p={2}>
        <Alert severity="info">
          No analytics data available. Please check your backend configuration.
          <br />
          <strong>Debug Info:</strong>
          <br />
          Reports: {JSON.stringify(reports, null, 2)}
          <br />
          Dashboard: {JSON.stringify(dashboard, null, 2)}
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={2}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4">Visitor Analytics Dashboard</Typography>
        <Button variant="outlined" onClick={handleExport} disabled={exporting}>
          {exporting ? 'Exporting...' : 'Export CSV'}
        </Button>
      </Box>

      <Grid container spacing={2}>
        {/* Quick Stats */}
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="h6">Total Visitors</Typography>
            <Typography variant="h4">{summary?.totalCustomers?.toLocaleString() ?? '-'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="h6">Active Visitors</Typography>
            <Typography variant="h4">{summary?.activeCustomers?.toLocaleString() ?? '-'}</Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="h6">Conversion Rate</Typography>
            <Typography variant="h4">
              {summary?.conversionRate !== undefined ? (summary.conversionRate * 100).toFixed(1) : '-'}%
            </Typography>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card><CardContent>
            <Typography variant="h6">Total Value</Typography>
            <Typography variant="h4">${summary?.totalValue?.toLocaleString() ?? '-'}</Typography>
          </CardContent></Card>
        </Grid>

        {/* Trends */}
        <Grid item xs={12} md={8}>
          <Card><CardContent>
            <Typography variant="h6">Monthly Trends</Typography>
            {monthlyTrends.length > 0 ? <Line data={trendsData} /> : <Typography>No data available</Typography>}
          </CardContent></Card>
        </Grid>

        {/* Conversion Funnel */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6">Conversion Funnel</Typography>
            {conversionFunnel.length > 0 ? <Bar data={funnelData} /> : <Typography>No data available</Typography>}
          </CardContent></Card>
        </Grid>

        {/* Gender Breakdown */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6">Gender Breakdown</Typography>
            {genderBreakdown.length > 0 ? <Pie data={genderData} /> : <Typography>No data available</Typography>}
          </CardContent></Card>
        </Grid>

        {/* Source Breakdown */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6">Source Breakdown</Typography>
            {sourceBreakdown.length > 0 ? <Pie data={sourceData} /> : <Typography>No data available</Typography>}
          </CardContent></Card>
        </Grid>

        {/* Top Performers */}
        <Grid item xs={12} md={4}>
          <Card><CardContent>
            <Typography variant="h6">Top Performers</Typography>
            {topPerformers.length > 0 ? (
              <Box>
                {topPerformers.slice(0, 5).map((tp: any, idx: number) => (
                  <Box key={tp?.customerId || idx} display="flex" justifyContent="space-between" my={1}>
                    <Typography>{tp?.name || 'Unknown'}</Typography>
                    <Typography>${tp?.value?.toLocaleString() || 0}</Typography>
                  </Box>
                ))}
              </Box>
            ) : <Typography>No data available</Typography>}
          </CardContent></Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card><CardContent>
            <Typography variant="h6">Recent Activity</Typography>
            {Array.isArray(dashboardData?.recentActivity) && dashboardData.recentActivity.length > 0 ? (
              <Box>
                {dashboardData.recentActivity.slice(0, 10).map((activity: any, idx: number) => (
                  <Box key={idx} display="flex" justifyContent="space-between" my={1}>
                    <Typography>{activity?.type || 'Unknown'}</Typography>
                    <Typography>{activity?.date || 'Unknown'}</Typography>
                  </Box>
                ))}
              </Box>
            ) : <Typography>No recent activity</Typography>}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AnalyticsDashboard; 
