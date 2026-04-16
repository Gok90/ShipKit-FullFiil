'use client'

import { Printer, Check, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { UploadedFile } from '@/lib/types'
import { useState } from 'react'

interface PrintLabelsStepProps {
  title: string
  stepNumber?: number
  files: UploadedFile[]
  onPrintToggle: (fileId: string, printed: boolean) => void
}

export function PrintLabelsStep({ title, stepNumber = 2, files, onPrintToggle }: PrintLabelsStepProps) {
  const [isOpen, setIsOpen] = useState(true)
  
  const printedCount = files.filter(f => f.printed).length
  const allPrinted = printedCount === files.length && files.length > 0
  
  const handlePrint = (file: UploadedFile) => {
    // Open PDF in new tab for printing
    // In a real implementation, we'd use the stored file data
    window.print()
    onPrintToggle(file.id, true)
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="flex items-center justify-between w-full">
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {stepNumber}
              </span>
              {title}
              <span className={cn(
                "text-sm font-normal ml-2",
                allPrinted ? "text-success" : "text-muted-foreground"
              )}>
                {allPrinted ? (
                  <span className="flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Printed {printedCount}/{files.length}
                  </span>
                ) : (
                  `Printed ${printedCount}/${files.length}`
                )}
              </span>
            </CardTitle>
            <ChevronDown className={cn(
              "w-5 h-5 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {files.map(file => (
                <div
                  key={file.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    "bg-secondary/50 hover:bg-secondary transition-colors"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">
                        {file.filename}
                      </p>
                      {file.labelCount && (
                        <p className="text-xs text-muted-foreground">
                          {file.labelCount} labels
                        </p>
                      )}
                      {file.packageCount && (
                        <p className="text-xs text-muted-foreground">
                          {file.packageCount} packages
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePrint(file)}
                      className="gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      Print
                    </Button>
                    
                    <button
                      onClick={() => onPrintToggle(file.id, !file.printed)}
                      className={cn(
                        "w-6 h-6 rounded border-2 flex items-center justify-center transition-colors",
                        file.printed 
                          ? "bg-success border-success text-success-foreground" 
                          : "border-border hover:border-primary"
                      )}
                    >
                      {file.printed && <Check className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
