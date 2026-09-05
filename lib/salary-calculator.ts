// // lib/salary-calculator.ts

// export interface EmployeeSalaryData {
//   id: string;
//   employee_code: string;
//   full_name?: string;
//   joining_date?: string;
//   is_permanently_daily?: boolean;
//   daily_wage_until?: string | null;
//   normal_salary?: string | number | null;
//   probation_salary?: string | number | null;
//   daily_wage_rate?: string | number | null;
//   is_daily_wage_joining_month?: boolean;
// }

// export interface ComputedSalaryResult {
//   employeeCode: string;
//   salaryType: 'PERMANENT_DAILY' | 'JOINING_MONTH_DAILY' | 'PROBATION' | 'REGULAR';
//   rateUsed: number;
//   perDayRate: number;
//   grossSalary: number;
//   lopDays: number;
//   lopDeduction: number;
//   retainedAmount: number;
//   netPayable: number;
// }

// export function calculateSalary(
//   emp: EmployeeSalaryData,
//   params: {
//     year: number;
//     month: number;
//     presentDays: number;
//     lopDays?: number;
//     retainedAmount?: number;
//     totalDaysInMonth?: number;
//     probationDurationMonths?: number;
//   }
// ): ComputedSalaryResult {
//   const {
//     year,
//     month,
//     presentDays,
//     lopDays = 0,
//     retainedAmount = 0,
//     totalDaysInMonth = 30,
//     probationDurationMonths = 3,
//   } = params;

//   const normalSalary = Number(emp.normal_salary) || 0;
//   const probationSalary = Number(emp.probation_salary) || 0;
//   const dailyWageRate = Number(emp.daily_wage_rate) || 0;

//   let salaryType: ComputedSalaryResult['salaryType'] = 'REGULAR';
//   let baseSalary = 0;
//   let perDayRate = 0;

//   if (emp.is_permanently_daily) {
//     salaryType = 'PERMANENT_DAILY';
//     baseSalary = dailyWageRate * totalDaysInMonth;
//     perDayRate = dailyWageRate;
//   } else if (
//     emp.is_daily_wage_joining_month &&
//     emp.daily_wage_until &&
//     isSameMonthAndYear(emp.daily_wage_until, year, month)
//   ) {
//     salaryType = 'JOINING_MONTH_DAILY';
//     baseSalary = dailyWageRate * totalDaysInMonth;
//     perDayRate = dailyWageRate;
//   } else if (
//     probationSalary > 0 &&
//     emp.joining_date &&
//     isInProbationPeriod(emp.joining_date, year, month, probationDurationMonths)
//   ) {
//     salaryType = 'PROBATION';
//     baseSalary = probationSalary;
//     perDayRate = probationSalary / 30; // standard 30 days
//   } else {
//     salaryType = 'REGULAR';
//     baseSalary = normalSalary;
//     perDayRate = normalSalary / 30; // standard 30 days
//   }

//   // 🌟 Calculate LOP Amount = (Regular Salary / 30) * LOP Days
//   const lopDeduction = Number((perDayRate * lopDays).toFixed(2));
//   const roundedRetention = Number(retainedAmount.toFixed(2));

//   // 🌟 Net Payable = Regular Salary - Retained Amount - LOP Amount
//   const grossSalary = Number(baseSalary.toFixed(2));
//   const netPayable = Math.max(0, Number((grossSalary - roundedRetention - lopDeduction).toFixed(2)));

//   return {
//     employeeCode: emp.employee_code,
//     salaryType,
//     rateUsed: baseSalary,
//     perDayRate: Number(perDayRate.toFixed(2)),
//     grossSalary,
//     lopDays,
//     lopDeduction,
//     retainedAmount: roundedRetention,
//     netPayable,
//   };
// }

// function isSameMonthAndYear(dateStr: string, year: number, month: number): boolean {
//   const date = new Date(dateStr);
//   return date.getFullYear() === year && date.getMonth() + 1 === month;
// }

// function isInProbationPeriod(
//   joiningDateStr: string,
//   targetYear: number,
//   targetMonth: number,
//   probationMonths: number
// ): boolean {
//   const joinDate = new Date(joiningDateStr);
//   const targetDate = new Date(targetYear, targetMonth - 1, 1);
//   const probationEnd = new Date(joinDate);
//   probationEnd.setMonth(probationEnd.getMonth() + probationMonths);
//   return targetDate < probationEnd;
// }





