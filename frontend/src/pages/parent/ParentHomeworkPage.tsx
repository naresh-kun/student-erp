/**
 * Student ERP — ParentHomeworkPage (MOD_001)
 * Authoritative Parent Homework Viewing Surface
 * Allows parents to monitor published homework and assignments for each linked child.
 * Incorporates multi-child switching tabs, child section scoping, and read-only access.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '@/components/ui/PageContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, EmptyState } from '@/components/ui/States';
import {
  useParentProfile,
  useLinkedChildren,
  useActiveChild,
  ParentChildBanner,
} from '@/features/parents';
import { HomeworkService } from '@/services/homeworkService';
import type { HomeworkItem } from '@/types';
import { Calendar, Clock, User, AlertCircle } from 'lucide-react';

export const ParentHomeworkPage: React.FC = () => {
  const { data: parentProfile, isLoading: profileLoading } = useParentProfile();
  const { data: linkedChildren = [], isLoading: childrenLoading } = useLinkedChildren(
    parentProfile?.id
  );
  const { activeChild, selectChild } = useActiveChild(linkedChildren);

  const [allHomework, setAllHomework] = useState<HomeworkItem[]>([]);
  const [isLoadingHomework, setIsLoadingHomework] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [error, setError] = useState<string | null>(null);

  const fetchHomework = useCallback(async () => {
    setIsLoadingHomework(true);
    setError(null);
    try {
      // Backend automatically scopes to linked children's published homework
      const items = await HomeworkService.getHomeworkList({ status: 'PUBLISHED' });
      setAllHomework(items);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load homework for linked children.';
      setError(msg);
    } finally {
      setIsLoadingHomework(false);
    }
  }, []);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  // Scoped to active child: match by class_name and section_name
  const childHomework = allHomework.filter((hw) => {
    if (!activeChild) return true;
    const classMatch =
      !activeChild.class_name ||
      hw.class_name.toLowerCase().includes(activeChild.class_name.toLowerCase()) ||
      activeChild.class_name.toLowerCase().includes(hw.class_name.toLowerCase());
    const sectionMatch =
      !activeChild.section_name ||
      hw.section_name.toLowerCase().includes(activeChild.section_name.toLowerCase()) ||
      activeChild.section_name.toLowerCase().includes(hw.section_name.toLowerCase());
    return classMatch && sectionMatch;
  });

  // Extract distinct subjects for active child
  const subjects = Array.from(
    new Set(childHomework.map((h) => `${h.subject_name} (${h.subject_code})`))
  );

  const filteredHomework = childHomework.filter((hw) => {
    if (selectedSubject !== 'ALL' && `${hw.subject_name} (${hw.subject_code})` !== selectedSubject) {
      return false;
    }
    return true;
  });

  if (profileLoading || childrenLoading) {
    return (
      <PageContainer>
        <LoadingState message="Loading student and guardian profile..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <ParentChildBanner
          parentProfile={parentProfile}
          activeChild={activeChild}
          linkedChildren={linkedChildren}
          onSelectChild={selectChild}
          showChildSelector={true}
        />

        <SectionHeader
          title="Coursework & Homework Monitor"
          description={`Homework tasks and submission deadlines for ${activeChild?.full_name || 'selected ward'}`}
        />

        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter Toolbar */}
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

            <div className="text-xs text-slate-500 font-mono">
              Enrolled: {activeChild?.class_name || ''} — {activeChild?.section_name || ''}
            </div>
          </div>
        </Card>

        {isLoadingHomework ? (
          <LoadingState message="Loading coursework assignments from server..." />
        ) : filteredHomework.length === 0 ? (
          <EmptyState
            title="No Homework for Selected Child"
            description={
              selectedSubject !== 'ALL'
                ? 'No homework found for the selected subject filter.'
                : `No active homework assignments found for ${activeChild?.full_name || 'this child'}.`
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredHomework.map((hw) => {
              const isPastDue = hw.due_date && new Date(hw.due_date) < new Date();
              return (
                <Card key={hw.id} className="p-5 border-l-4 border-l-blue-800">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-900 border border-blue-200">
                          {hw.subject_name} ({hw.subject_code})
                        </span>
                        <span className="text-xs text-slate-500">
                          Ward: <strong className="text-slate-800">{activeChild?.full_name}</strong> ({hw.class_name} — Section {hw.section_name})
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
                          Due Date: {hw.due_date}
                        </span>
                      )}
                      {hw.faculty_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Faculty: {hw.faculty_name}
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
export default ParentHomeworkPage;
