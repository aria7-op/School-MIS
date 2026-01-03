import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

interface UserEvent {
  userId: string;
  eventType: string;
  timestamp: string;
  duration?: number;
  metadata: Record<string, any>;
}

interface UserProfile {
  userId: string;
  segments: string[];
  preferences: Record<string, any>;
  riskScore: number;
  engagementScore: number;
  lastActive: string;
  behaviorPatterns: Array<{
    pattern: string;
    confidence: number;
    frequency: number;
  }>;
}

interface BehaviorCluster {
  clusterId: string;
  size: number;
  centralTendencies: Record<string, number>;
  commonPatterns: Array<{
    pattern: string;
    support: number;
  }>;
  demographics: Record<string, number>;
}

interface PredictiveModel {
  userId: string;
  predictions: Array<{
    event: string;
    probability: number;
    confidence: number;
    timeframe: string;
  }>;
  recommendations: Array<{
    action: string;
    expectedImpact: number;
    confidence: number;
  }>;
}

interface AnalyticsFilter {
  startDate: Date;
  endDate: Date;
  eventTypes: string[];
  userSegments: string[];
  minConfidence: number;
  maxClusters: number;
}

interface BehaviorInsights {
  userProfiles: UserProfile[];
  clusters: BehaviorCluster[];
  predictions: PredictiveModel[];
  anomalies: Array<{
    userId: string;
    eventType: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
  trends: Array<{
    pattern: string;
    trend: 'increasing' | 'decreasing' | 'stable';
    magnitude: number;
    significance: number;
  }>;
}

class BehaviorAnalyzer {
  static calculateEngagementScore(events: UserEvent[]): number {
    const weights = {
      login: 1,
      interaction: 2,
      purchase: 5,
      feedback: 3,
    };

    return events.reduce((score, event) => {
      const weight = weights[event.eventType as keyof typeof weights] || 1;
      const recency = Math.exp(
        -0.1 * Math.abs(new Date().getTime() - new Date(event.timestamp).getTime()) / (24 * 60 * 60 * 1000)
      );
      return score + weight * recency;
    }, 0);
  }

  static identifyPatterns(events: UserEvent[]): Array<{
    pattern: string;
    confidence: number;
    frequency: number;
  }> {
    const sequences = this.extractSequences(events);
    const patterns = this.findFrequentPatterns(sequences);
    return patterns.map(pattern => ({
      pattern: pattern.sequence.join(' → '),
      confidence: pattern.support / sequences.length,
      frequency: pattern.support,
    }));
  }

  private static extractSequences(events: UserEvent[]): string[][] {
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const sequences: string[][] = [];
    let currentSequence: string[] = [];
    let lastTimestamp: number | null = null;

    sortedEvents.forEach(event => {
      const timestamp = new Date(event.timestamp).getTime();
      if (lastTimestamp && timestamp - lastTimestamp > 30 * 60 * 1000) {
        // Break sequence if more than 30 minutes between events
        if (currentSequence.length > 1) sequences.push([...currentSequence]);
        currentSequence = [];
      }
      currentSequence.push(event.eventType);
      lastTimestamp = timestamp;
    });

    if (currentSequence.length > 1) sequences.push(currentSequence);
    return sequences;
  }

  private static findFrequentPatterns(
    sequences: string[][]
  ): Array<{ sequence: string[]; support: number }> {
    const patterns = new Map<string, number>();

    sequences.forEach(sequence => {
      for (let length = 2; length <= Math.min(sequence.length, 5); length++) {
        for (let i = 0; i <= sequence.length - length; i++) {
          const pattern = sequence.slice(i, i + length);
          const key = pattern.join(',');
          patterns.set(key, (patterns.get(key) || 0) + 1);
        }
      }
    });

    return Array.from(patterns.entries())
      .map(([key, support]) => ({
        sequence: key.split(','),
        support,
      }))
      .filter(pattern => pattern.support >= 2) // Minimum support threshold
      .sort((a, b) => b.support - a.support)
      .slice(0, 10); // Top 10 patterns
  }

  static calculateRiskScore(profile: Partial<UserProfile>, events: UserEvent[]): number {
    const riskFactors = {
      inactivity: this.calculateInactivityRisk(events),
      patternDeviation: this.calculatePatternDeviationRisk(profile.behaviorPatterns || []),
      engagementDecline: this.calculateEngagementDeclineRisk(events),
    };

    return (
      (riskFactors.inactivity * 0.4 +
        riskFactors.patternDeviation * 0.3 +
        riskFactors.engagementDecline * 0.3) *
      100
    );
  }