// // lib/salary-calculator.ts

// export interface SalaryStructure {
//   stage_name: string;
//   base_salary: number;
//   effective_from: string;
//   effective_to?: string | null;
// }

// export interface EmployeeSalaryData {
//   id: string;
//   employee_code: string;
//   full_name?: string;
//   retention_amount?: number; // Retention deduction amount for staff
//   salary_structures?: SalaryStructure[]; // Active & historical salary stages
// }

// export interface ComputedSalaryResult {
//   employeeCode: string;
//   activeStage: string;
//   baseSalary: number;
//   perDayRate: number;
//   lopDays: number;
//   lopDeduction: number;
//   retainedAmount: number;
//   netPayable: number;
// }

// /**
//  * Calculates payroll where LOP deduction is based exclusively on unpaid LOP days.
//  */
// export function calculateSalary(
//   emp: EmployeeSalaryData,
//   params: {
//     targetDate: string; // 'YYYY-MM-DD'
//     lopDays?: number;   // Pure LOP days (excluding paid leaves)
//   }
// ): ComputedSalaryResult {
//   const { targetDate, lopDays = 0 } = params;
//   const target = new Date(targetDate);

//   // 1. Fetch current active base salary from active structure
//   const activeStructure = (emp.salary_structures || [])
//     .filter((s) => {
//       const from = new Date(s.effective_from);
//       const to = s.effective_to ? new Date(s.effective_to) : null;
//       return target >= from && (!to || target <= to);
//     })
//     .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];

//   const baseSalary = activeStructure ? Number(activeStructure.base_salary) : 0;
//   const activeStage = activeStructure ? activeStructure.stage_name : 'No Active Salary';

//   // 2. Per Day Salary Rate = Base Salary / 30
//   const perDayRate = baseSalary / 30;

//   // 3. Deductions: (Base Salary / 30) * Only LOP Days
//   const lopDeduction = Number((perDayRate * lopDays).toFixed(2));
//   const retainedAmount = Number((emp.retention_amount || 0).toFixed(2));

//   // 4. Net Payable Calculation
//   const netPayable = Math.max(0, Number((baseSalary - retainedAmount - lopDeduction).toFixed(2)));

//   return {
//     employeeCode: emp.employee_code,
//     activeStage,
//     baseSalary: Number(baseSalary.toFixed(2)),
//     perDayRate: Number(perDayRate.toFixed(2)),
//     lopDays,
//     lopDeduction,
//     retainedAmount,
//     netPayable,
//   };
// }





















// // lib/salary-calculator.ts

// export interface SalaryStructure {
//   stage_name: string;
//   base_salary: number;
//   effective_from: string;
//   effective_to?: string | null;
// }

// export interface EmployeeSalaryData {
//   id: string;
//   employee_code: string;
//   full_name?: string;
//   retention_amount?: number; // Retention deduction amount for staff
//   salary_structures?: SalaryStructure[]; // Active & historical salary stages
// }

// export interface ComputedSalaryResult {
//   employeeCode: string;
//   activeStage: string;
//   baseSalary: number;
//   perDayRate: number;
//   lopDays: number;
//   lopDeduction: number;
//   retainedAmount: number;
//   netPayable: number;
// }

// /**
//  * Calculates payroll where LOP deduction is based exclusively on unpaid LOP days
//  * and retention is only deducted if the employee is not in Probation.
//  */
// export function calculateSalary(
//   emp: EmployeeSalaryData,
//   params: {
//     targetDate: string; // 'YYYY-MM-DD'
//     lopDays?: number;   // Pure LOP days (excluding paid leaves)
//   }
// ): ComputedSalaryResult {
//   const { targetDate, lopDays = 0 } = params;
//   const target = new Date(targetDate);

//   // 1. Fetch current active base salary from active structure
//   const activeStructure = (emp.salary_structures || [])
//     .filter((s) => {
//       const from = new Date(s.effective_from);
//       const to = s.effective_to ? new Date(s.effective_to) : null;
//       return target >= from && (!to || target <= to);
//     })
//     .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];

//   const baseSalary = activeStructure ? Number(activeStructure.base_salary) : 0;
//   const activeStage = activeStructure ? activeStructure.stage_name : 'No Active Salary';

