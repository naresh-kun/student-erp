/**
 * Student ERP — useActiveChild Hook
 * Phase 2 — Task 2.3: Deep Parent Role Experience
 *
 * Manages active child selection across parent views with strict boundary protection:
 * Parents can ONLY select children that are actually linked to their authenticated record.
 */

import { useState, useEffect } from 'react';
import type { LinkedChild } from '../types';

const STORAGE_ACTIVE_CHILD_KEY = 'student_erp_active_child_id';

export function useActiveChild(children: LinkedChild[] = []) {
  const [activeChildId, setActiveChildIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(STORAGE_ACTIVE_CHILD_KEY);
        if (stored) return stored;
      } catch {
        // Fallback
      }
    }
    return children[0]?.student_id || 'STU202600001';
  });

  // Ensure activeChildId is strictly valid within the linked children list
  useEffect(() => {
    if (children.length > 0) {
      const isValid = children.some((c) => c.student_id === activeChildId);
      if (!isValid) {
        const fallbackId = children[0].student_id;
        setActiveChildIdState(fallbackId);
        try {
          sessionStorage.setItem(STORAGE_ACTIVE_CHILD_KEY, fallbackId);
        } catch {
          // Fallback
        }
      }
    }
  }, [children, activeChildId]);

  const selectChild = (studentId: string) => {
    const isAllowed = children.some((c) => c.student_id === studentId);
    if (!isAllowed) {
      console.warn(`Unauthorized child selection attempt: ${studentId} is not linked to this parent.`);
      return;
    }
    setActiveChildIdState(studentId);
    try {
      sessionStorage.setItem(STORAGE_ACTIVE_CHILD_KEY, studentId);
    } catch {
      // Fallback
    }
  };

  const activeChild = children.find((c) => c.student_id === activeChildId) || children[0];

  return {
    activeChildId,
    activeChild,
    selectChild,
    hasMultipleChildren: children.length > 1,
  };
}
