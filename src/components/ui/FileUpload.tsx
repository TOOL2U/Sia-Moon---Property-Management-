import { InputHTMLAttributes, forwardRef, useState } from 'react'
import { cn } from '@/utils/cn'
import { Upload, File, X } from 'lucide-react'

interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
  error?: string
  helperText?: string
  onFileSelect?: (files: FileList | null) => void
  maxFiles?: number
  acceptedTypes?: string[]
}

const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  ({ 
    className, 
    label, 
    error, 
    helperText, 
    onFileSelect, 
    maxFiles = 5,
    acceptedTypes = ['image/*', '.pdf', '.doc', '.docx'],
    ...props 
  }, ref) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [dragActive, setDragActive] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files) {
        const fileArray = Array.from(files).slice(0, maxFiles)
        setSelectedFiles(fileArray)
        onFileSelect?.(files)
      }
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true)
      } else if (e.type === 'dragleave') {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const files = e.dataTransfer.files
        const fileArray = Array.from(files).slice(0, maxFiles)
        setSelectedFiles(fileArray)
        onFileSelect?.(files)
      }
    }

    const removeFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index)
      setSelectedFiles(newFiles)
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-white mb-2">
            {label}
            {props.required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}

        <div
          className={cn(
            'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
            dragActive
              ? 'border-primary-500 bg-primary-950/20 scale-[1.02]'
              : 'border-neutral-700',
            error && 'border-red-500',
            'hover:border-neutral-600 cursor-pointer',
            'hover:bg-neutral-800/50',
            className
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={handleFileChange}
            accept={acceptedTypes.join(',')}
            multiple={maxFiles > 1}
            ref={ref}
            {...props}
          />

          <div className="text-center">
            <Upload className={cn(
              "mx-auto h-10 w-10 transition-colors duration-200",
              dragActive
                ? "text-primary-500"
                : "text-neutral-500"
            )} />
            <div className="mt-4">
              <p className="text-sm font-medium text-white">
                Drop files here or click to upload
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                {acceptedTypes.includes('image/*') ? 'Images, ' : ''}
                PDF, DOC files up to 10MB each
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Maximum {maxFiles} file{maxFiles > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 animate-slide-in-bottom">
            <p className="text-sm font-medium text-neutral-300">Selected Files:</p>
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg transition-all duration-200 hover:bg-neutral-700">
                <div className="flex items-center space-x-3">
                  <File className="h-4 w-4 text-neutral-400" />
                  <div>
                    <p className="text-sm font-medium text-white truncate max-w-48">
                      {file.name}
                    </p>
                    <p className="text-xs text-neutral-400">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-neutral-600 rounded-full transition-colors duration-150"
                >
                  <X className="h-4 w-4 text-neutral-400" />
                </button>
              </div>
            ))}
          </div>
        )}

        {helperText && !error && (
          <p className="text-xs text-neutral-400">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        )}
      </div>
    )
  }
)

FileUpload.displayName = 'FileUpload'

export { FileUpload }
