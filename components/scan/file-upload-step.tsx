'use client'

import { useCallback, useState } from 'react'
import { Upload, FileText, X, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UploadedFile, ManifestZone, SlaStatus } from '@/lib/types'

interface FileUploadStepProps {
  uploadedFiles: UploadedFile[]
  manifestZones: ManifestZone[]
  onFilesUploaded: (files: File[]) => void
  oldestOrderDate: Date | null
  batchStartTime: Date | null
}

export function FileUploadStep({ 
  uploadedFiles, 
  manifestZones,
  onFilesUploaded,
  oldestOrderDate,
  batchStartTime
}: FileUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false)
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFilesUploaded(files)
    }
  }, [onFilesUploaded])
  
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) {
      onFilesUploaded(files)
    }
    e.target.value = ''
  }, [onFilesUploaded])
  
  const getSlaStatus = (): SlaStatus => {
    if (!oldestOrderDate) return 'safe'
    
    const now = new Date()
    const hoursSinceOrder = (now.getTime() - oldestOrderDate.getTime()) / (1000 * 60 * 60)
    
    // TikTok 2-business-day SLA (roughly 48 hours)
    if (hoursSinceOrder > 48) return 'overdue'
    if (hoursSinceOrder > 36) return 'ship_today'
    return 'safe'
  }
  
  const slaStatus = getSlaStatus()
  const hasFiles = uploadedFiles.length > 0
  
  // Calculate batch age
  const getBatchAge = () => {
    if (!batchStartTime) return null
    const hours = (Date.now() - batchStartTime.getTime()) / (1000 * 60 * 60)
    return {
      hours: Math.floor(hours),
      status: hours > 8 ? 'red' : hours > 4 ? 'yellow' : 'green'
    }
  }
  
  const batchAge = getBatchAge()
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              1
            </span>
            Upload Files
          </CardTitle>
          {batchAge && (
            <div className={cn(
              "flex items-center gap-1 text-sm",
              batchAge.status === 'red' && "text-destructive",
              batchAge.status === 'yellow' && "text-warning",
              batchAge.status === 'green' && "text-muted-foreground"
            )}>
              <Clock className="w-4 h-4" />
              {batchAge.hours}h since upload
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasFiles ? (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            )}
          >
            <input
              type="file"
              multiple
              accept=".pdf,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 rounded-full bg-primary/10">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-lg">Drop all files here</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Labels PDF, Manifest CSV, USPS Scan Form - we auto-detect the type
                  </p>
                </div>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            {/* File Pills */}
            <div className="flex flex-wrap gap-2">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg",
                    "bg-secondary text-secondary-foreground"
                  )}
                >
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[150px]">
                    {file.filename}
                  </span>
                  {file.fileType === 'label_pdf' && file.labelCount && (
                    <Badge variant="outline" className="text-xs">
                      {file.labelCount} labels
                    </Badge>
                  )}
                  {file.fileType === 'manifest_csv' && (
                    <>
                      {(() => {
                        const zone = manifestZones.find(z => z.csvFilename === file.filename)
                        return (
                          <>
                            <Badge variant="secondary" className="text-xs font-medium">
                              {zone?.zoneName || 'Manifest'}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {zone?.totalOrders || file.orderCount || 0} orders
                            </Badge>
                          </>
                        )
                      })()}
                      <SlaBadge status={slaStatus} />
                    </>
                  )}
                  {file.fileType === 'usps_slip' && (
                    <Badge variant="outline" className="text-xs">
                      {file.packageCount || 1} pkg
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            
            {/* Add more files button */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="file"
                multiple
                accept=".pdf,.csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload-more"
              />
              <label htmlFor="file-upload-more">
                <Button variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Add More Files
                  </span>
                </Button>
              </label>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function SlaBadge({ status }: { status: SlaStatus }) {
  if (status === 'safe') {
    return (
      <Badge className="bg-success text-success-foreground text-xs">
        SLA Safe
      </Badge>
    )
  }
  
  if (status === 'ship_today') {
    return (
      <Badge className="bg-warning text-warning-foreground text-xs">
        Ship Today
      </Badge>
    )
  }
  
  return (
    <Badge variant="destructive" className="text-xs flex items-center gap-1">
      <AlertTriangle className="w-3 h-3" />
      Overdue
    </Badge>
  )
}
