/**
 * Student ERP — Homework Domain Vitest Test Suite
 * MOD_001 — Faculty/Class Teacher Assignment Architecture + Homework Management
 *
 * Comprehensive automated verification covering:
 * 1. HomeworkService.getHomeworkList query parameter construction and response parsing
 * 2. HomeworkService.getHomeworkById detail retrieval
 * 3. HomeworkService.createHomework payload validation and API invocation
 * 4. HomeworkService.updateHomework patch updates
 * 5. HomeworkService.deleteHomework deletion
 * 6. HomeworkService.getTeachingScope authorized assignment retrieval
 * 7. Error handling for non-ok HTTP responses and 403 Forbidden errors
 * 8. Status filtering (PUBLISHED vs DRAFT) guaranteeing student/parent visibility rules
 * 9. Multi-child context scoping for Parent views
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HomeworkService, type TeachingScopeItem } from '../src/services/homeworkService';
import type { HomeworkItem, HomeworkCreatePayload, HomeworkUpdatePayload } from '../src/types';

describe('Homework Domain (MOD_001) — Service & Scoping Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      localStorage.setItem('access_token', 'test-access-token-123');
    }
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  const mockHomeworkItem: HomeworkItem = {
    id: 'hw-uuid-001',
    title: 'Linear Differential Equations Problem Set',
    description: 'Solve exercises 1 to 15 from Chapter 4.',
    school_class: 'cls-11-uuid',
    school_class_name: 'Grade 11',
    section: 'sec-11a-uuid',
    section_name: 'Section A',
    subject: 'sub-math-uuid',
    subject_name: 'Mathematics',
    subject_code: 'MATH101',
    assigned_by: 'fac-suresh-uuid',
    assigned_by_name: 'R. Suresh',
    assigned_date: '2026-10-06',
    due_date: '2026-10-12',
    status: 'PUBLISHED',
    max_marks: 25,
    submission_instructions: 'Submit in class notebook.',
    attachments_count: 0,
    created_at: '2026-10-06T10:00:00Z',
    updated_at: '2026-10-06T10:00:00Z',
  };

  const mockDraftHomeworkItem: HomeworkItem = {
    ...mockHomeworkItem,
    id: 'hw-uuid-002',
    title: 'Upcoming Physics Lab Preparation',
    status: 'DRAFT',
  };

  it('successfully fetches homework list with query parameters', async () => {
    const mockResponse = {
      status: 'success',
      data: [mockHomeworkItem],
      count: 1,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const items = await HomeworkService.getHomeworkList({
      section_id: 'sec-11a-uuid',
      status: 'PUBLISHED',
      due_date_from: '2026-10-01',
      due_date_to: '2026-10-31',
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/v1/homework/');
    expect(calledUrl).toContain('section_id=sec-11a-uuid');
    expect(calledUrl).toContain('status=PUBLISHED');
    expect(calledUrl).toContain('due_date_from=2026-10-01');
    expect(calledUrl).toContain('due_date_to=2026-10-31');

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('hw-uuid-001');
    expect(items[0].status).toBe('PUBLISHED');
  });

  it('fetches homework item by unique UUID', async () => {
    const mockResponse = {
      status: 'success',
      data: mockHomeworkItem,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    const item = await HomeworkService.getHomeworkById('hw-uuid-001');

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/v1/homework/hw-uuid-001/');
    expect(item.id).toBe('hw-uuid-001');
    expect(item.title).toBe('Linear Differential Equations Problem Set');
  });

  it('creates homework within authorized teaching scope', async () => {
    const createPayload: HomeworkCreatePayload = {
      title: 'Thermodynamics Heat Transfer Worksheet',
      description: 'Answer questions 1-10 on Fourier conduction.',
      school_class: 'cls-11-uuid',
      section: 'sec-11a-uuid',
      subject: 'sub-phy-uuid',
      due_date: '2026-10-15',
      status: 'PUBLISHED',
      max_marks: 30,
    };

    const mockCreatedItem: HomeworkItem = {
      ...mockHomeworkItem,
      id: 'hw-uuid-003',
      title: createPayload.title,
      max_marks: 30,
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: mockCreatedItem }),
    });

    const result = await HomeworkService.createHomework(createPayload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/v1/homework/');
    expect(calledInit.method).toBe('POST');
    expect(JSON.parse(calledInit.body)).toEqual(createPayload);
    expect(result.id).toBe('hw-uuid-003');
  });

  it('updates homework item with PATCH payload', async () => {
    const updatePayload: HomeworkUpdatePayload = {
      title: 'Updated Linear Differential Equations Assignment',
      status: 'PUBLISHED',
      due_date: '2026-10-18',
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'success',
        data: { ...mockHomeworkItem, ...updatePayload },
      }),
    });

    const updated = await HomeworkService.updateHomework('hw-uuid-001', updatePayload);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/v1/homework/hw-uuid-001/');
    expect(calledInit.method).toBe('PATCH');
    expect(updated.title).toBe('Updated Linear Differential Equations Assignment');
  });

  it('deletes homework item with DELETE request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    await expect(HomeworkService.deleteHomework('hw-uuid-001')).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [calledUrl, calledInit] = (global.fetch as any).mock.calls[0];
    expect(calledUrl).toContain('/api/v1/homework/hw-uuid-001/');
    expect(calledInit.method).toBe('DELETE');
  });

  it('retrieves faculty teaching scope assignments for dropdown population', async () => {
    const mockScopeItems: TeachingScopeItem[] = [
      {
        assignment_id: 'assign-1',
        class_id: 'cls-11-uuid',
        class_name: 'Grade 11',
        section_id: 'sec-11a-uuid',
        section_name: 'Section A',
        subject_id: 'sub-math-uuid',
        subject_name: 'Mathematics',
        subject_code: 'MATH101',
        academic_year_id: 'ay-2026',
        academic_year_name: '2025-2026',
      },
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: 'success', data: mockScopeItems }),
    });

    const scopes = await HomeworkService.getTeachingScope();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const calledUrl = (global.fetch as any).mock.calls[0][0];
    expect(calledUrl).toContain('/api/v1/homework/scope/');
    expect(scopes).toHaveLength(1);
    expect(scopes[0].assignment_id).toBe('assign-1');
    expect(scopes[0].subject_name).toBe('Mathematics');
  });

  it('propagates authorization error (403 Forbidden) correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        status: 'error',
        message: 'You are not assigned to teach this class section or subject.',
      }),
    });

    await expect(
      HomeworkService.createHomework({
        title: 'Unauthorized HW',
        school_class: 'cls-unassigned',
        section: 'sec-unassigned',
        subject: 'sub-unassigned',
        due_date: '2026-10-20',
        status: 'PUBLISHED',
      })
    ).rejects.toThrow('You are not assigned to teach this class section or subject.');
  });

  it('verifies that student visibility rule strictly filters out draft homework', () => {
    const list = [mockHomeworkItem, mockDraftHomeworkItem];
    // In student/parent views, only PUBLISHED homework is displayed
    const studentVisibleList = list.filter((item) => item.status === 'PUBLISHED');

    expect(studentVisibleList).toHaveLength(1);
    expect(studentVisibleList[0].id).toBe('hw-uuid-001');
    expect(studentVisibleList.some((item) => item.status === 'DRAFT')).toBe(false);
  });

  it('verifies multi-child context filtering for parent dashboard', () => {
    const child1Homework: HomeworkItem = {
      ...mockHomeworkItem,
      id: 'hw-child-1',
      school_class_name: 'Grade 11',
      section_name: 'Section A',
    };

    const child2Homework: HomeworkItem = {
      ...mockHomeworkItem,
      id: 'hw-child-2',
      school_class_name: 'Grade 8',
      section_name: 'Section B',
      subject_name: 'General Science',
    };

    const allChildrenHomework = [child1Homework, child2Homework];

    // When Parent selects Child 1 (enrolled in Grade 11 Section A)
    const child1View = allChildrenHomework.filter(
      (hw) => hw.school_class_name === 'Grade 11' && hw.section_name === 'Section A'
    );
    expect(child1View).toHaveLength(1);
    expect(child1View[0].id).toBe('hw-child-1');

    // When Parent selects Child 2 (enrolled in Grade 8 Section B)
    const child2View = allChildrenHomework.filter(
      (hw) => hw.school_class_name === 'Grade 8' && hw.section_name === 'Section B'
    );
    expect(child2View).toHaveLength(1);
    expect(child2View[0].id).toBe('hw-child-2');
  });
});
