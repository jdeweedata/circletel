'use client'
import { PiArrowRightBold, PiArrowSquareOutBold, PiArrowsClockwiseBold, PiCalendarBold, PiCaretDownBold, PiCaretUpBold, PiCheckBold, PiDotsThreeBold, PiEyeBold, PiEyeSlashBold, PiMagnifyingGlassBold, PiMegaphoneBold, PiPencilSimpleBold, PiPlusBold, PiSparkleBold, PiSpinnerBold, PiTrashBold, PiXBold } from 'react-icons/pi';

/**
 * Marketing Announcements Admin Page
 *
 * Admin dashboard for managing the announcement bar.
 * Features:
 * - Create/edit announcements with live preview
 * - Color pickers for background/text
 * - Date range scheduling
 * - Priority ordering
 * - Quick toggle active/inactive
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface Announcement {
  id: string
  message: string
  link_text: string | null
  link_url: string | null
  bg_color: string
  text_color: string
  is_active: boolean
  priority: number
  valid_from: string | null
  valid_until: string | null
  created_at: string
  updated_at: string
}

// Status badge
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded-full',
        isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// Live preview component
function AnnouncementPreview({
  message,
  linkText,
  linkUrl,
  bgColor,
  textColor
}: {
  message: string
  linkText?: string
  linkUrl?: string
  bgColor: string
  textColor: string
}) {
  return (
    <div
      className="w-full py-2.5 px-4 flex items-center justify-center gap-3 text-sm font-medium rounded-lg"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      <PiSparkleBold className="w-4 h-4 flex-shrink-0" />
      <div className="flex items-center gap-2 text-center flex-wrap justify-center">
        <span className="text-xs sm:text-sm">{message || 'Your announcement message here...'}</span>
        {linkText && (
          <span className="inline-flex items-center gap-1 font-semibold">
            {linkText}
            <PiArrowRightBold className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
      <button className="p-1 rounded-full opacity-70" style={{ color: textColor }}>
        <PiXBold className="w-4 h-4" />
      </button>
    </div>
  )
}

// Create/Edit Modal
function AnnouncementModal({
  announcement,
  onClose,
  onSave
}: {
  announcement: Announcement | null
  onClose: () => void
  onSave: (data: Partial<Announcement>) => Promise<void>
}) {
  const [formData, setFormData] = useState({
    message: announcement?.message || '',
    link_text: announcement?.link_text || '',
    link_url: announcement?.link_url || '',
    bg_color: announcement?.bg_color || '#F5841E',
    text_color: announcement?.text_color || '#FFFFFF',
    is_active: announcement?.is_active || false,
    priority: announcement?.priority || 0,
    valid_from: announcement?.valid_from?.slice(0, 16) || '',
    valid_until: announcement?.valid_until?.slice(0, 16) || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave({
        ...formData,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null
      })
      onClose()
    } catch (error) {
      console.error('Failed to save:', error)
      alert('Failed to save announcement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {announcement ? 'Edit Announcement' : 'Create Announcement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <PiXBold className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-50 border-b">
          <p className="text-xs text-gray-500 mb-2 font-medium">LIVE PREVIEW</p>
          <AnnouncementPreview
            message={formData.message}
            linkText={formData.link_text}
            linkUrl={formData.link_url}
            bgColor={formData.bg_color}
            textColor={formData.text_color}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
              rows={2}
              required
              placeholder="e.g., Free router worth R1,500 with any Fibre package!"
            />
          </div>

          {/* Link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link Text
              </label>
              <input
                type="text"
                value={formData.link_text}
                onChange={(e) => setFormData({ ...formData, link_text: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
                placeholder="e.g., Shop Now"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link URL
              </label>
              <input
                type="text"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
                placeholder="e.g., /packages/fibre"
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.bg_color}
                  onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.bg_color}
                  onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.text_color}
                  onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                  className="w-10 h-10 rounded border cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.text_color}
                  onChange={(e) => setFormData({ ...formData, text_color: e.target.value })}
                  className="flex-1 px-3 py-2 border rounded-lg font-mono text-sm"
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid From (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valid Until (optional)
              </label>
              <input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
              />
            </div>
          </div>

          {/* Priority & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority (higher = shown first)
              </label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded text-[#F5841E] focus:ring-[#F5841E]"
                />
                <span className="text-sm">Active (visible on site)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.message}
              className="px-4 py-2 bg-[#F5841E] text-white rounded-lg hover:bg-[#E5741E] disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <PiSpinnerBold className="w-4 h-4 animate-spin" />}
              {announcement ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/marketing/announcements')
      if (!response.ok) throw new Error('Failed to fetch announcements')

      const data = await response.json()
      setAnnouncements(data.announcements || [])
    } catch (err) {
      console.error('Failed to fetch announcements:', err)
      setError('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  const handleSave = async (data: Partial<Announcement>) => {
    const method = editingAnnouncement ? 'PUT' : 'POST'
    const url = editingAnnouncement
      ? `/api/admin/marketing/announcements/${editingAnnouncement.id}`
      : '/api/admin/marketing/announcements'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) throw new Error('Failed to save announcement')

    fetchAnnouncements()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return

    try {
      const response = await fetch(`/api/admin/marketing/announcements/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete')

      setAnnouncements((prev) => prev.filter((a) => a.id !== id))
    } catch (err) {
      console.error('Failed to delete:', err)
      alert('Failed to delete announcement')
    }
  }

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const response = await fetch(`/api/admin/marketing/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !announcement.is_active })
      })

      if (!response.ok) throw new Error('Failed to update')

      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === announcement.id ? { ...a, is_active: !a.is_active } : a
        )
      )
    } catch (err) {
      console.error('Failed to toggle:', err)
      alert('Failed to update announcement')
    }
  }

  const openCreateModal = () => {
    setEditingAnnouncement(null)
    setModalOpen(true)
  }

  const openEditModal = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setModalOpen(true)
  }

  // Filter by search
  const filteredAnnouncements = announcements.filter((a) =>
    a.message.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const activeCount = announcements.filter((a) => a.is_active).length
  const scheduledCount = announcements.filter(
    (a) => a.valid_from && new Date(a.valid_from) > new Date()
  ).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <PiMegaphoneBold className="w-6 h-6 text-[#F5841E]" />
            Announcements
          </h1>
          <p className="text-gray-500 mt-1">
            Manage the announcement bar shown on the homepage
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2"
          >
            <PiArrowSquareOutBold className="w-4 h-4" />
            View Site
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-[#F5841E] text-white rounded-lg hover:bg-[#E5741E] flex items-center gap-2"
          >
            <PiPlusBold className="w-4 h-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{announcements.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <p className="text-sm text-gray-500">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <PiMagnifyingGlassBold className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#F5841E] focus:border-transparent"
          />
        </div>
        <button
          onClick={fetchAnnouncements}
          className="p-2 hover:bg-gray-100 rounded-lg"
          title="Refresh"
        >
          <PiArrowsClockwiseBold className={cn('w-5 h-5', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Current Active Preview */}
      {!loading && activeCount > 0 && (
        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2 font-medium">CURRENTLY SHOWING</p>
          {announcements
            .filter((a) => a.is_active)
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 1)
            .map((a) => (
              <AnnouncementPreview
                key={a.id}
                message={a.message}
                linkText={a.link_text || undefined}
                linkUrl={a.link_url || undefined}
                bgColor={a.bg_color}
                textColor={a.text_color}
              />
            ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-12">
          <PiSpinnerBold className="w-8 h-8 text-[#F5841E] animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center text-red-600 py-8">{error}</div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredAnnouncements.length === 0 && (
        <div className="text-center py-12">
          <PiMegaphoneBold className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No announcements yet</p>
          <button
            onClick={openCreateModal}
            className="mt-4 px-4 py-2 bg-[#F5841E] text-white rounded-lg hover:bg-[#E5741E]"
          >
            Create Your First Announcement
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && filteredAnnouncements.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Message
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dates
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAnnouncements
                .sort((a, b) => b.priority - a.priority)
                .map((announcement) => (
                  <tr key={announcement.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{announcement.priority}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: announcement.bg_color }}
                        />
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">
                            {announcement.message}
                          </p>
                          {announcement.link_text && (
                            <p className="text-xs text-gray-500">
                              CTA: {announcement.link_text}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={announcement.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500">
                        {announcement.valid_from && (
                          <p>From: {new Date(announcement.valid_from).toLocaleDateString()}</p>
                        )}
                        {announcement.valid_until && (
                          <p>Until: {new Date(announcement.valid_until).toLocaleDateString()}</p>
                        )}
                        {!announcement.valid_from && !announcement.valid_until && (
                          <p className="text-gray-400">Always</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggleActive(announcement)}
                          className={cn(
                            'p-2 rounded-lg',
                            announcement.is_active
                              ? 'text-green-600 hover:bg-green-50'
                              : 'text-gray-400 hover:bg-gray-100'
                          )}
                          title={announcement.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {announcement.is_active ? (
                            <PiEyeBold className="w-4 h-4" />
                          ) : (
                            <PiEyeSlashBold className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(announcement)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <PiPencilSimpleBold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(announcement.id)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <PiTrashBold className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <AnnouncementModal
          announcement={editingAnnouncement}
          onClose={() => {
            setModalOpen(false)
            setEditingAnnouncement(null)
          }}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
