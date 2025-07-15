'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { StaffProfile } from '@/types/staff'
import StaffService from '@/lib/staffService'
import toast from 'react-hot-toast'

interface StaffImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  staffList: StaffProfile[]
}

interface ImportResult {
  success: boolean
  imported: number
  errors: string[]
  duplicates: number
}

export default function StaffImportExportModal({ isOpen, onClose, onSuccess, staffList }: StaffImportExportModalProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('export')
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      // Prepare data for export
      const exportData = staffList.map(staff => ({
        name: staff.name,
        email: staff.email,
        phone: staff.phone || '',
        address: staff.address || '',
        role: staff.role,
        status: staff.status,
        assignedProperties: staff.assignedProperties?.join(';') || '',
        skills: staff.skills?.join(';') || '',
        emergencyContactName: staff.emergencyContact?.name || '',
        emergencyContactPhone: staff.emergencyContact?.phone || '',
        emergencyContactRelationship: staff.emergencyContact?.relationship || '',
        employmentType: staff.employment?.employmentType || '',
        hourlyRate: staff.employment?.hourlyRate || '',
        salary: staff.employment?.salary || '',
        startDate: staff.employment?.startDate || '',
        dateOfBirth: staff.personalDetails?.dateOfBirth || '',
        nationalId: staff.personalDetails?.nationalId || ''
      }))

      // Convert to CSV
      const headers = [
        'Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 
        'Assigned Properties', 'Skills', 'Emergency Contact Name', 
        'Emergency Contact Phone', 'Emergency Contact Relationship',
        'Employment Type', 'Hourly Rate', 'Salary', 'Start Date',
        'Date of Birth', 'National ID'
      ]

      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          Object.values(row).map(value => 
            typeof value === 'string' && value.includes(',') 
              ? `"${value}"` 
              : value
          ).join(',')
        )
      ].join('\n')

      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `staff_export_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success(`Exported ${staffList.length} staff members successfully!`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export staff data')
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file')
      return
    }

    setLoading(true)
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast.error('CSV file must contain headers and at least one data row')
        return
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      const dataLines = lines.slice(1)

      let imported = 0
      let duplicates = 0
      const errors: string[] = []

      for (let i = 0; i < dataLines.length; i++) {
        try {
          const values = dataLines[i].split(',').map(v => v.trim().replace(/"/g, ''))
          const rowData: any = {}
          
          headers.forEach((header, index) => {
            rowData[header.toLowerCase().replace(/\s+/g, '')] = values[index] || ''
          })

          // Check for duplicates
          const existingStaff = staffList.find(s => s.email === rowData.email)
          if (existingStaff) {
            duplicates++
            continue
          }

          // Validate required fields
          if (!rowData.name || !rowData.email) {
            errors.push(`Row ${i + 2}: Name and email are required`)
            continue
          }

          // Create staff data
          const staffData = {
            name: rowData.name,
            email: rowData.email,
            phone: rowData.phone,
            address: rowData.address,
            role: rowData.role || 'housekeeper',
            status: rowData.status || 'active',
            assignedProperties: rowData.assignedproperties ? rowData.assignedproperties.split(';') : [],
            skills: rowData.skills ? rowData.skills.split(';') : [],
            emergencyContact: {
              name: rowData.emergencycontactname || '',
              phone: rowData.emergencycontactphone || '',
              relationship: rowData.emergencycontactrelationship || ''
            },
            employment: {
              employmentType: rowData.employmenttype || 'full-time',
              hourlyRate: rowData.hourlyrate ? parseFloat(rowData.hourlyrate) : undefined,
              salary: rowData.salary ? parseFloat(rowData.salary) : undefined,
              startDate: rowData.startdate || new Date().toISOString().split('T')[0]
            },
            personalDetails: {
              dateOfBirth: rowData.dateofbirth || '',
              nationalId: rowData.nationalid || ''
            }
          }

          const response = await StaffService.createStaff(staffData)
          if (response.success) {
            imported++
          } else {
            errors.push(`Row ${i + 2}: ${response.error}`)
          }
        } catch (error) {
          errors.push(`Row ${i + 2}: Invalid data format`)
        }
      }

      const result: ImportResult = {
        success: imported > 0,
        imported,
        duplicates,
        errors: errors.slice(0, 10) // Limit to first 10 errors
      }

      setImportResult(result)

      if (imported > 0) {
        toast.success(`Successfully imported ${imported} staff members!`)
        onSuccess()
      } else {
        toast.error('No staff members were imported')
      }

    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import staff data')
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const downloadTemplate = () => {
    const templateHeaders = [
      'Name', 'Email', 'Phone', 'Address', 'Role', 'Status', 
      'Assigned Properties', 'Skills', 'Emergency Contact Name', 
      'Emergency Contact Phone', 'Emergency Contact Relationship',
      'Employment Type', 'Hourly Rate', 'Salary', 'Start Date',
      'Date of Birth', 'National ID'
    ]

    const sampleData = [
      'John Doe', 'john.doe@example.com', '+1-555-0123', '123 Main St', 
      'housekeeper', 'active', 'villa-001;villa-002', 'Cleaning;Laundry',
      'Jane Doe', '+1-555-0124', 'Spouse', 'full-time', '25', '', 
      '2024-01-15', '1985-06-15', 'ID123456'
    ]

    const csvContent = [
      templateHeaders.join(','),
      sampleData.join(',')
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'staff_import_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.success('Template downloaded successfully!')
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-neutral-900 border border-neutral-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Staff Import/Export</h2>
                <p className="text-sm text-neutral-400">Manage staff data in bulk</p>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-neutral-400 hover:text-white"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-neutral-800">
            <button
              onClick={() => setActiveTab('export')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'export'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Export Staff
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'import'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Import Staff
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'export' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <Download className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Export Staff Data</h3>
                  <p className="text-neutral-400 mb-6">
                    Download all staff information as a CSV file for backup or external use.
                  </p>
                  
                  <div className="bg-neutral-800 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Total Staff Members</p>
                        <p className="text-neutral-400 text-sm">Ready for export</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        {staffList.length} records
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={handleExport}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={staffList.length === 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export to CSV
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <Upload className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Import Staff Data</h3>
                  <p className="text-neutral-400 mb-6">
                    Upload a CSV file to add multiple staff members at once.
                  </p>
                </div>

                {/* Template Download */}
                <div className="bg-neutral-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Need a template?</p>
                      <p className="text-neutral-400 text-sm">Download our CSV template with sample data</p>
                    </div>
                    <Button
                      onClick={downloadTemplate}
                      variant="outline"
                      size="sm"
                      className="border-neutral-700 text-neutral-300 hover:bg-neutral-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Template
                    </Button>
                  </div>
                </div>

                {/* File Upload */}
                <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleImport}
                    className="hidden"
                    disabled={loading}
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Select CSV File
                      </>
                    )}
                  </Button>
                  <p className="text-neutral-400 text-sm mt-2">
                    Only CSV files are supported
                  </p>
                </div>

                {/* Import Results */}
                {importResult && (
                  <div className="bg-neutral-800 rounded-lg p-4">
                    <h4 className="text-white font-medium mb-3">Import Results</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Successfully imported: {importResult.imported}</span>
                      </div>
                      {importResult.duplicates > 0 && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400">Duplicates skipped: {importResult.duplicates}</span>
                        </div>
                      )}
                      {importResult.errors.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400">Errors: {importResult.errors.length}</span>
                          </div>
                          <div className="bg-neutral-900 rounded p-2 max-h-32 overflow-y-auto">
                            {importResult.errors.map((error, index) => (
                              <p key={index} className="text-red-400 text-xs">{error}</p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
