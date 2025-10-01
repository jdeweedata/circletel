'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Upload, CheckCircle, XCircle } from 'lucide-react'

export default function ImportPage() {
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleImportAfriHost = async () => {
    setIsImporting(true)
    setImportStatus('idle')
    setMessage('')

    try {
      const response = await fetch('/api/strapi/import/afrihost-devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Import failed: ${response.statusText}`)
      }

      const result = await response.json()
      setImportStatus('success')
      setMessage(`Successfully imported ${result.count} devices from Afrihost`)
    } catch (error) {
      setImportStatus('error')
      setMessage(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Content Import</h1>
        <p className="text-muted-foreground">Import content and images from external sources</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Afrihost Wireless Devices
          </CardTitle>
          <CardDescription>
            Import wireless router devices and images from Afrihost&apos;s devices page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            This will:
            <ul className="list-disc ml-6 mt-2">
              <li>Download device images from Afrihost</li>
              <li>Upload images to Strapi media library</li>
              <li>Create product entries with device specifications</li>
              <li>Link images to products</li>
            </ul>
          </div>

          <Button
            onClick={handleImportAfriHost}
            disabled={isImporting}
            className="w-full"
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Afrihost Devices
              </>
            )}
          </Button>

          {importStatus !== 'idle' && (
            <Alert variant={importStatus === 'success' ? 'default' : 'destructive'}>
              {importStatus === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}