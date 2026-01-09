#!/usr/bin/env node
import admin from 'firebase-admin'
import { readFileSync } from 'fs'

const serviceAccount = JSON.parse(readFileSync('./serviceAccountKey.json', 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

const snapshot = await db.collection('operational_jobs').get()
snapshot.docs.forEach(doc => {
  const data = doc.data()
  console.log('\n=== JOB:', doc.id, '===')
  console.log('jobType:', data.jobType)
  console.log('propertyName:', data.propertyName)
  console.log('propertyId:', data.propertyId)
  console.log('status:', data.status)
  console.log('scheduledStart:', data.scheduledStart?.toDate().toISOString())
  console.log('ALL FIELDS:', Object.keys(data).join(', '))
})

process.exit(0)