//   // 2. Per Day Salary Rate = Base Salary / 30
//   const perDayRate = baseSalary / 30;

//   // 3. Deductions: (Base Salary / 30) * Only LOP Days
//   const lopDeduction = Number((perDayRate * lopDays).toFixed(2));

//   // Only apply retention deduction if employee is NOT in probation
//   const isProbation = activeStage === 'Probation';
//   const retainedAmount = isProbation ? 0 : Number((emp.retention_amount || 0).toFixed(2));

//   // 4. Net Payable Calculation
//   const netPayable = Math.max(0, Number((baseSalary - retainedAmount - lopDeduction).toFixed(2)));

//   return {
//     employeeCode: emp.employee_code,
//     activeStage,
//     baseSalary: Number(baseSalary.toFixed(2)),
//     perDayRate: Number(perDayRate.toFixed(2)),
//     lopDays,
//     lopDeduction,
//     retainedAmount,
//     netPayable,
//   };
// }















// lib/salary-calculator.ts

export interface SalaryStructure {
  stage_name: string;
  base_salary: number;
  effective_from: string;
  effective_to?: string | null;
}

export interface EmployeeSalaryData {
  id: string;
  employee_code: string;
  full_name?: string;
  retention_amount?: number;
  salary_structures?: SalaryStructure[];
}

export interface ComputedSalaryResult {
  employeeCode: string;
  activeStage: string;
  baseSalary: number;
  perDayRate: number;
  hourlyRate: number;
  lopDays: number;
  lopDeduction: number;
  retainedAmount: number;
  overtimeHours: number;
  overtimePay: number;
  shortageHours: number;
  shortageDeduction: number;
  netPayable: number;
}

export function calculateSalary(
  emp: EmployeeSalaryData,
  params: {
    targetDate: string; // 'YYYY-MM-DD'
    lopDays?: number;   // Pure LOP days
    overtimeHours?: number;
    shortageHours?: number;
  }
): ComputedSalaryResult {
  const { targetDate, lopDays = 0, overtimeHours = 0, shortageHours = 0 } = params;
  const target = new Date(targetDate);

  // 1. Fetch current active base salary from active structure
  const activeStructure = (emp.salary_structures || [])
    .filter((s) => {
      const from = new Date(s.effective_from);
      const to = s.effective_to ? new Date(s.effective_to) : null;
      return target >= from && (!to || target <= to);
    })
    .sort((a, b) => new Date(b.effective_from).getTime() - new Date(a.effective_from).getTime())[0];

  const baseSalary = activeStructure ? Number(activeStructure.base_salary) : 0;
  const activeStage = activeStructure ? activeStructure.stage_name : 'No Active Salary';

  // 2. Rates (30 days/month, 8 hours/day = 240 hours/month)
  const perDayRate = baseSalary / 30;
  const hourlyRate = baseSalary / 240;

  // 3. Deductions & Additions
  const lopDeduction = Number((perDayRate * lopDays).toFixed(2));

  // Overtime pay (+) & Shortage deduction (-)
  const overtimePay = Number((overtimeHours * hourlyRate).toFixed(2));
  const shortageDeduction = Number((shortageHours * hourlyRate).toFixed(2));

  // Only apply retention deduction if employee is NOT in probation
  const isProbation = activeStage === 'Probation';
  const retainedAmount = isProbation ? 0 : Number((emp.retention_amount || 0).toFixed(2));

  // 4. Net Payable Calculation
  // Net = Base + Overtime - Shortage - LOP - Retention
  const rawNetPayable = baseSalary + overtimePay - shortageDeduction - lopDeduction - retainedAmount;
  const netPayable = Math.max(0, Number(rawNetPayable.toFixed(2)));

  return {
    employeeCode: emp.employee_code,
    activeStage,
    baseSalary: Number(baseSalary.toFixed(2)),
    perDayRate: Number(perDayRate.toFixed(2)),
    hourlyRate: Number(hourlyRate.toFixed(2)),
    lopDays,
    lopDeduction,
    retainedAmount,
    overtimeHours: Number(overtimeHours.toFixed(2)),
    overtimePay,
    shortageHours: Number(shortageHours.toFixed(2)),
    shortageDeduction,
    netPayable,
  };
}