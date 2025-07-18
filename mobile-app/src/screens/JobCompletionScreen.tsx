import { useNavigation, useRoute } from '@react-navigation/native'
import * as ImagePicker from 'expo-image-picker'
import React, { useState } from 'react'
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  IconButton,
  Paragraph,
  Text,
  TextInput,
  Title,
} from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useJobs } from '../contexts/JobContext'
import { PhotoUploadService } from '../services/photoUploadService'
import { JobAssignment } from '../types/job'

export default function JobCompletionScreen() {
  const route = useRoute()
  const navigation = useNavigation()
  const job = (route.params as any)?.job as JobAssignment
  const { completeJob } = useJobs()

  const [completionNotes, setCompletionNotes] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [qualityRating, setQualityRating] = useState<number>(5)
  const [issuesReported, setIssuesReported] = useState<string[]>([])
  const [newIssue, setNewIssue] = useState('')

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Job not found</Text>
        </View>
      </SafeAreaView>
    )
  }

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to take photos for job completion.'
      )
      return false
    }
    return true
  }

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri
        setPhotos((prev) => [...prev, photoUri])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo')
    }
  }

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        const photoUri = result.assets[0].uri
        setPhotos((prev) => [...prev, photoUri])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select photo')
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const addIssue = () => {
    if (newIssue.trim()) {
      setIssuesReported((prev) => [...prev, newIssue.trim()])
      setNewIssue('')
    }
  }

  const removeIssue = (index: number) => {
    setIssuesReported((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCompleteJob = async () => {
    if (photos.length === 0) {
      Alert.alert(
        'Photos Required',
        'Please take at least one photo to verify job completion.',
        [{ text: 'OK' }]
      )
      return
    }

    if (!completionNotes.trim()) {
      Alert.alert(
        'Notes Required',
        'Please add completion notes describing the work performed.',
        [{ text: 'OK' }]
      )
      return
    }

    Alert.alert(
      'Complete Job',
      'Are you sure you want to mark this job as completed? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Complete', onPress: submitCompletion },
      ]
    )
  }

  const submitCompletion = async () => {
    try {
      setCompleting(true)
      setUploading(true)

      // Upload photos to Firebase Storage
      console.log('📸 Uploading', photos.length, 'photos...')
      const uploadResults =
        await PhotoUploadService.uploadMultipleJobCompletionPhotos(
          job.id,
          photos
        )

      const photoUrls = uploadResults.map((result) => result.url)
      console.log('📸 Photos uploaded successfully:', photoUrls)

      setUploading(false)

      // Complete the job
      await completeJob({
        jobId: job.id,
        completionNotes: completionNotes.trim(),
        completionPhotos: photoUrls,
        qualityRating,
        issuesReported: issuesReported.length > 0 ? issuesReported : undefined,
        completedAt: new Date().toISOString(),
      })

      Alert.alert(
        'Job Completed',
        'Job has been marked as completed successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      )
    } catch (error: any) {
      console.error('❌ Error completing job:', error)
      Alert.alert('Error', 'Failed to complete job: ' + error.message)
    } finally {
      setCompleting(false)
      setUploading(false)
    }
  }

  const renderStarRating = () => {
    return (
      <View style={styles.ratingContainer}>
        <Text style={styles.ratingLabel}>Quality Rating:</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              onPress={() => setQualityRating(star)}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.star,
                  { color: star <= qualityRating ? '#F59E0B' : '#6B7280' },
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Job Header */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Title style={styles.jobTitle}>{job.title}</Title>
            <Text style={styles.propertyName}>{job.propertyName}</Text>
          </Card.Content>
        </Card>

        {/* Photo Section */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Completion Photos</Title>
            <Paragraph style={styles.sectionDescription}>
              Take photos to verify job completion (required)
            </Paragraph>

            <View style={styles.photoActions}>
              <Button
                mode="outlined"
                onPress={takePhoto}
                style={styles.photoButton}
                icon="camera"
                disabled={uploading}
              >
                Take Photo
              </Button>
              <Button
                mode="outlined"
                onPress={selectFromGallery}
                style={styles.photoButton}
                icon="image"
                disabled={uploading}
              >
                Gallery
              </Button>
            </View>

            {photos.length > 0 && (
              <View style={styles.photosContainer}>
                {photos.map((photo, index) => (
                  <View key={index} style={styles.photoContainer}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <IconButton
                      icon="close"
                      size={20}
                      onPress={() => removePhoto(index)}
                      style={styles.removePhotoButton}
                      iconColor="#FFFFFF"
                    />
                  </View>
                ))}
              </View>
            )}

            {uploading && (
              <View style={styles.uploadingContainer}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.uploadingText}>Uploading photos...</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Completion Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Completion Notes</Title>
            <Paragraph style={styles.sectionDescription}>
              Describe the work performed (required)
            </Paragraph>
            <TextInput
              mode="outlined"
              multiline
              numberOfLines={4}
              value={completionNotes}
              onChangeText={setCompletionNotes}
              placeholder="Describe what was completed, any observations, or special notes..."
              style={styles.notesInput}
              disabled={completing}
            />
          </Card.Content>
        </Card>

        {/* Quality Rating */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Quality Rating</Title>
            <Paragraph style={styles.sectionDescription}>
              Rate the quality of your work
            </Paragraph>
            {renderStarRating()}
          </Card.Content>
        </Card>

        {/* Issues Reported */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Issues Reported</Title>
            <Paragraph style={styles.sectionDescription}>
              Report any issues found during the job (optional)
            </Paragraph>

            <View style={styles.issueInputContainer}>
              <TextInput
                mode="outlined"
                value={newIssue}
                onChangeText={setNewIssue}
                placeholder="Describe any issues found..."
                style={styles.issueInput}
                disabled={completing}
              />
              <Button
                mode="outlined"
                onPress={addIssue}
                disabled={!newIssue.trim() || completing}
                style={styles.addIssueButton}
              >
                Add
              </Button>
            </View>

            {issuesReported.length > 0 && (
              <View style={styles.issuesContainer}>
                {issuesReported.map((issue, index) => (
                  <Chip
                    key={index}
                    onClose={() => removeIssue(index)}
                    style={styles.issueChip}
                    textStyle={styles.issueChipText}
                  >
                    {issue}
                  </Chip>
                ))}
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Complete Button */}
        <Card style={styles.card}>
          <Card.Content>
            <Button
              mode="contained"
              onPress={handleCompleteJob}
              style={styles.completeButton}
              icon="check"
              loading={completing}
              disabled={
                completing ||
                uploading ||
                photos.length === 0 ||
                !completionNotes.trim()
              }
            >
              {completing ? 'Completing Job...' : 'Complete Job'}
            </Button>
          </Card.Content>
        </Card>
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
  jobTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  propertyName: {
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    borderColor: '#3B82F6',
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    margin: 0,
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  uploadingText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  notesInput: {
    backgroundColor: '#374151',
    minHeight: 100,
  },
  ratingContainer: {
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    padding: 4,
  },
  star: {
    fontSize: 32,
  },
  issueInputContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  issueInput: {
    flex: 1,
    backgroundColor: '#374151',
  },
  addIssueButton: {
    borderColor: '#10B981',
    alignSelf: 'flex-end',
  },
  issuesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  issueChip: {
    backgroundColor: '#FEF3C7',
  },
  issueChipText: {
    color: '#92400E',
  },
  completeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
  },
})
