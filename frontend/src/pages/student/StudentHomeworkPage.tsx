/**
 * Student ERP — StudentHomeworkPage (MOD_001)
 * Authoritative Student Homework Viewing Surface
 * Displays published coursework assignments for the student's active enrolled section and subjects.
 * Read-only access with zero mutation controls.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import { HomeworkService } from '@/services/homeworkService';
import type { HomeworkItem } from '@/types';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';

export const StudentHomeworkPage: React.FC = () => {
  const [homeworkList, setHomeworkList] = useState<HomeworkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchHomework = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const filters: Record<string, string> = { status: 'PUBLISHED' };
      if (searchQuery.trim()) filters.search = searchQuery.trim();

      const items = await HomeworkService.getHomeworkList(filters);
      setHomeworkList(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load homework.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  // Extract distinct subjects
  const subjects = Array.from(
    new Set(homeworkList.map((h) => `${h.subject_name} (${h.subject_code})`))
  );

  const filteredHomework = homeworkList.filter((hw) => {
    if (selectedSubject !== 'ALL' && `${hw.subject_name} (${hw.subject_code})` !== selectedSubject) {
      return false;
    }
    return true;
  });

  return (
    <PageContainer>
      <div className="space-y-6">
        <SectionHeader
          title="My Homework & Coursework"
          description="Assignments, problem sets, and submission deadlines published for your class section."
        />

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-600 uppercase">Subject:</span>
              <select
                className="text-xs border border-slate-300 rounded px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>
        </Card>

        {isLoading ? (
          <LoadingState message="Loading coursework assignments..." />
        ) : filteredHomework.length === 0 ? (
          <EmptyState
            title="No Homework Found"
            description={
              selectedSubject !== 'ALL' || searchQuery
                ? 'No assignments match the selected filter.'
                : 'No homework has been assigned for your class. Check back later!'
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredHomework.map((hw) => {
              const isPastDue = hw.due_date && new Date(hw.due_date) < new Date();
              return (
                <Card key={hw.id} className="p-5 border-l-4 border-l-blue-900">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                          {hw.subject_name} ({hw.subject_code})
                        </span>
                        <span className="text-xs text-slate-500">
                          {hw.class_name} — Section {hw.section_name}
                        </span>
                      </div>
                      {hw.due_date && (
                        <Badge variant={isPastDue ? 'destructive' : 'warning'}>
                          {isPastDue ? 'Past Due' : `Due: ${hw.due_date}`}
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-base font-semibold text-slate-900">{hw.title}</h3>

                    {hw.description && (
                      <div className="p-3 bg-slate-50 rounded border border-slate-100 text-xs text-slate-700 whitespace-pre-line font-mono">
                        {hw.description}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Assigned: {hw.assigned_date}
                      </span>
                      {hw.due_date && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Due: {hw.due_date}
                        </span>
                      )}
                      {hw.faculty_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Teacher: {hw.faculty_name}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
};
export default StudentHomeworkPage;