  private static calculateInactivityRisk(events: UserEvent[]): number {
    if (events.length === 0) return 1;
    const lastEvent = new Date(Math.max(...events.map(e => new Date(e.timestamp).getTime())));
    const daysSinceLastActivity = Math.floor(
      (new Date().getTime() - lastEvent.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.min(daysSinceLastActivity / 30, 1); // Max risk after 30 days
  }

  private static calculatePatternDeviationRisk(
    patterns: Array<{ pattern: string; confidence: number }>
  ): number {
    if (patterns.length === 0) return 0.5;
    const avgConfidence = patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length;
    return 1 - avgConfidence;
  }

  private static calculateEngagementDeclineRisk(events: UserEvent[]): number {
    if (events.length < 2) return 0.5;

    const periods = this.splitIntoPeriods(events, 7); // 7-day periods
    if (periods.length < 2) return 0.5;

    const engagementScores = periods.map(period => this.calculateEngagementScore(period));
    const trend =
      (engagementScores[engagementScores.length - 1] - engagementScores[0]) /
      engagementScores[0];

    return Math.max(0, Math.min(1, -trend)); // Convert decline to risk score
  }

  private static splitIntoPeriods(events: UserEvent[], days: number): UserEvent[][] {
    const periods: UserEvent[][] = [];
    const periodLength = days * 24 * 60 * 60 * 1000;
    const sortedEvents = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let currentPeriod: UserEvent[] = [];
    let periodStart = new Date(sortedEvents[0].timestamp).getTime();

    sortedEvents.forEach(event => {
      const eventTime = new Date(event.timestamp).getTime();
      if (eventTime - periodStart > periodLength) {
        periods.push(currentPeriod);
        currentPeriod = [];
        periodStart = eventTime;
      }
      currentPeriod.push(event);
    });

    if (currentPeriod.length > 0) periods.push(currentPeriod);
    return periods;
  }
}

const useBehaviorAnalytics = (initialFilter?: Partial<AnalyticsFilter>) => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AnalyticsFilter>({
    startDate: startOfDay(subDays(new Date(), 30)),
    endDate: endOfDay(new Date()),
    eventTypes: [],
    userSegments: [],
    minConfidence: 0.7,
    maxClusters: 5,
    ...initialFilter,
  });

  const {
    data: behaviorData,
    isLoading,
    error,
  } = useQuery<{ events: UserEvent[]; profiles: Partial<UserProfile>[] }, Error>(
    ['behaviorAnalytics', filter],
    async () => {
      const response = await fetch('/api/admin/analytics/behavior', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filter),
      });
      if (!response.ok) throw new Error('Failed to fetch behavior analytics data');
      return response.json();
    },
    {
      keepPreviousData: true,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );

  const insights = useMemo(() => {
    if (!behaviorData) return null;

    const userProfiles = behaviorData.profiles.map(profile => {
      const userEvents = behaviorData.events.filter(e => e.userId === profile.userId);
      return {
        ...profile,
        engagementScore: BehaviorAnalyzer.calculateEngagementScore(userEvents),
        behaviorPatterns: BehaviorAnalyzer.identifyPatterns(userEvents),
        riskScore: BehaviorAnalyzer.calculateRiskScore(profile, userEvents),
      } as UserProfile;
    });

    // Additional analysis would be implemented here
    return {
      userProfiles,
      clusters: [], // Would require clustering algorithm implementation
      predictions: [], // Would require predictive model implementation
      anomalies: [], // Would require anomaly detection implementation
      trends: [], // Would require trend analysis implementation
    } as BehaviorInsights;
  }, [behaviorData]);

  const generateReport = useCallback(async () => {
    if (!insights) throw new Error('No data available for report generation');

    const response = await fetch('/api/admin/analytics/behavior/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filter,
        insights,
      }),
    });

    if (!response.ok) throw new Error('Failed to generate behavior report');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `behavior_analytics_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }, [insights, filter]);

  const exportData = useCallback(
    async (format: 'csv' | 'json') => {
      if (!insights) throw new Error('No data available for export');

      const response = await fetch(`/api/admin/analytics/behavior/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filter,
          insights,
        }),
      });

      if (!response.ok) throw new Error(`Failed to export data in ${format} format`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `behavior_analytics_${format(new Date(), 'yyyy-MM-dd')}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    },
    [insights, filter]
  );

  return {
    filter,
    setFilter,
    insights,
    isLoading,
    error,
    generateReport,
    exportData,
  };
};

export default useBehaviorAnalytics;
