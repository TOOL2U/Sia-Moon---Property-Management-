import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface PhotoUploadResult {
  url: string;
  path: string;
  size: number;
}

export class PhotoUploadService {
  /**
   * Upload a photo to Firebase Storage
   */
  static async uploadJobCompletionPhoto(
    jobId: string,
    photoUri: string,
    fileName?: string
  ): Promise<PhotoUploadResult> {
    try {
      console.log('📸 Uploading job completion photo for job:', jobId);
      
      // Generate unique filename if not provided
      const timestamp = Date.now();
      const finalFileName = fileName || `completion_${timestamp}.jpg`;
      
      // Create storage reference
      const storagePath = `job-completions/${jobId}/${finalFileName}`;
      const storageRef = ref(storage, storagePath);
      
      // Convert URI to blob for upload
      const response = await fetch(photoUri);
      const blob = await response.blob();
      
      console.log('📸 Uploading blob of size:', blob.size, 'bytes');
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('📸 Upload successful, snapshot size:', snapshot.metadata.size);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📸 Download URL generated:', downloadURL);
      
      return {
        url: downloadURL,
        path: storagePath,
        size: snapshot.metadata.size || blob.size
      };
      
    } catch (error) {
      console.error('❌ Error uploading photo:', error);
      throw new Error('Failed to upload photo: ' + (error as Error).message);
    }
  }

  /**
   * Upload multiple photos for job completion
   */
  static async uploadMultipleJobCompletionPhotos(
    jobId: string,
    photoUris: string[]
  ): Promise<PhotoUploadResult[]> {
    try {
      console.log('📸 Uploading', photoUris.length, 'photos for job:', jobId);
      
      const uploadPromises = photoUris.map((uri, index) => {
        const fileName = `completion_${Date.now()}_${index + 1}.jpg`;
        return this.uploadJobCompletionPhoto(jobId, uri, fileName);
      });
      
      const results = await Promise.all(uploadPromises);
      console.log('📸 All photos uploaded successfully');
      
      return results;
      
    } catch (error) {
      console.error('❌ Error uploading multiple photos:', error);
      throw new Error('Failed to upload photos: ' + (error as Error).message);
    }
  }

  /**
   * Validate photo before upload
   */
  static validatePhoto(photoUri: string): { valid: boolean; error?: string } {
    if (!photoUri) {
      return { valid: false, error: 'Photo URI is required' };
    }

    // Check if it's a valid URI format
    if (!photoUri.startsWith('file://') && !photoUri.startsWith('content://')) {
      return { valid: false, error: 'Invalid photo URI format' };
    }

    return { valid: true };
  }

  /**
   * Get estimated upload time based on file size
   */
  static getEstimatedUploadTime(fileSizeBytes: number): number {
    // Rough estimation: 1MB per 10 seconds on average mobile connection
    const mbSize = fileSizeBytes / (1024 * 1024);
    return Math.ceil(mbSize * 10);
  }
}
