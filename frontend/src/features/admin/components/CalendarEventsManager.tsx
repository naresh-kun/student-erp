/**
 * Student ERP — Admin Calendar & Events Manager Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminCalendarEventItem } from '../types';
import { adminEventSchema, type AdminEventInput } from '../schemas/eventSchema';
import { Calendar, Plus, X, MapPin, Users, CheckCircle2 } from 'lucide-react';

export const CalendarEventsManager: React.FC = () => {
  const [events, setEvents] = useState<AdminCalendarEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Add Event Form State
  const [formData, setFormData] = useState<AdminEventInput>({
    title: '',
    category: 'Academic',
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '15:30',
    location: '',
    description: '',
    target_audience: 'All Students & Staff',
    academic_relevance: 'Curricular Enrichment',
    od_eligible: false,
    is_holiday: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadEvents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getCalendarEvents();
      setEvents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load school events');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = adminEventSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setFormErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const newEvt = await AdminService.addCalendarEvent(result.data);
      setEvents((prev) => [newEvt, ...prev]);
      setSuccessMsg(`Published "${newEvt.title}" to school institutional calendar.`);
      setIsAddOpen(false);
      setFormData({
        title: '',
        category: 'Academic',
        start_date: '',
        end_date: '',
        start_time: '09:00',
        end_time: '15:30',
        location: '',
        description: '',
        target_audience: 'All Students & Staff',
        academic_relevance: 'Curricular Enrichment',
        od_eligible: false,
        is_holiday: false,
      });
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to publish event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && events.length === 0) {
    return <LoadingState message="Loading institutional calendar events..." />;
  }

  if (error && events.length === 0) {
    return <ErrorState message={error} onRetry={loadEvents} />;
  }

  return (
    <div className="space-y-6">
      {/* Success Notification */}
      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </span>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-700 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Control Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-700" />
            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Institutional Calendar & Event Schedule
            </span>
            <Badge variant="outline" className="text-xs font-mono">
              {events.length} Events
            </Badge>
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsAddOpen(true)}
            className="text-xs bg-blue-900 hover:bg-blue-800 font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish New School Event</span>
          </Button>
        </div>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((evt) => (
          <Card key={evt.id} className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge
                  variant={
                    evt.category === 'Examination'
                      ? 'destructive'
                      : evt.category === 'Holiday'
                      ? 'warning'
                      : evt.category === 'PTM'
                      ? 'default'
                      : 'outline'
                  }
                  className="text-[10px]"
                >
                  {evt.category}
                </Badge>
                <span className="font-mono text-xs text-slate-500">
                  {evt.start_date} {evt.end_date !== evt.start_date ? `to ${evt.end_date}` : ''}
                </span>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{evt.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{evt.description}</p>

              <div className="space-y-1 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Venue: {evt.location}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Audience: {evt.target_audience}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">{evt.academic_relevance}</span>
              {evt.od_eligible && (
                <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-200 bg-blue-50 dark:bg-blue-950/40">
                  OD Eligible
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Add Event Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Publish Official School Calendar Event
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Event Title</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Sports Meet 2026"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                {formErrors.title && <span className="text-rose-600 text-[10px]">{formErrors.title}</span>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    <option value="Examination">Examination</option>
                    <option value="Academic">Academic</option>
                    <option value="Holiday">Holiday</option>
                    <option value="PTM">PTM</option>
                    <option value="Sports">Sports</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Venue / Location</label>
                  <input
                    type="text"
                    placeholder="e.g. School Playground"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {formErrors.location && <span className="text-rose-600 text-[10px]">{formErrors.location}</span>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Start Date</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {formErrors.start_date && <span className="text-rose-600 text-[10px]">{formErrors.start_date}</span>}
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">End Date</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  />
                  {formErrors.end_date && <span className="text-rose-600 text-[10px]">{formErrors.end_date}</span>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  placeholder="Official notice and instructions for students, parents, or staff..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
                {formErrors.description && <span className="text-rose-600 text-[10px]">{formErrors.description}</span>}
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.od_eligible}
                    onChange={(e) => setFormData({ ...formData, od_eligible: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>On-Duty (OD) Sanction Eligible</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_holiday}
                    onChange={(e) => setFormData({ ...formData, is_holiday: e.target.checked })}
                    className="rounded text-blue-600"
                  />
                  <span>School Closed (Holiday)</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="default" size="sm" disabled={isSubmitting} className="bg-blue-900 hover:bg-blue-800 font-semibold">
                  {isSubmitting ? 'Publishing...' : 'Publish Event'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
