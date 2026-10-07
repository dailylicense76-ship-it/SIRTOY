export type LoanType = 'Flat' | 'Standard Amortization' | 'Diminishing';
export type Frequency = 'Daily' | 'Weekly' | 'Semi-monthly' | 'Monthly';
export type DisbursementMethod = 'Cash' | 'GCash' | 'Bank Transfer' | 'Check' | 'Other';
export type LoanStatus = 'Active' | 'Overdue' | 'Paid' | 'Restructured' | 'Pending Approval' | 'Rejected';
export type ApprovalStatus = 'Approved' | 'Pending' | 'Rejected';
export type UserRole = 'Developer' | 'Admin' | 'Staff';

export interface ScheduleItem {
  n: number;
  due: string;
  beginningBalance: number;
  amount: number;
  principal: number;
  interest: number;
  paid: number;
  paidPrincipal: number;
  paidInterest: number;
  remaining: number;
  endingBalance: number;
}

export interface Borrower {
  id: string;
  first: string;
  last: string;
  contact: string;
  email: string;
  address: string;
  areaId: string;
  collectorId: string;
  idType: string;
  idNo: string;
  idImage?: string;
  idImageName?: string;
  comaker: string;
  comakerContact: string;
  notes: string;
}

export interface Loan {
  id: string;
  loanNo: string;
  borrowerId: string;
  collectorId: string;
  principal: number;
  rate: number;
  months: number;
  term: number;
  frequency: Frequency;
  loanType: LoanType;
  method: LoanType;
  date: string;
  dueDate: string;
  dailyCollection: number;
  totalPayable: number;
  disbursementMethod: DisbursementMethod;
  fee: number;
  feePaid: number;
  ref?: string;
  remarks?: string;
  status: LoanStatus;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  createdBy?: string;
  cashDisbursed: boolean;
  schedule: ScheduleItem[];
  restructureFrom?: string;
  restructureTo?: string;
  restructuredAt?: string;
  renewedFrom?: string;
  renewalRequestId?: string;
  autoDeductLoanId?: string;
  createdAt: string;
}

export interface ScheduleAllocation {
  n: number;
  amount: number;
  principal: number;
  interest: number;
}

export interface PaymentAllocations {
  fee: number;
  schedule: ScheduleAllocation[];
}

export interface Payment {
  id: string;
  date: string;
  loanId: string;
  loanNo: string;
  borrowerId: string;
  borrowerName: string;
  collectorId: string;
  areaId: string;
  amount: number;
  principalCollected?: number;
  interestCollected?: number;
  method: DisbursementMethod;
  reference?: string;
  remarks?: string;
  allocations?: PaymentAllocations | null;
}

export interface CapitalTransaction {
  id: string;
  date: string;
  type: 'Add' | 'Withdraw';
  amount: number;
  method: DisbursementMethod;
  description: string;
  user: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: DisbursementMethod;
  user: string;
  approvalStatus: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
}

export interface Collector {
  id: string;
  name: string;
  areaId: string;
  dailyQuota: number;
  weeklyQuota: number;
  semiMonthlyQuota: number;
  monthlyQuota: number;
}

export interface Area {
  id: string;
  name: string;
  code: string;
}

export interface CashReconciliation {
  id: string;
  date: string;
  systemCash: number;
  actualCash: number;
  variance: number;
  notes: string;
  user: string;
}

export interface RenewalRequest {
  id: string;
  loanId: string;
  borrowerId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  requestedAt: string;
  processedBy?: string;
  processedAt?: string;
}

export interface User {
  id: string;
  name: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  collectorId: string;
  status: 'Active' | 'Inactive';
}

export interface AuditEntry {
  id: string;
  at: string;
  user: string;
  action: string;
  module: string;
  details: string | Record<string, unknown>;
}

export interface SystemSettings {
  company: string;
  logoUrl?: string;
  penaltyType?: 'Flat' | 'Percentage';
  penaltyRate?: number;
  penaltyGraceDays?: number;
  diskFolderName: string;
  diskFolderConfigured: boolean;
  diskDatabaseVersion: number;
  fakeDataRemoved: boolean;
  integrityRulesVersion: number;
  lastLocalSaveAt?: string;
  lastDiskSyncAt?: string;
  diskPermissionState?: string;
  diskAutoSave?: boolean;
  lastAutoBackupDate?: string;
  securityVersion?: number;
}

export interface Database {
  version: number;
  settings: SystemSettings;
  areas: Area[];
  collectors: Collector[];
  borrowers: Borrower[];
  capital: CapitalTransaction[];
  expenses: Expense[];
  loans: Loan[];
  payments: Payment[];
  audit: AuditEntry[];
  cashReconciliations: CashReconciliation[];
  renewalRequests: RenewalRequest[];
  users: User[];
}

export interface IntegrityIssue {
  type: string;
  detail: string;
}

export interface IntegrityReport {
  ok: boolean;
  issues: IntegrityIssue[];
  summary: {
    duplicateBorrowerNames: number;
    orphanLoans: number;
    duplicateLoanIds: number;
    duplicateLoanNos: number;
    multipleCurrentLoans: number;
    total: number;
  };
}

export interface CollectionCustomerRow {
  b: Borrower;
  loans: Loan[];
  state: 'Active' | 'Overdue' | 'Paid';
  next: ScheduleItem | null;
  expectedToday: number;
  arrears: number;
  totalOutstanding: number;
  collectorId: string;
}
