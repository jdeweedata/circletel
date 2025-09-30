'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Map,
  MapPin,
  Upload,
  Download,
  Trash2,
  Eye,
  FileText,
  Layers,
  Settings,
  Search,
  Filter,
  RefreshCw,
  CheckCircle,
  X,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MapViewer } from '@/components/admin/coverage/MapViewer';

interface CoverageMap {
  id: string;
  name: string;
  provider: string;
  type: 'kml' | 'kmz' | 'geojson';
  uploadedAt: string;
  fileSize: string;
  coverage: {
    area: string;
    features: number;
  };
  status: 'active' | 'inactive';
  filePath?: string;
}

export default function CoverageMapsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [maps, setMaps] = useState<CoverageMap[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadForm, setUploadForm] = useState({
    provider: '',
    coverageArea: ''
  });
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [viewingMap, setViewingMap] = useState<CoverageMap | null>(null);

  const providers = ['MTN', 'Vodacom', 'Telkom', 'Rain', 'Cell C'];

  // Fetch maps from database on mount
  useEffect(() => {
    fetchMaps();
  }, []);

  const fetchMaps = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/coverage/maps');
      const result = await response.json();

      if (result.success) {
        setMaps(result.data.maps);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load coverage maps',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error fetching maps:', error);
      toast({
        title: 'Error',
        description: 'Failed to load coverage maps',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMaps = maps.filter(map => {
    const matchesSearch = map.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         map.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProvider = selectedProvider === 'all' || map.provider === selectedProvider;
    return matchesSearch && matchesProvider;
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const ext = file.name.toLowerCase();
      if (!ext.endsWith('.kml') && !ext.endsWith('.kmz') && !ext.endsWith('.geojson')) {
        toast({
          title: 'Invalid File Type',
          description: 'Please select a KML, KMZ, or GeoJSON file',
          variant: 'destructive'
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'File Too Large',
          description: 'File size must be less than 10MB',
          variant: 'destructive'
        });
        return;
      }

      setSelectedFile(file);
      setShowUploadDialog(true);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.provider) {
      toast({
        title: 'Missing Information',
        description: 'Please select a file and provider',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('provider', uploadForm.provider);
      formData.append('coverageArea', uploadForm.coverageArea);

      const response = await fetch('/api/admin/coverage/maps', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: 'Upload Successful',
          description: `${selectedFile.name} has been uploaded successfully`
        });

        // Refresh the maps list from database
        await fetchMaps();

        // Reset form
        setShowUploadDialog(false);
        setSelectedFile(null);
        setUploadForm({ provider: '', coverageArea: '' });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        toast({
          title: 'Upload Failed',
          description: result.error || 'Failed to upload file',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Error',
        description: 'An error occurred while uploading the file',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadDialog(false);
    setSelectedFile(null);
    setUploadForm({ provider: '', coverageArea: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleViewMap = (map: CoverageMap) => {
    setViewingMap(map);
    setShowViewDialog(true);
  };

  const handleCloseView = () => {
    setShowViewDialog(false);
    setViewingMap(null);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Coverage Maps</h1>
          <p className="text-gray-600 mt-2">
            Manage and visualize network coverage map files
          </p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,.kmz,.geojson"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="bg-circleTel-orange hover:bg-circleTel-orange/90"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Map
          </Button>
        </div>
      </div>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <Card className="border-circleTel-orange">
          <CardHeader className="bg-circleTel-orange/5">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Upload Coverage Map</CardTitle>
                <CardDescription>
                  Provide details for the map file
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelUpload}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            {/* File Info */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-circleTel-orange" />
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{selectedFile?.name}</p>
                  <p className="text-sm text-gray-600">
                    {selectedFile && `${(selectedFile.size / 1024).toFixed(1)} KB`}
                  </p>
                </div>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider">Provider *</Label>
              <select
                id="provider"
                value={uploadForm.provider}
                onChange={(e) => setUploadForm({ ...uploadForm, provider: e.target.value })}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
                disabled={uploading}
              >
                <option value="">Select provider...</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>

            {/* Coverage Area */}
            <div className="space-y-2">
              <Label htmlFor="coverageArea">Coverage Area (Optional)</Label>
              <Input
                id="coverageArea"
                placeholder="e.g., Western Cape, Gauteng, National"
                value={uploadForm.coverageArea}
                onChange={(e) => setUploadForm({ ...uploadForm, coverageArea: e.target.value })}
                disabled={uploading}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelUpload}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading || !uploadForm.provider}
                className="bg-circleTel-orange hover:bg-circleTel-orange/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Map Dialog */}
      {showViewDialog && viewingMap && (
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{viewingMap.name}</CardTitle>
                <CardDescription>
                  Coverage map details and information
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseView}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Map Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Provider</Label>
                <p className="font-medium">{viewingMap.provider}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">File Type</Label>
                <Badge variant="outline">{viewingMap.type.toUpperCase()}</Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Coverage Area</Label>
                <p className="font-medium">{viewingMap.coverage.area}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Status</Label>
                <Badge variant={viewingMap.status === 'active' ? 'default' : 'secondary'}>
                  {viewingMap.status}
                </Badge>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Total Features</Label>
                <p className="font-medium">{viewingMap.coverage.features.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">File Size</Label>
                <p className="font-medium">{viewingMap.fileSize}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Uploaded Date</Label>
                <p className="font-medium">{viewingMap.uploadedAt}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-sm text-gray-600">Map ID</Label>
                <p className="font-medium font-mono text-sm">{viewingMap.id}</p>
              </div>
            </div>

            {/* Map Preview with Google Maps */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Map Preview</h3>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-xs">
                    <MapPin className="h-3 w-3 mr-1" />
                    {viewingMap.coverage.features} polygons
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Layers className="h-3 w-3 mr-1" />
                    {viewingMap.type.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <MapViewer
                mapId={viewingMap.id}
                mapName={viewingMap.name}
                provider={viewingMap.provider}
                type={viewingMap.type}
                filePath={viewingMap.filePath}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="outline" onClick={handleCloseView}>
                Close
              </Button>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maps</CardTitle>
            <Map className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maps.length}</div>
            <p className="text-xs text-muted-foreground">
              Across all providers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Features</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maps.reduce((sum, map) => sum + map.coverage.features, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Coverage polygons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Maps</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {maps.filter(m => m.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7.3 MB</div>
            <p className="text-xs text-muted-foreground">
              Map files
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search maps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-64">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circleTel-orange"
              >
                <option value="all">All Providers</option>
                {providers.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Maps List */}
      <Card>
        <CardHeader>
          <CardTitle>Coverage Map Files</CardTitle>
          <CardDescription>
            Manage KML, KMZ, and GeoJSON coverage files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMaps.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No maps found matching your search criteria.
                </AlertDescription>
              </Alert>
            ) : (
              filteredMaps.map((map) => (
                <div
                  key={map.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="h-12 w-12 bg-circleTel-orange/10 rounded-lg flex items-center justify-center">
                      <Map className="h-6 w-6 text-circleTel-orange" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{map.name}</h3>
                        <Badge variant={map.status === 'active' ? 'default' : 'secondary'}>
                          {map.status}
                        </Badge>
                        <Badge variant="outline">{map.type.toUpperCase()}</Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {map.provider}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {map.coverage.features.toLocaleString()} features
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {map.fileSize}
                        </span>
                        <span>Uploaded {map.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewMap(map)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
          <CardDescription>
            Best practices for uploading coverage map files
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-circleTel-orange">1</span>
              </div>
              <div>
                <strong>Supported Formats:</strong> KML (.kml), KMZ (.kmz), GeoJSON (.geojson)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-circleTel-orange">2</span>
              </div>
              <div>
                <strong>File Size Limit:</strong> Maximum 10 MB per file
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-circleTel-orange">3</span>
              </div>
              <div>
                <strong>Coordinate System:</strong> WGS84 (EPSG:4326) required
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-circleTel-orange/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-circleTel-orange">4</span>
              </div>
              <div>
                <strong>Naming Convention:</strong> Use descriptive names including provider and coverage type
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}