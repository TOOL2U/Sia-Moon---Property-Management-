import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  IconButton,
  ProgressBar,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useJobs } from '../contexts/JobContext';
import { JobAssignment } from '../types/job';
import { NavigationService } from '../services/navigationService';

export default function ActiveJobsScreen() {
  const navigation = useNavigation();
  const { activeJobs, loading, refreshJobs, startJob } = useJobs();
  const [startingJobs, setStartingJobs] = useState<string[]>([]);

  const handleRefresh = () => {
    refreshJobs();
  };

  const handleStartJob = async (jobId: string) => {
    try {
      setStartingJobs(prev => [...prev, jobId]);
      await startJob(jobId);
      Alert.alert('Success', 'Job started successfully!');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start job: ' + error.message);
    } finally {
      setStartingJobs(prev => prev.filter(id => id !== jobId));
    }
  };

  const handleNavigateToJob = async (job: JobAssignment) => {
    if (!job.propertyAddress) {
      Alert.alert('No Address', 'Property address not available for navigation.');
      return;
    }

    try {
      await NavigationService.navigateToAddress(job.propertyAddress, 'driving');
    } catch (error) {
      Alert.alert('Navigation Error', 'Unable to open navigation app.');
    }
  };

  const handleViewJobDetails = (job: JobAssignment) => {
    navigation.navigate('JobDetails' as never, { job } as never);
  };

  const handleCompleteJob = (job: JobAssignment) => {
    navigation.navigate('JobCompletion' as never, { job } as never);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F97316';
      case 'medium': return '#EAB308';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return '#3B82F6';
      case 'in_progress': return '#8B5CF6';
      case 'completed': return '#10B981';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderJobCard = (job: JobAssignment) => {
    const isStarting = startingJobs.includes(job.id);
    const canStart = job.status === 'accepted';
    const canComplete = job.status === 'in_progress';

    return (
      <Card key={job.id} style={styles.jobCard}>
        <Card.Content>
          {/* Header */}
          <View style={styles.jobHeader}>
            <View style={styles.jobTitleContainer}>
              <Title style={styles.jobTitle} numberOfLines={1}>
                {job.title}
              </Title>
              <View style={styles.chipContainer}>
                <Chip 
                  style={[styles.priorityChip, { backgroundColor: getPriorityColor(job.priority) }]}
                  textStyle={styles.chipText}
                >
                  {job.priority.toUpperCase()}
                </Chip>
                <Chip 
                  style={[styles.statusChip, { backgroundColor: getStatusColor(job.status) }]}
                  textStyle={styles.chipText}
                >
                  {job.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>
          </View>

          {/* Job Info */}
          <View style={styles.jobInfo}>
            <Text style={styles.propertyName}>{job.propertyName}</Text>
            <Text style={styles.guestName}>Guest: {job.guestName}</Text>
            <Text style={styles.scheduledTime}>
              Scheduled: {formatDate(job.scheduledDate)}
            </Text>
            <Text style={styles.duration}>
              Duration: {job.estimatedDuration} minutes
            </Text>
          </View>

          {/* Progress Bar */}
          {job.status === 'in_progress' && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressLabel}>Progress: {job.progress}%</Text>
              <ProgressBar 
                progress={job.progress / 100} 
                color="#3B82F6"
                style={styles.progressBar}
              />
            </View>
          )}

          <Divider style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <View style={styles.actionRow}>
              <Button
                mode="outlined"
                onPress={() => handleViewJobDetails(job)}
                style={styles.actionButton}
                icon="eye"
              >
                Details
              </Button>
              
              {job.propertyAddress && (
                <Button
                  mode="outlined"
                  onPress={() => handleNavigateToJob(job)}
                  style={styles.actionButton}
                  icon="navigation"
                >
                  Navigate
                </Button>
              )}
            </View>

            <View style={styles.actionRow}>
              {canStart && (
                <Button
                  mode="contained"
                  onPress={() => handleStartJob(job.id)}
                  style={[styles.actionButton, styles.startButton]}
                  icon="play"
                  loading={isStarting}
                  disabled={isStarting}
                >
                  {isStarting ? 'Starting...' : 'Start Job'}
                </Button>
              )}

              {canComplete && (
                <Button
                  mode="contained"
                  onPress={() => handleCompleteJob(job)}
                  style={[styles.actionButton, styles.completeButton]}
                  icon="check"
                >
                  Complete
                </Button>
              )}
            </View>
          </View>
        </Card.Content>
      </Card>
    );
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
          <Title style={styles.headerTitle}>Active Jobs</Title>
          <Text style={styles.headerSubtitle}>
            {activeJobs.length} active job{activeJobs.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Jobs List */}
        {activeJobs.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No Active Jobs</Text>
              <Paragraph style={styles.emptyText}>
                You don't have any active jobs at the moment. 
                Check back later or refresh to see new assignments.
              </Paragraph>
              <Button
                mode="outlined"
                onPress={handleRefresh}
                style={styles.refreshButton}
                icon="refresh"
              >
                Refresh
              </Button>
            </Card.Content>
          </Card>
        ) : (
          <View style={styles.jobsList}>
            {activeJobs.map(renderJobCard)}
          </View>
        )}
      </ScrollView>
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
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  jobsList: {
    padding: 16,
    paddingTop: 8,
  },
  jobCard: {
    marginBottom: 16,
    backgroundColor: '#1F2937',
  },
  jobHeader: {
    marginBottom: 12,
  },
  jobTitleContainer: {
    gap: 8,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    height: 24,
  },
  statusChip: {
    height: 24,
  },
  chipText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  jobInfo: {
    marginBottom: 12,
    gap: 4,
  },
  propertyName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  guestName: {
    fontSize: 14,
    color: '#D1D5DB',
  },
  scheduledTime: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#374151',
  },
  actionContainer: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  startButton: {
    backgroundColor: '#10B981',
  },
  completeButton: {
    backgroundColor: '#3B82F6',
  },
  emptyCard: {
    margin: 16,
    backgroundColor: '#1F2937',
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  refreshButton: {
    borderColor: '#3B82F6',
  },
});
