import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Chip,
  IconButton,
  Text,
  ActivityIndicator,
} from 'react-native-paper';
import { JobAssignment } from '../types/job';
import { useJobs } from '../contexts/JobContext';

interface JobNotificationBannerProps {
  job: JobAssignment;
  onDismiss: () => void;
}

export default function JobNotificationBanner({ job, onDismiss }: JobNotificationBannerProps) {
  const [responding, setResponding] = useState(false);
  const { respondToJob } = useJobs();

  const handleAccept = async () => {
    try {
      setResponding(true);
      await respondToJob({
        jobId: job.id,
        accepted: true,
        responseAt: new Date().toISOString(),
        notes: 'Accepted via mobile app'
      });
      onDismiss();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to accept job: ' + error.message);
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    Alert.alert(
      'Decline Job',
      'Are you sure you want to decline this job assignment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setResponding(true);
              await respondToJob({
                jobId: job.id,
                accepted: false,
                responseAt: new Date().toISOString(),
                notes: 'Declined via mobile app'
              });
              onDismiss();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to decline job: ' + error.message);
            } finally {
              setResponding(false);
            }
          }
        }
      ]
    );
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card style={styles.container}>
      <Card.Content>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Title style={styles.title}>New Job Assignment</Title>
            <Chip 
              style={[styles.priorityChip, { backgroundColor: getPriorityColor(job.priority) }]}
              textStyle={styles.priorityText}
            >
              {job.priority.toUpperCase()}
            </Chip>
          </View>
          <IconButton
            icon="close"
            size={20}
            onPress={onDismiss}
            style={styles.closeButton}
          />
        </View>

        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.propertyName}>{job.propertyName}</Text>
          <Text style={styles.guestName}>Guest: {job.guestName}</Text>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Scheduled:</Text>
            <Text style={styles.timeValue}>{formatDate(job.scheduledDate)}</Text>
          </View>
          
          <View style={styles.timeInfo}>
            <Text style={styles.timeLabel}>Duration:</Text>
            <Text style={styles.timeValue}>{job.estimatedDuration} minutes</Text>
          </View>

          {job.description && (
            <Paragraph style={styles.description} numberOfLines={2}>
              {job.description}
            </Paragraph>
          )}
        </View>

        <View style={styles.actions}>
          {responding ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#3B82F6" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          ) : (
            <>
              <Button
                mode="outlined"
                onPress={handleDecline}
                style={[styles.button, styles.declineButton]}
                labelStyle={styles.declineButtonText}
              >
                Decline
              </Button>
              <Button
                mode="contained"
                onPress={handleAccept}
                style={[styles.button, styles.acceptButton]}
                labelStyle={styles.acceptButtonText}
              >
                Accept
              </Button>
            </>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    backgroundColor: '#1F2937',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  priorityChip: {
    height: 24,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    margin: 0,
  },
  jobInfo: {
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  propertyName: {
    fontSize: 14,
    color: '#3B82F6',
    marginBottom: 2,
  },
  guestName: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  timeInfo: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timeLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    width: 80,
  },
  timeValue: {
    fontSize: 14,
    color: '#F9FAFB',
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  declineButton: {
    borderColor: '#EF4444',
  },
  declineButtonText: {
    color: '#EF4444',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});
