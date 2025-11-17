'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  RefreshCw,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  Calendar,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { TokenExpiryBadge } from '@/components/admin/integrations/TokenExpiryBadge';

interface OAuthToken {
  id: string;
  integration_slug: string;
  integration_name: string;
  token_status: 'active' | 'expired' | 'revoked';
  expires_at: string | null;
  last_refreshed_at: string | null;
  refresh_count: number;
  created_at: string;
}

export default function OAuthManagementPage() {
  const [tokens, setTokens] = useState<OAuthToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshingTokenId, setRefreshingTokenId] = useState<string | null>(null);
  const [revokingTokenId, setRevokingTokenId] = useState<string | null>(null);
  const [tokenToRevoke, setTokenToRevoke] = useState<OAuthToken | null>(null);

  // Fetch OAuth tokens
  useEffect(() => {
    fetchTokens();
  }, []);

  const fetchTokens = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/admin/integrations/oauth');

      if (!response.ok) {
        throw new Error(`Failed to fetch OAuth tokens: ${response.statusText}`);
      }

      const data = await response.json();
      setTokens(data.tokens || []);
    } catch (err) {
      console.error('Error fetching OAuth tokens:', err);
      setError(err instanceof Error ? err.message : 'Failed to load OAuth tokens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshToken = async (tokenId: string) => {
    try {
      setRefreshingTokenId(tokenId);

      const response = await fetch(`/api/admin/integrations/oauth/${tokenId}/refresh`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refresh token');
      }

      // Refresh the token list
      await fetchTokens();

      // Show success (could add toast notification here)
      console.log('Token refreshed successfully');
    } catch (err) {
      console.error('Error refreshing token:', err);
      alert(err instanceof Error ? err.message : 'Failed to refresh token');
    } finally {
      setRefreshingTokenId(null);
    }
  };

  const handleRevokeToken = async () => {
    if (!tokenToRevoke) return;

    try {
      setRevokingTokenId(tokenToRevoke.id);

      const response = await fetch(
        `/api/admin/integrations/oauth/${tokenToRevoke.id}/revoke`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to revoke token');
      }

      // Refresh the token list
      await fetchTokens();

      // Show success
      console.log('Token revoked successfully');
    } catch (err) {
      console.error('Error revoking token:', err);
      alert(err instanceof Error ? err.message : 'Failed to revoke token');
    } finally {
      setRevokingTokenId(null);
      setTokenToRevoke(null);
    }
  };

  // Calculate token stats
  const stats = {
    total: tokens.length,
    active: tokens.filter((t) => t.token_status === 'active').length,
    expired: tokens.filter((t) => t.token_status === 'expired').length,
    revoked: tokens.filter((t) => t.token_status === 'revoked').length,
    expiringSoon: tokens.filter((t) => {
      if (!t.expires_at || t.token_status !== 'active') return false;
      const daysUntilExpiry = differenceInDays(new Date(t.expires_at), new Date());
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 7;
    }).length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-circleTel-orange mx-auto mb-4" />
          <p className="text-gray-600">Loading OAuth tokens...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Error Loading OAuth Tokens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchTokens} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OAuth Management</h1>
          <p className="text-gray-600 mt-1">
            Manage OAuth tokens for third-party integrations
          </p>
        </div>
        <Button onClick={fetchTokens} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <Key className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.active}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stats.expiringSoon}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-50">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.expired}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revoked</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">{stats.revoked}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50">
                <Trash2 className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OAuth Tokens Table */}
      <Card>
        <CardHeader>
          <CardTitle>OAuth Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No OAuth tokens found
              </h3>
              <p className="text-gray-600">
                No integrations with OAuth tokens have been configured yet
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last Refreshed</TableHead>
                    <TableHead>Refresh Count</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((token) => {
                    const isRefreshing = refreshingTokenId === token.id;
                    const isRevoking = revokingTokenId === token.id;

                    return (
                      <TableRow key={token.id}>
                        <TableCell className="font-medium">
                          {token.integration_name}
                        </TableCell>
                        <TableCell>
                          {token.token_status === 'active' && (
                            <Badge className="bg-green-100 text-green-700 border-0">
                              Active
                            </Badge>
                          )}
                          {token.token_status === 'expired' && (
                            <Badge className="bg-red-100 text-red-700 border-0">
                              Expired
                            </Badge>
                          )}
                          {token.token_status === 'revoked' && (
                            <Badge className="bg-gray-100 text-gray-700 border-0">
                              Revoked
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <TokenExpiryBadge expiresAt={token.expires_at} />
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {token.last_refreshed_at ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(token.last_refreshed_at), {
                                addSuffix: true,
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400">Never</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {token.refresh_count}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRefreshToken(token.id)}
                              disabled={
                                isRefreshing ||
                                token.token_status === 'revoked' ||
                                isRevoking
                              }
                            >
                              {isRefreshing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setTokenToRevoke(token)}
                              disabled={
                                token.token_status === 'revoked' ||
                                isRefreshing ||
                                isRevoking
                              }
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isRevoking ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={!!tokenToRevoke} onOpenChange={() => setTokenToRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke OAuth Token?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the OAuth token for{' '}
              <strong>{tokenToRevoke?.integration_name}</strong>? This action cannot be
              undone and the integration will stop working until a new token is
              obtained.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeToken}
              className="bg-red-600 hover:bg-red-700"
            >
              Revoke Token
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
