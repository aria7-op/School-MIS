import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  RefreshControl
} from 'react-native';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useCustomerInteractions } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerDocuments } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerTickets } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerTasks } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerAutomations } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerCollaborations } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerWorkflows } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerIntegrations } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerNotifications } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerSegments } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerPipelines } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerSearch } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerBulkOperations } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerCache } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerAnalytics } from '../hooks/useCustomerAdvancedFeatures';
import { useCustomerSchoolFeatures } from '../hooks/useCustomerAdvancedFeatures';
import { colors } from '../../../constants/colors';
import { CustomerInteraction, CustomerDocument, CustomerTicket, CustomerTask } from '../services/customerAdvancedApi';

const { width } = Dimensions.get('window');

interface CustomerAdvancedFeaturesProps {
  customerId: string;
  customerName: string;
}

type TabType = 
  | 'dashboard'
  | 'interactions'
  | 'documents'
  | 'tickets'
  | 'tasks'
  | 'automations'
  | 'collaborations'
  | 'workflows'
  | 'integrations'
  | 'notifications'
  | 'segments'
  | 'pipeline'
  | 'search'
  | 'bulk'
  | 'cache'
  | 'analytics'
  | 'school';

const CustomerAdvancedFeatures: React.FC<CustomerAdvancedFeaturesProps> = ({
  customerId,
  customerName
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [refreshing, setRefreshing] = useState(false);

  // Hooks for all features
  const interactionsHook = useCustomerInteractions(customerId);
  const documentsHook = useCustomerDocuments(customerId);
  const ticketsHook = useCustomerTickets(customerId);
  const tasksHook = useCustomerTasks(customerId);
  const automationsHook = useCustomerAutomations();
  const collaborationsHook = useCustomerCollaborations(customerId);
  const workflowsHook = useCustomerWorkflows();
  const integrationsHook = useCustomerIntegrations();
  const notificationsHook = useCustomerNotifications(customerId);
  const segmentsHook = useCustomerSegments();
  const pipelinesHook = useCustomerPipelines();
  const searchHook = useCustomerSearch();
  const bulkOperationsHook = useCustomerBulkOperations();
  const cacheHook = useCustomerCache();
  const analyticsHook = useCustomerAnalytics();
  const schoolFeaturesHook = useCustomerSchoolFeatures(customerId);

  const tabs = useMemo(() => [
    { key: 'dashboard', label: t('customers.tabs.dashboard'), icon: '📊' },
    { key: 'interactions', label: t('customers.tabs.interactions'), icon: '💬' },
    { key: 'documents', label: t('customers.tabs.documents'), icon: '📄' },
    { key: 'tickets', label: t('customers.tabs.tickets'), icon: '🎫' },
    { key: 'tasks', label: t('customers.tabs.tasks'), icon: '✅' },
    { key: 'automations', label: t('customers.tabs.automations'), icon: '🤖' },
    { key: 'collaborations', label: t('customers.tabs.collaborations'), icon: '👥' },
    { key: 'workflows', label: t('customers.tabs.workflows'), icon: '🔄' },
    { key: 'integrations', label: t('customers.tabs.integrations'), icon: '🔗' },
    { key: 'notifications', label: t('customers.tabs.notifications'), icon: '🔔' },
    { key: 'segments', label: t('customers.tabs.segments'), icon: '🏷️' },
    { key: 'pipeline', label: t('customers.tabs.pipeline'), icon: '📈' },
    { key: 'search', label: t('customers.tabs.search'), icon: '🔍' },
    { key: 'bulk', label: t('customers.tabs.bulk'), icon: '📦' },
    { key: 'cache', label: t('customers.tabs.cache'), icon: '⚡' },
    { key: 'analytics', label: t('customers.tabs.analytics'), icon: '📊' },
    { key: 'school', label: t('customers.tabs.school'), icon: '🎓' }
  ], [t]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Refresh all data
      await Promise.all([
        interactionsHook.fetchInteractions(),
        documentsHook.fetchDocuments(),
        ticketsHook.fetchTickets(),
        tasksHook.fetchTasks(),
        automationsHook.fetchAutomations(),
        collaborationsHook.fetchCollaborations(),
        workflowsHook.fetchWorkflows(),
        integrationsHook.fetchIntegrations(),
        notificationsHook.fetchNotifications(),
        segmentsHook.fetchSegments(),
        pipelinesHook.fetchPipelines(),
        bulkOperationsHook.fetchOperations(),
        cacheHook.fetchCacheStats(),
        analyticsHook.fetchAnalytics(),
        schoolFeaturesHook.fetchClasses()
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab 
          customerId={customerId}
          customerName={customerName}
          interactionsHook={interactionsHook}
          documentsHook={documentsHook}
          ticketsHook={ticketsHook}
          tasksHook={tasksHook}
          analyticsHook={analyticsHook}
        />;
      case 'interactions':
        return <InteractionsTab hook={interactionsHook} />;
      case 'documents':
        return <DocumentsTab hook={documentsHook} />;
      case 'tickets':
        return <TicketsTab hook={ticketsHook} />;
      case 'tasks':
        return <TasksTab hook={tasksHook} />;
      case 'automations':
        return <AutomationsTab hook={automationsHook} />;
      case 'collaborations':
        return <CollaborationsTab hook={collaborationsHook} />;
      case 'workflows':
        return <WorkflowsTab hook={workflowsHook} />;
      case 'integrations':
        return <IntegrationsTab hook={integrationsHook} />;
      case 'notifications':
        return <NotificationsTab hook={notificationsHook} />;
      case 'segments':
        return <SegmentsTab hook={segmentsHook} />;
      case 'pipeline':
        return <PipelineTab hook={pipelinesHook} />;
      case 'search':
        return <SearchTab hook={searchHook} />;
      case 'bulk':
        return <BulkOperationsTab hook={bulkOperationsHook} />;
      case 'cache':
        return <CacheTab hook={cacheHook} />;
      case 'analytics':
        return <AnalyticsTab hook={analyticsHook} />;
      case 'school':
        return <SchoolFeaturesTab hook={schoolFeaturesHook} />;
      default:
        return <Text>Select a tab</Text>;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{customerName}</Text>
        <Text style={styles.subtitle}>{t('customers.advancedFeatures')}</Text>
      </View>

      {/* Tabs */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab.key as TabType)}
          >
            <Text style={styles.tabIcon}>{tab.icon}</Text>
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.activeTabLabel
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderTabContent()}
      </ScrollView>
    </View>
  );
};

// Dashboard Tab Component
const DashboardTab: React.FC<any> = ({ customerId, customerName, interactionsHook, documentsHook, ticketsHook, tasksHook, analyticsHook }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.dashboardContainer}>
      <Text style={styles.dashboardTitle}>{t('customers.dashboard.title')}</Text>
      
      {/* Quick Stats */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{interactionsHook.interactions.length}</Text>
          <Text style={styles.statLabel}>{t('customers.dashboard.interactions')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{documentsHook.documents.length}</Text>
          <Text style={styles.statLabel}>{t('customers.dashboard.documents')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{ticketsHook.tickets.length}</Text>
          <Text style={styles.statLabel}>{t('customers.dashboard.tickets')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{tasksHook.tasks.length}</Text>
          <Text style={styles.statLabel}>{t('customers.dashboard.tasks')}</Text>
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('customers.dashboard.recentActivity')}</Text>
        <View style={styles.activityList}>
          {interactionsHook.interactions.slice(0, 5).map((interaction: CustomerInteraction) => (
            <View key={interaction.id} style={styles.activityItem}>
              <Text style={styles.activityTitle}>{interaction.title}</Text>
              <Text style={styles.activityDate}>{new Date(interaction.date).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

// Interactions Tab Component
const InteractionsTab: React.FC<any> = ({ hook }) => {
  const { t } = useTranslation();

  if (hook.loading) {
    return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
  }

  if (hook.error) {
    return <Text style={styles.errorText}>{hook.error}</Text>;
  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>{t('customers.interactions.title')}</Text>
      <View style={styles.listContainer}>
        {hook.interactions.map((interaction: CustomerInteraction) => (
          <View key={interaction.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{interaction.title}</Text>
            <Text style={styles.itemDescription}>{interaction.description}</Text>
            <Text style={styles.itemDate}>{new Date(interaction.date).toLocaleDateString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Documents Tab Component
const DocumentsTab: React.FC<any> = ({ hook }) => {
  const { t } = useTranslation();

  if (hook.loading) {
    return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
  }

  if (hook.error) {
    return <Text style={styles.errorText}>{hook.error}</Text>;
  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>{t('customers.documents.title')}</Text>
      <View style={styles.listContainer}>
        {hook.documents.map((document: CustomerDocument) => (
          <View key={document.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{document.name}</Text>
            <Text style={styles.itemDescription}>{document.type}</Text>
            <Text style={styles.itemDate}>{new Date(document.uploadedAt).toLocaleDateString()}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Tickets Tab Component
const TicketsTab: React.FC<any> = ({ hook }) => {
  const { t } = useTranslation();

  if (hook.loading) {
    return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
  }

  if (hook.error) {
    return <Text style={styles.errorText}>{hook.error}</Text>;
  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>{t('customers.tickets.title')}</Text>
      <View style={styles.listContainer}>
        {hook.tickets.map((ticket: CustomerTicket) => (
          <View key={ticket.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{ticket.title}</Text>
            <Text style={styles.itemDescription}>{ticket.description}</Text>
            <Text style={styles.itemStatus}>{ticket.status}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Tasks Tab Component
const TasksTab: React.FC<any> = ({ hook }) => {
  const { t } = useTranslation();

  if (hook.loading) {
    return <Text style={styles.loadingText}>{t('common.loading')}</Text>;
  }

  if (hook.error) {
    return <Text style={styles.errorText}>{hook.error}</Text>;
  }

  return (
    <View style={styles.tabContainer}>
      <Text style={styles.tabTitle}>{t('customers.tasks.title')}</Text>
      <View style={styles.listContainer}>
        {hook.tasks.map((task: CustomerTask) => (
          <View key={task.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{task.title}</Text>
            <Text style={styles.itemDescription}>{task.description}</Text>
            <Text style={styles.itemStatus}>{task.status}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Placeholder components for other tabs
const AutomationsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Automations</Text>
    <Text style={styles.placeholderText}>Automations management coming soon...</Text>
  </View>
);

const CollaborationsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Collaborations</Text>
    <Text style={styles.placeholderText}>Collaboration features coming soon...</Text>
  </View>
);

const WorkflowsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Workflows</Text>
    <Text style={styles.placeholderText}>Workflow management coming soon...</Text>
  </View>
);

const IntegrationsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Integrations</Text>
    <Text style={styles.placeholderText}>Integration management coming soon...</Text>
  </View>
);

const NotificationsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Notifications</Text>
    <Text style={styles.placeholderText}>Notification management coming soon...</Text>
  </View>
);

const SegmentsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Segments</Text>
    <Text style={styles.placeholderText}>Customer segmentation coming soon...</Text>
  </View>
);

const PipelineTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Pipeline</Text>
    <Text style={styles.placeholderText}>Pipeline management coming soon...</Text>
  </View>
);

const SearchTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Search</Text>
    <Text style={styles.placeholderText}>Advanced search coming soon...</Text>
  </View>
);

const BulkOperationsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Bulk Operations</Text>
    <Text style={styles.placeholderText}>Bulk operations coming soon...</Text>
  </View>
);

const CacheTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Cache Management</Text>
    <Text style={styles.placeholderText}>Cache management coming soon...</Text>
  </View>
);

const AnalyticsTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>Analytics</Text>
    <Text style={styles.placeholderText}>Analytics dashboard coming soon...</Text>
  </View>
);

const SchoolFeaturesTab: React.FC<any> = ({ hook }) => (
  <View style={styles.tabContainer}>
    <Text style={styles.tabTitle}>School Features</Text>
    <Text style={styles.placeholderText}>School-specific features coming soon...</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.8,
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabsContent: {
    paddingHorizontal: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 80,
  },
  activeTab: {
    backgroundColor: colors.primary,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: colors.text,
    textAlign: 'center',
  },
  activeTabLabel: {
    color: colors.white,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  activityList: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  activityItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  tabContainer: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  listContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
  },
  listItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  itemDate: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  itemStatus: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: colors.error,
  },
  placeholderText: {
    textAlign: 'center',
    padding: 20,
    fontSize: 16,
    color: colors.textSecondary,
  },
});

export default CustomerAdvancedFeatures; 
