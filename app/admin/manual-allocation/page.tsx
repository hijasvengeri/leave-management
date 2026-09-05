

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Employee {
  id: string;
  employee_code?: string;
  full_name: string;
  department?: string;
}

interface LeaveRecord {
  id: string;
  employee_id: string;
  allocated_type: string;
  leave_date: string;
  half: string;
  status: string;
  department?: string | null;
}

export default function StaffAllocationManager() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [staffLeaves, setStaffLeaves] = useState<LeaveRecord[]>([]);
  
  // Single Searchable Bar State
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedAllocCode, setSelectedAllocCode] = useState<string>('');
  const [leaveDate, setLeaveDate] = useState<string>('');
  const [halfType, setHalfType] = useState<string>('1H');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Fetch & Sort Staff List A to Z
  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .schema("leave_management")
        .from("employees")
        .select("id, employee_code, full_name, department");

      if (data) {
        const sortedData = [...data].sort((a, b) =>
          a.full_name.localeCompare(b.full_name, undefined, { sensitivity: 'base' })
        );
        setEmployees(sortedData);
      }
    }
    loadData();
  }, []);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch staff leaves when selected staff changes
  useEffect(() => {
    if (!selectedEmp) {
      setStaffLeaves([]);
      return;
    }

    async function loadStaffLeaves() {
      const { data } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("*")
        .eq("employee_id", selectedEmp?.id);

      if (data) setStaffLeaves(data);
    }

    loadStaffLeaves();
  }, [selectedEmp]);

  // Filtered staff list for the combobox bar
  const filteredEmployees = employees.filter((emp) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = emp.full_name.toLowerCase().includes(query);
    const codeMatch = emp.employee_code ? emp.employee_code.toLowerCase().includes(query) : false;
    return nameMatch || codeMatch;
  });

  // Calculate remaining allocations
  const getPendingAllocations = (): string[] => {
    if (!selectedEmp) return [];

    const year = 2026;
    const currentMonth = 6; // June

    const consumedKeys = new Set(
      staffLeaves
        .filter((l) => l.status !== 'LOP' && l.allocated_type && !l.allocated_type.startsWith('LOP'))
        .map((l) => l.allocated_type.trim())
    );

    const currentMonthBatches = [
      `casual_1H_${year}_${currentMonth}`,
      `casual_2H_${year}_${currentMonth}`,
      `sick_1H_${year}_${currentMonth}`,
      `sick_2H_${year}_${currentMonth}`,
      `earned_1H_${year}_${currentMonth}`,
      `earned_2H_${year}_${currentMonth}`,
    ];

    return currentMonthBatches.filter((code) => !consumedKeys.has(code));
  };

  const pendingAllocations = getPendingAllocations();

  // Auto-select pending item or fallback to LOP
  useEffect(() => {
    if (pendingAllocations.length > 0) {
      setSelectedAllocCode(pendingAllocations[0]);
    } else {
      setSelectedAllocCode('LOP');
    }
  }, [selectedEmp, staffLeaves]);

  // Submit Handler
  const handleAllocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || !leaveDate) {
      setMessage({ type: 'error', text: 'Please select staff and leave date.' });
      return;
    }

    // Duplicate & Overlap Protection
    const existingLeaveOnDate = staffLeaves.filter(
      (l) => l.leave_date === leaveDate && l.status !== 'rejected'
    );

    if (existingLeaveOnDate.length > 0) {
      const hasFullDay = existingLeaveOnDate.some((l) => !l.half || l.half === 'Full');
      const hasSameHalf = existingLeaveOnDate.some((l) => l.half === halfType);

      if (hasFullDay) {
        setMessage({
          type: 'error',
          text: `A Full Day leave is already recorded for ${leaveDate}. Cannot add further allocations.`,
        });
        return;
      }

      if (hasSameHalf) {
        setMessage({
          type: 'error',
          text: `[${halfType}] is already allocated on ${leaveDate}. Duplicate allocation blocked.`,
        });
        return;
      }

      if (halfType === 'Full' && existingLeaveOnDate.length > 0) {
        setMessage({
          type: 'error',
          text: `A partial leave is already recorded on ${leaveDate}. Cannot assign a Full Day.`,
        });
        return;
      }
    }

    setSubmitting(true);
    setMessage(null);

    const isLop = selectedAllocCode === 'LOP' || pendingAllocations.length === 0;
    const targetYear = 2026;
    const targetMonth = 6;

    const finalAllocatedType = isLop
      ? `LOP_${halfType}_${targetYear}_${targetMonth}`
      : selectedAllocCode;

    const payload = {
      employee_id: selectedEmp.id,
      employee_name: selectedEmp.full_name,
      department: selectedEmp.department || null,
      type: 'Leave',
      reason: isLop ? 'Auto LOP Allocation' : 'Manual Admin Allocation',
      status: isLop ? 'LOP' : 'approved',
      leave_date: leaveDate,
      half: halfType,
      allocated_type: finalAllocatedType,
      allocation_source_year: targetYear,
      allocation_source_month: targetMonth,
      allocation_source_type: isLop ? 'LOP' : selectedAllocCode.split('_')[0],
      frozen: false,
    };

    const { error } = await supabase
      .schema("leave_management")
      .from("leaves")
      .insert([payload]);

    setSubmitting(false);

    if (error) {
      setMessage({ type: 'error', text: `Error: ${error.message}` });
    } else {
      setMessage({
        type: 'success',
        text: `Successfully allocated [${finalAllocatedType}] on ${leaveDate} (${halfType})!`,
      });

      setLeaveDate('');
      const { data } = await supabase
        .schema("leave_management")
        .from("leaves")
        .select("*")
        .eq("employee_id", selectedEmp.id);
      if (data) setStaffLeaves(data);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-6">
      <h2 className="text-xl font-bold text-slate-800">Staff Allocation & LOP Manager</h2>

      {/* SINGLE SEARCHABLE DROPDOWN BAR */}
      <div className="space-y-2" ref={dropdownRef}>
        <label className="block text-xs font-semibold uppercase text-slate-600">
          Select Staff Member
        </label>

        <div className="relative">
          {/* Main Searchable Input Bar */}
          <input
            type="text"
            className="w-full p-3 border rounded-lg bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
            placeholder="Type name or emp code to search..."
            value={isOpen ? searchQuery : selectedEmp ? `${selectedEmp.full_name} (${selectedEmp.employee_code ?? 'No Code'}) - ${selectedEmp.department ?? 'No Dept'}` : searchQuery}
            onFocus={() => {
              setIsOpen(true);
              setSearchQuery('');
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
          />

          {/* Action Icon / Clear Button */}
          <div className="absolute right-3 top-3 flex items-center gap-1 text-slate-400">
            {selectedEmp && !isOpen ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedEmp(null);
                  setSearchQuery('');
                  setIsOpen(true);
                }}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-1"
              >
                ✕
              </button>
            ) : (
              <span className="text-xs">▼</span>
            )}
          </div>

          {/* Floating Dropdown Results */}
          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border rounded-lg shadow-lg divide-y divide-slate-100">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setSelectedEmp(emp);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className="p-3 hover:bg-blue-50 cursor-pointer flex justify-between items-center text-sm"
                  >
                    <div>
                      <span className="font-semibold text-slate-800">{emp.full_name}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        ({emp.employee_code ?? 'No Code'})
                      </span>
                    </div>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                      {emp.department ?? 'No Dept'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-3 text-xs text-slate-500 text-center">No staff found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedEmp && (
        <>
          {/* Pending Allocation Selection */}
          <div className="bg-slate-50 p-4 rounded-lg border space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Pending Allocation Dropdown (June 2026)
            </label>

            <select
              value={selectedAllocCode}
              onChange={(e) => setSelectedAllocCode(e.target.value)}
              className="w-full p-3 border rounded-lg text-sm font-semibold bg-white text-slate-800"
            >
              {pendingAllocations.length > 0 ? (
                pendingAllocations.map((code) => (
                  <option key={code} value={code}>
                    {code} — Available
                  </option>
                ))
              ) : (
                <option value="LOP">No Quota Remaining — Formatted LOP</option>
              )}
              <option value="LOP">-- Force LOP --</option>
            </select>

            <div className="text-xs font-medium text-slate-500">
              Pending Allocations Remaining: <span className="font-bold text-slate-800">{pendingAllocations.length}</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAllocationSubmit} className="bg-slate-50 p-4 rounded-lg border space-y-4">
            {message && (
              <div
                className={`p-3 rounded-md text-xs font-medium ${
                  message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Leave Date</label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full p-2.5 border rounded-md text-sm bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Half Day</label>
                <select
                  value={halfType}
                  onChange={(e) => setHalfType(e.target.value)}
                  className="w-full p-2.5 border rounded-md text-sm bg-white"
                >
                  <option value="1H">1H (First Half)</option>
                  <option value="2H">2H (Second Half)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-2.5 font-semibold text-xs text-white rounded-md transition ${
                selectedAllocCode === 'LOP' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {submitting
                ? 'Submitting...'
                : selectedAllocCode === 'LOP'
                ? `Submit as LOP_${halfType}_2026_6`
                : `Allocate [${selectedAllocCode}]`}
            </button>
          </form>
        </>
      )}
    </div>
  );
}