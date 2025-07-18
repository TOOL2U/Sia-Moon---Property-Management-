import { useNavigation, useRoute } from '@react-navigation/native'
import React from 'react'
import { Alert, Linking, ScrollView, StyleSheet, View } from 'react-native'
import {
  Button,
  Card,
  Chip,
  Divider,
  List,
  Paragraph,
  Text,
  Title,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NavigationService } from '../services/navigationService'
import { JobAssignment } from '../types/job'

export default function JobDetailsScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const job = (route.params as any)?.job as JobAssignment

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const handleNavigateToJob = async () => {
    if (!job.propertyAddress) {
      Alert.alert(
        'No Address',
        'Property address not available for navigation.'
      )
      return
    }

    try {
      await NavigationService.navigateToAddress(job.propertyAddress, 'driving')
    } catch (error) {
      Alert.alert('Navigation Error', 'Unable to open navigation app.')
    }
  }

  const handleCompleteJob = () => {
    // Fixed: Remove type assertion that causes TypeScript error
    navigation.navigate('JobCompletion', { job })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#EF4444'
      case 'high':
        return '#F97316'
      case 'medium':
        return '#EAB308'
      case 'low':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#3B82F6'
      case 'in_progress':
        return '#8B5CF6'
      case 'completed':
        return '#10B981'
      default:
        return '#6B7280'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return (
      date.toLocaleDateString() +
      ' ' +
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }

  const formatPhoneNumber = (phone: string) => {
    // Simple phone number formatting
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const handleCallGuest = () => {
    if (job.guestPhone) {
      const phoneUrl = `tel:${job.guestPhone}`
      Linking.openURL(phoneUrl)
    }
  }

  const handleEmailGuest = () => {
    if (job.guestEmail) {
      const emailUrl = `mailto:${job.guestEmail}`
      Linking.openURL(emailUrl)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <View style={styles.headerContent}>
              <Title style={styles.jobTitle}>{job.title}</Title>
              <View style={styles.chipContainer}>
                <Chip
                  style={[
                    styles.priorityChip,
                    { backgroundColor: getPriorityColor(job.priority) },
                  ]}
                  textStyle={styles.chipText}
                >
                  {job.priority.toUpperCase()}
                </Chip>
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(job.status) },
                  ]}
                  textStyle={styles.chipText}
                >
                  {job.status.replace('_', ' ').toUpperCase()}
                </Chip>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Property Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Property Information</Title>
            <List.Item
              title={job.propertyName}
              description={job.propertyAddress || 'Address not available'}
              left={(props: any) => (
                <List.Icon {...props} icon="home" color="#3B82F6" />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            {job.propertyAddress && (
              <Button
                mode="outlined"
                onPress={handleNavigateToJob}
                style={styles.navigationButton}
                icon="navigation"
              >
                Navigate to Property
              </Button>
            )}
          </Card.Content>
        </Card>

        {/* Guest Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Guest Information</Title>
            <List.Item
              title={job.guestName}
              description={`${job.numberOfGuests} guest${job.numberOfGuests !== 1 ? 's' : ''}`}
              left={(props: any) => (
                <List.Icon {...props} icon="account" color="#3B82F6" />
              )}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />

            {job.guestPhone && (
              <List.Item
                title={formatPhoneNumber(job.guestPhone)}
                description="Phone number"
                left={(props: any) => (
                  <List.Icon {...props} icon="phone" color="#10B981" />
                )}
                right={(props: any) => (
                  <List.Icon {...props} icon="chevron-right" />
                )}
                onPress={handleCallGuest}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            )}

            {job.guestEmail && (
              <List.Item
                title={job.guestEmail}
                description="Email address"
                left={(props: any) => (
                  <List.Icon {...props} icon="email" color="#10B981" />
                )}
                right={(props: any) => (
                  <List.Icon {...props} icon="chevron-right" />
                )}
                onPress={handleEmailGuest}
                titleStyle={styles.listTitle}
                descriptionStyle={styles.listDescription}
              />
            )}
          </Card.Content>
        </Card>

        {/* Job Details */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Job Details</Title>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text style={styles.detailValue}>
                {job.jobType.replace('_', ' ')}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled:</Text>
              <Text style={styles.detailValue}>
                {formatDate(job.scheduledDate)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>
                {job.estimatedDuration} minutes
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Deadline:</Text>
              <Text style={styles.detailValue}>{formatDate(job.deadline)}</Text>
            </View>

            {job.description && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.detailLabel}>Description:</Text>
                <Paragraph style={styles.description}>
                  {job.description}
                </Paragraph>
              </>
            )}

            {job.specialInstructions && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.detailLabel}>Special Instructions:</Text>
                <Paragraph style={styles.specialInstructions}>
                  {job.specialInstructions}
                </Paragraph>
              </>
            )}

            {job.requiredSkills.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.detailLabel}>Required Skills:</Text>
                <View style={styles.skillsContainer}>
                  {job.requiredSkills.map((skill, index) => (
                    <Chip
                      key={index}
                      style={styles.skillChip}
                      textStyle={styles.skillText}
                    >
                      {skill}
                    </Chip>
                  ))}
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        {job.status === 'in_progress' && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                mode="contained"
                onPress={handleCompleteJob}
                style={styles.completeButton}
                icon="check"
              >
                Complete Job
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1F2937',
  },
  card: {
    margin: 16,
    marginTop: 8,
    backgroundColor: '#1F2937',
  },
  headerContent: {
    gap: 12,
  },
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  chipContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityChip: {
    height: 28,
  },
  statusChip: {
    height: 28,
  },
  chipText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  listTitle: {
    color: '#F9FAFB',
    fontSize: 16,
  },
  listDescription: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  navigationButton: {
    marginTop: 12,
    borderColor: '#3B82F6',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#F9FAFB',
    flex: 1,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: '#374151',
  },
  description: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 4,
    lineHeight: 20,
  },
  specialInstructions: {
    fontSize: 14,
    color: '#FEF3C7',
    marginTop: 4,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  skillChip: {
    backgroundColor: '#374151',
    height: 28,
  },
  skillText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 4,
  },
})
