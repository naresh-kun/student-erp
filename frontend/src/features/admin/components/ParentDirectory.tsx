/**
 * Student ERP — Admin Parent Directory Component
 * Phase 2 — Task 2.5: Deep Admin & Principal Role Experiences
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/States';
import { AdminService } from '../services/adminService';
import type { AdminParentItem } from '../types';
import { Search, Phone, Mail, MapPin, Users } from 'lucide-react';

export const ParentDirectory: React.FC = () => {
  const [parents, setParents] = useState<AdminParentItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadParents = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await AdminService.getParents(search);
      setParents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load parent directory');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadParents();
  }, [search]);

  if (isLoading && parents.length === 0) {
    return <LoadingState message="Loading parent and guardian master directory..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadParents} />;
  }

  return (
    <div className="space-y-5">
      {/* Control Bar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search parent name, student name, child Student ID, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>
          <Badge variant="outline" className="text-xs font-mono text-slate-600 w-fit">
            {parents.length} Registered Guardians
          </Badge>
        </div>
      </Card>

      {/* Parents Register Cards */}
      {parents.length === 0 ? (
        <EmptyState title="No guardians found" description="Try searching with a different guardian name, student name, or ID." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {parents.map((p) => (
            <Card key={p.id} className="p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {p.first_name[0]}{p.last_name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{p.name}</h3>
                      <span className="text-[11px] text-slate-400 block">
                        {p.relation} • {p.occupation || 'Guardian'}
                      </span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[10px]">
                    {p.status}
                  </Badge>
                </div>

                {/* Linked Children */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Linked Student(s)</span>
                  </span>
                  <div className="space-y-1">
                    {p.children.map((c) => (
                      <div key={c.student_id} className="flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-blue-700 dark:text-blue-400 font-bold">
                            {c.student_id}
                          </span>
                          <span className="text-[10px] text-slate-400">{c.class_name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{p.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">{p.email}</span>
                  </div>
                  <div className="flex items-start gap-2 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] leading-tight text-slate-500">{p.address}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
