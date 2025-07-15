import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  FAB,
  Badge,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useJobs } from '../contexts/JobContext';
import JobNotificationBanner from '../components/JobNotificationBanner';

export default function DashboardScreen() {
  const navigation = useNavigation();
  const { staffProfile, signOut } = useAuth();
  const { pendingJobs, activeJobs, completedJobs, loading, refreshJobs } = useJobs();
  const [dismissedJobs, setDismissedJobs] = useState<string[]>([]);

  const handleRefresh = () => {
    refreshJobs();
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const dismissJobNotification = (jobId: string) => {
    setDismissedJobs(prev => [...prev, jobId]);
  };

  // Filter out dismissed pending jobs
  const visiblePendingJobs = pendingJobs.filter(
    job => !job.staffResponse && !dismissedJobs.includes(job.id)
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Title style={styles.greeting}>
              {getGreeting()}, {staffProfile?.firstName}!
            </Title>
            <Paragraph style={styles.role}>
              {staffProfile?.role} • Sia Moon Staff
            </Paragraph>
          </View>
          <IconButton
            icon="logout"
            size={24}
            onPress={handleSignOut}
            style={styles.logoutButton}
          />
        </View>

        {/* Job Notifications */}
        {visiblePendingJobs.map(job => (
          <JobNotificationBanner
            key={job.id}
            job={job}
            onDismiss={() => dismissJobNotification(job.id)}
          />
        ))}

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{pendingJobs.length}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{activeJobs.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <Text style={styles.statNumber}>{completedJobs.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Quick Actions */}
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.actionTitle}>Quick Actions</Title>
            
            <Button
              mode="contained"
              onPress={() => navigation.navigate('ActiveJobs' as never)}
              style={styles.actionButton}
              icon="briefcase"
            >
              View Active Jobs
              {activeJobs.length > 0 && (
                <Badge style={styles.badge}>{activeJobs.length}</Badge>
              )}
            </Button>

            <Button
              mode="outlined"
              onPress={() => navigation.navigate('Profile' as never)}
              style={styles.actionButton}
              icon="account"
            >
              View Profile
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Activity */}
        <Card style={styles.activityCard}>
          <Card.Content>
            <Title style={styles.activityTitle}>Today's Summary</Title>
            
            {activeJobs.length === 0 && pendingJobs.length === 0 ? (
              <Paragraph style={styles.noActivity}>
                No active jobs at the moment. Great work!
              </Paragraph>
            ) : (
              <View>
                {pendingJobs.length > 0 && (
                  <Paragraph style={styles.activityText}>
                    • {pendingJobs.length} job{pendingJobs.length !== 1 ? 's' : ''} awaiting response
                  </Paragraph>
                )}
                {activeJobs.length > 0 && (
                  <Paragraph style={styles.activityText}>
                    • {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''} in progress
                  </Paragraph>
                )}
                <Paragraph style={styles.activityText}>
                  • {completedJobs.length} job{completedJobs.length !== 1 ? 's' : ''} completed today
                </Paragraph>
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Floating Action Button */}
      {activeJobs.length > 0 && (
        <FAB
          icon="play"
          label="Active Jobs"
          style={styles.fab}
          onPress={() => navigation.navigate('ActiveJobs' as never)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  role: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  logoutButton: {
    margin: 0,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  actionCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1F2937',
  },
  actionTitle: {
    fontSize: 18,
    color: '#F9FAFB',
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
  },
  badge: {
    marginLeft: 8,
    backgroundColor: '#EF4444',
  },
  activityCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#1F2937',
  },
  activityTitle: {
    fontSize: 18,
    color: '#F9FAFB',
    marginBottom: 12,
  },
  noActivity: {
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  activityText: {
    color: '#D1D5DB',
    marginBottom: 8,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#3B82F6',
  },
});
