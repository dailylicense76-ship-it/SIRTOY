import {
  Borrower,
  Loan,
  ScheduleItem,
  Payment,
  CapitalTransaction,
  Expense,
  Collector,
  Area,
  CashReconciliation,
  RenewalRequest,
  Database,
  IntegrityReport,
  IntegrityIssue,
  LoanType,
  Frequency,
  CollectionCustomerRow,
  SystemSettings
} from '../types';

export const today = (): string => {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const money = (n: number | null | undefined): string => {
  return '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export const esc = (s: string | null | undefined): string => {
  return String(s ?? '').replace(/[&<>"']/g, x => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[x] || x));
};

export const datef = (d: string | null | undefined): string => {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: '2-digit' });
};

export const num = (v: unknown, fallback = 0): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export const round2 = (v: number): number => {
  return Math.round((num(v) * 100) + Number.EPSILON) / 100;
};

export const dateDiffDays = (a: string, b: string): number => {
  const x = new Date((a || today()) + 'T00:00:00');
  const y = new Date((b || today()) + 'T00:00:00');
  return Math.round((y.getTime() - x.getTime()) / 86400000);
};

export const addDays = (s: string, n: number): string => {
  const d = new Date((s || today()) + 'T00:00:00');
  d.setDate(d.getDate() + Number(n || 0));
  return d.toISOString().slice(0, 10);
};

export const addCalendarMonths = (s: string, n: number): string => {
  const d = new Date((s || today()) + 'T00:00:00');
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + Math.max(0, Math.floor(num(n))));
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  const z = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};

export const daysFor = (freq: Frequency): number => {
  return freq === 'Daily' ? 1 : freq === 'Weekly' ? 7 : freq === 'Semi-monthly' ? 15 : 30;
};

export const periodsForMonths = (months: number, freq: Frequency): number => {
  const m = Math.max(1, Math.floor(num(months)));
  return freq === 'Daily' ? m * 30 : freq === 'Weekly' ? m * 4 : freq === 'Semi-monthly' ? m * 2 : m;
};

export const frequencyLabel = (f: Frequency): string => {
  return f === 'Daily' ? 'day' : f === 'Weekly' ? 'week' : f === 'Semi-monthly' ? 'semi-month' : 'month';
};

export const collectionLabel = (f: Frequency): string => {
  return f === 'Daily' ? 'Daily Collection' : f === 'Weekly' ? 'Weekly Collection' : f === 'Semi-monthly' ? 'Semi-monthly Collection' : 'Monthly Collection';
};

export const normNamePart = (v: string | null | undefined): string => {
  return String(v ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
};

export const borrowerNameKey = (bOrFirst: Borrower | string, bLast = ''): string => {
  if (typeof bOrFirst === 'object' && bOrFirst !== null) {
    return normNamePart(bOrFirst.first) + '|' + normNamePart(bOrFirst.last);
  }
  return normNamePart(bOrFirst) + '|' + normNamePart(bLast);
};

export const bname = (b?: Borrower | null): string => {
  if (!b) return '—';
  return `${b.first || ''} ${b.last || ''}`.trim() || '—';
};

export const cname = (col?: Collector | null | string, db?: Database): string => {
  if (!col) return '—';
  if (typeof col === 'string') {
    return db?.collectors.find(c => c.id === col)?.name || '—';
  }
  return col.name || '—';
};

export const aname = (area?: Area | null | string, db?: Database): string => {
  if (!area) return '—';
  if (typeof area === 'string') {
    return db?.areas.find(a => a.id === area)?.name || '—';
  }
  return area.name || '—';
};

export const isCashMethod = (method?: string): boolean => {
  return String(method || 'Cash').trim().toLowerCase() === 'cash';
};

export function schedulePlan(
  principal: number,
  rate: number,
  months: number,
  freq: Frequency,
  start: string,
  loanType: LoanType = 'Flat'
) {
  principal = Math.max(0, round2(principal));
  rate = Math.max(0, num(rate));
  months = Math.max(1, Math.floor(num(months)));
  const validLoanType: LoanType = ['Flat', 'Standard Amortization', 'Diminishing'].includes(loanType) ? loanType : 'Flat';
  const periods = periodsForMonths(months, freq);

  if (periods < 1 || principal <= 0) {
    return { rows: [] as ScheduleItem[], months, periods, total: 0, collection: 0, dueDate: '', loanType: validLoanType, totalInterest: 0 };
  }

  const periodMonthFactor = freq === 'Weekly' ? 7 / 30 : freq === 'Semi-monthly' ? 15 / 30 : freq === 'Daily' ? 1 / 30 : 1;
  const periodRate = (rate / 100) * periodMonthFactor;

  const dueFor = (i: number) => {
    return freq === 'Monthly'
      ? addCalendarMonths(start, i)
      : freq === 'Weekly'
      ? addDays(start, 7 * i)
      : freq === 'Semi-monthly'
      ? addDays(start, 15 * i)
      : addDays(start, i);
  };

  const dueDate = dueFor(periods);
  const rows: ScheduleItem[] = [];

  // Flat rate calculation
  if (validLoanType === 'Flat') {
    const totalInterest = round2(principal * (rate / 100) * months);
    const total = round2(principal + totalInterest);
    const regular = round2(total / periods);
    const regularInterest = round2(totalInterest / periods);

    let usedInterest = 0;
    let usedPrincipal = 0;
    let usedAmount = 0;

    for (let i = 1; i <= periods; i++) {
      const last = i === periods;
      const interest = last ? round2(totalInterest - usedInterest) : regularInterest;
      const amount = last ? round2(total - usedAmount) : regular;
      const principalPart = last ? round2(principal - usedPrincipal) : round2(Math.max(0, amount - interest));
      const beginning = round2(principal - usedPrincipal);
      const ending = round2(Math.max(0, beginning - principalPart));

      rows.push({
        n: i,
        due: dueFor(i),
        beginningBalance: beginning,
        amount,
        principal: principalPart,
        interest,
        paid: 0,
        paidPrincipal: 0,
        paidInterest: 0,
        remaining: amount,
        endingBalance: ending
      });

      usedInterest = round2(usedInterest + interest);
      usedPrincipal = round2(usedPrincipal + principalPart);
      usedAmount = round2(usedAmount + amount);
    }

    return {
      rows,
      months,
      periods,
      total: round2(rows.reduce((a, x) => a + x.amount, 0)),
      collection: rows[0]?.amount || 0,
      dueDate,
      loanType: validLoanType,
      totalInterest: round2(rows.reduce((a, x) => a + x.interest, 0))
    };
  }

  // Standard Amortization calculation
  if (validLoanType === 'Standard Amortization') {
    const rawPayment = periodRate > 0
      ? (principal * periodRate) / (1 - Math.pow(1 + periodRate, -periods))
      : principal / periods;
    const regular = round2(rawPayment);
    let opening = round2(principal);
    let totalInterest = 0;
    let total = 0;

    for (let i = 1; i <= periods; i++) {
      const interest = round2(opening * periodRate);
      const last = i === periods;
      const amount = last ? round2(opening + interest) : regular;
      const principalPart = last ? round2(opening) : round2(Math.min(opening, Math.max(0, amount - interest)));
      const ending = round2(Math.max(0, opening - principalPart));

      rows.push({
        n: i,
        due: dueFor(i),
        beginningBalance: opening,
        amount,
        principal: principalPart,
        interest,
        paid: 0,
        paidPrincipal: 0,
        paidInterest: 0,
        remaining: amount,
        endingBalance: ending
      });

      opening = ending;
      totalInterest = round2(totalInterest + interest);
      total = round2(total + amount);
    }

    return {
      rows,
      months,
      periods,
      total: round2(total),
      collection: rows[0]?.amount || 0,
      dueDate,
      loanType: validLoanType,
      totalInterest: round2(totalInterest)
    };
  }

  // Diminishing / Equal Principal
  const principalUnit = round2(principal / periods);
  let opening = round2(principal);
  let totalInterest = 0;
  let total = 0;

  for (let i = 1; i <= periods; i++) {
    const interest = round2(opening * periodRate);
    const principalPart = i === periods ? round2(opening) : round2(Math.min(principalUnit, opening));
    const amount = round2(principalPart + interest);
    const ending = round2(Math.max(0, opening - principalPart));

    rows.push({
      n: i,
      due: dueFor(i),
      beginningBalance: opening,
      amount,
      principal: principalPart,
      interest,
      paid: 0,
      paidPrincipal: 0,
      paidInterest: 0,
      remaining: amount,
      endingBalance: ending
    });

    opening = ending;
    totalInterest = round2(totalInterest + interest);
    total = round2(total + amount);
  }

  return {
    rows,
    months,
    periods,
    total: round2(total),
    collection: rows[0]?.amount || 0,
    dueDate,
    loanType: validLoanType,
    totalInterest: round2(totalInterest)
  };
}

export const schedulePaid = (l: Loan): number => {
  return (l.schedule || []).reduce((s, x) => s + num(x.paid), 0);
};

export const feeOutstanding = (l: Loan): number => {
  return Math.max(0, num(l.fee) - num(l.feePaid));
};

export const total = (l: Loan): number => {
  return (l.schedule || []).reduce((s, x) => s + num(x.amount), 0) + num(l.fee);
};

export const paid = (l: Loan): number => {
  return schedulePaid(l) + num(l.feePaid);
};

export const outstanding = (l: Loan): number => {
  return Math.max(0, total(l) - paid(l));
};

export const due = (l: Loan): string => {
  return (l.schedule || []).find(x => num(x.remaining) > 0.01)?.due || '';
};

export const status = (l: Loan): string => {
  if (!l) return '';
  if (l.approvalStatus === 'Pending') return 'Pending Approval';
  if (l.approvalStatus === 'Rejected' || l.status === 'Rejected') return 'Rejected';
  if (l.status === 'Restructured') return 'Restructured';
  if (outstanding(l) <= 0.01) return 'Paid';
  if ((l.schedule || []).some(x => x.due < today() && num(x.remaining) > 0.01)) return 'Overdue';
  return 'Active';
};

export const loanIsCurrent = (l: Loan): boolean => {
  if (!l || l.approvalStatus === 'Rejected' || l.status === 'Rejected' || l.status === 'Paid' || l.status === 'Restructured') return false;
  if (l.approvalStatus === 'Pending') return true;
  return (l.approvalStatus || 'Approved') === 'Approved' && outstanding(l) > 0.01;
};

export const borrowerCurrentLoans = (db: Database, borrowerId: string, excludeLoanId = ''): Loan[] => {
  return db.loans.filter(l => l.id !== excludeLoanId && l.borrowerId === borrowerId && loanIsCurrent(l));
};

export const borrowerLoanHistory = (db: Database, borrowerId: string, excludeLoanId = ''): Loan[] => {
  return db.loans.filter(l => l.id !== excludeLoanId && l.borrowerId === borrowerId && l.approvalStatus !== 'Rejected');
};

export const pendingRenewalForBorrower = (db: Database, borrowerId: string, excludeId = ''): RenewalRequest | undefined => {
  return db.renewalRequests.find(r => r.id !== excludeId && r.borrowerId === borrowerId && r.status === 'Pending');
};

export const paymentInterest = (p: Payment, db?: Database): number => {
  if (!p) return 0;
  if (Number.isFinite(Number(p.interestCollected))) return round2(p.interestCollected || 0);

  const l = db?.loans.find(x => x.id === p.loanId);
  const alloc = p.allocations?.schedule;

  if (l && Array.isArray(alloc) && alloc.length) {
    let interest = 0;
    for (const a of alloc) {
      const row = (l.schedule || []).find(x => num(x.n) === num(a.n));
      const amount = num(a.amount);
      if (row && num(row.amount) > 0) {
        interest += amount * (num(row.interest) / num(row.amount));
      }
    }
    return round2(Math.min(num(p.amount), interest));
  }

  if (l) {
    const st = (l.schedule || []).reduce((sum, x) => sum + num(x.amount), 0);
    const si = (l.schedule || []).reduce((sum, x) => sum + num(x.interest), 0);
    return st > 0 ? round2(num(p.amount) * (si / st)) : 0;
  }
  return 0;
};

export const paymentPrincipal = (p: Payment, db?: Database): number => {
  return round2(Math.max(0, num(p?.amount) - paymentInterest(p, db)));
};

// Financial summary metrics
export const capitalAdded = (db: Database): number => {
  return db.capital.reduce((sum, x) => sum + (x.type === 'Add' ? num(x.amount) : 0), 0);
};

export const capitalWithdrawn = (db: Database): number => {
  return db.capital.reduce((sum, x) => sum + (x.type === 'Withdraw' ? num(x.amount) : 0), 0);
};

export const cashCapitalAdded = (db: Database): number => {
  return db.capital.reduce((sum, x) => sum + (x.type === 'Add' && isCashMethod(x.method) ? num(x.amount) : 0), 0);
};

export const cashCapitalWithdrawn = (db: Database): number => {
  return db.capital.reduce((sum, x) => sum + (x.type === 'Withdraw' && isCashMethod(x.method) ? num(x.amount) : 0), 0);
};

export const loanReleasedTotal = (db: Database): number => {
  return db.loans.reduce((sum, l) => sum + ((l.approvalStatus === 'Approved' && !l.restructureFrom) ? num(l.principal) : 0), 0);
};

export const cashLoanReleasedTotal = (db: Database): number => {
  return db.loans.reduce((sum, l) => sum + ((l.approvalStatus === 'Approved' && !l.restructureFrom && l.cashDisbursed !== false && isCashMethod(l.disbursementMethod)) ? num(l.principal) : 0), 0);
};

export const collectionsTotal = (db: Database): number => {
  return db.payments.reduce((sum, p) => sum + num(p.amount), 0);
};

export const cashCollectionsTotal = (db: Database): number => {
  return db.payments.reduce((sum, p) => sum + (isCashMethod(p.method) ? num(p.amount) : 0), 0);
};

export const cashExpenseTotal = (db: Database): number => {
  return db.expenses.reduce((sum, x) => sum + (x.approvalStatus === 'Approved' && isCashMethod(x.paymentMethod) ? num(x.amount) : 0), 0);
};

export const systemCashOnHand = (db: Database): number => {
  return round2(cashCapitalAdded(db) + cashCollectionsTotal(db) - cashLoanReleasedTotal(db) - cashCapitalWithdrawn(db) - cashExpenseTotal(db));
};

export const principalCollectedTotal = (db: Database): number => {
  return db.payments.reduce((sum, p) => sum + paymentPrincipal(p, db), 0);
};

export const interestCollectedTotal = (db: Database): number => {
  return db.payments.reduce((sum, p) => sum + paymentInterest(p, db), 0);
};

export const expenseTotal = (db: Database): number => {
  return db.expenses.reduce((sum, x) => sum + (x.approvalStatus === 'Approved' ? num(x.amount) : 0), 0);
};

export const expenseThisMonth = (db: Database): number => {
  const m = today().slice(0, 7);
  return db.expenses.filter(x => x.approvalStatus === 'Approved' && String(x.date || '').slice(0, 7) === m).reduce((sum, x) => sum + num(x.amount), 0);
};

export const grossIncome = (db: Database): number => {
  return round2(interestCollectedTotal(db));
};

export const netProfit = (db: Database): number => {
  return round2(grossIncome(db) - expenseTotal(db));
};

export const netCashFlow = (db: Database): number => {
  return round2(cashCapitalAdded(db) + cashCollectionsTotal(db) - cashLoanReleasedTotal(db) - cashCapitalWithdrawn(db) - cashExpenseTotal(db));
};

export const availableCapital = (db: Database): number => {
  return systemCashOnHand(db);
};

export const financialStatus = (db: Database): string => {
  const n = netProfit(db);
  return n > 0 ? 'Profit' : n < 0 ? 'Loss' : 'Break-even';
};

export const effectiveCollectorIdForBorrower = (db: Database, b?: Borrower | null): string => {
  if (!b) return '';
  if (b.collectorId && db.collectors.some(c => c.id === b.collectorId)) return b.collectorId;
  const areaCollector = b.areaId ? db.collectors.find(c => c.areaId === b.areaId) : null;
  return areaCollector?.id || '';
};

export const ensureLoanCollectionAssignment = (l: Loan, db?: Database): string => {
  if (!l) return '';
  if (!db) return l.collectorId || '';
  const b = db.borrowers.find(x => x.id === l.borrowerId);
  const cid = effectiveCollectorIdForBorrower(db, b) || l.collectorId || '';
  if (b && cid) {
    if (!b.collectorId) b.collectorId = cid;
    if (l.collectorId !== cid) l.collectorId = cid;
  }
  return cid;
};

export const collectionAssignedCollector = (db: Database, l: Loan): string => {
  const b = db.borrowers.find(x => x.id === l.borrowerId);
  return effectiveCollectorIdForBorrower(db, b) || l?.collectorId || '';
};

export const collectionLoanState = (l: Loan, asOf: string): 'Active' | 'Overdue' | 'Paid' => {
  if (!l || outstanding(l) <= 0.01) return 'Paid';
  const rows = l.schedule || [];
  const hasOverdue = rows.some(x => x.due < asOf && num(x.remaining) > 0.01);
  return hasOverdue ? 'Overdue' : 'Active';
};

export const nextOutstandingSchedule = (l: Loan, asOf: string): ScheduleItem | null => {
  const rows = (l?.schedule || []).filter(x => num(x.remaining) > 0.01).sort((a, b) => String(a.due).localeCompare(String(b.due)));
  if (!rows.length) return null;
  const overdueRow = rows.find(x => x.due < asOf);
  return overdueRow || rows.find(x => x.due >= asOf) || rows[0];
};

export const collectionDueAmount = (l: Loan, asOf: string): number => {
  if (!l) return 0;
  const rows = (l.schedule || []).filter(x => num(x.remaining) > 0.01);
  const arrears = rows.filter(x => String(x.due || '') <= String(asOf)).reduce((s, x) => s + num(x.remaining), 0);
  if (arrears > 0.01) return round2(arrears);
  const next = rows.slice().sort((a, b) => String(a.due).localeCompare(String(b.due)))[0];
  return round2(next?.amount || 0);
};

export const collectionCustomerRows = (db: Database, cid: string, asOf: string): CollectionCustomerRow[] => {
  const scope = String(cid || 'ALL');
  const borrowersById = new Map(db.borrowers.map(b => [String(b.id), b]));
  const grouped = new Map<string, { b: Borrower; loans: Loan[]; expected: number; balance: number; arrears: number }>();

  for (const l of db.loans) {
    if (!loanIsCurrent(l)) continue;
    const b = borrowersById.get(String(l.borrowerId || ''));
    if (!b) continue;

    const derivedCollector = collectionAssignedCollector(db, l);
    const areaMatch = scope !== 'ALL' && !!b.areaId && db.collectors.some(c => c.id === scope && c.areaId === b.areaId);

    if (scope !== 'ALL' && derivedCollector !== scope && l.collectorId !== scope && b.collectorId !== scope && !areaMatch) {
      continue;
    }

    const bid = String(b.id);
    const g = grouped.get(bid) || { b, loans: [], expected: 0, balance: 0, arrears: 0 };
    const rows = (l.schedule || []).filter(x => num(x.remaining) > 0.01);
    const arrears = rows.filter(x => String(x.due || '') <= String(asOf)).reduce((s, x) => s + num(x.remaining), 0);

    g.loans.push(l);
    g.balance = round2(g.balance + outstanding(l));
    g.arrears = round2(g.arrears + Math.max(0, arrears));
    g.expected = round2(g.expected + collectionDueAmount(l, asOf));

    grouped.set(bid, g);
  }

  return [...grouped.values()].map(g => {
    const overdue = g.loans.some(l => collectionLoanState(l, asOf) === 'Overdue');
    const active = g.loans.some(l => collectionLoanState(l, asOf) === 'Active');
    const nextList = g.loans.map(l => nextOutstandingSchedule(l, asOf)).filter((x): x is ScheduleItem => x !== null).sort((a, b) => String(a.due).localeCompare(String(b.due)));
    const first = nextList[0] || null;
    const st: 'Active' | 'Overdue' | 'Paid' = overdue ? 'Overdue' : active ? 'Active' : 'Paid';

    return {
      b: g.b,
      loans: g.loans,
      state: st,
      next: first,
      expectedToday: g.expected,
      arrears: g.arrears,
      totalOutstanding: g.balance,
      collectorId: effectiveCollectorIdForBorrower(db, g.b) || g.loans[0]?.collectorId || ''
    };
  }).filter(x => x.loans.length).sort((a, b) => {
    const rank: Record<'Overdue' | 'Active' | 'Paid', number> = { Overdue: 0, Active: 1, Paid: 2 };
    return (rank[a.state] - rank[b.state]) || bname(a.b).localeCompare(bname(b.b));
  });
};

export function performancePeriodBounds(period: string, asOf: string) {
  const d = new Date((asOf || today()) + 'T00:00:00');
  const z = (n: number) => String(n).padStart(2, '0');
  const fmt = (x: Date) => `${x.getFullYear()}-${z(x.getMonth() + 1)}-${z(x.getDate())}`;
  const from = new Date(d);
  let to = new Date(d);

  if (period === 'Weekly') {
    const day = d.getDay() || 7;
    from.setDate(d.getDate() - day + 1);
    to.setDate(from.getDate() + 6);
  } else if (period === 'Semi-monthly') {
    if (d.getDate() <= 15) {
      from.setDate(1);
      to.setDate(15);
    } else {
      from.setDate(16);
      to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    }
  } else if (period === 'Monthly') {
    from.setDate(1);
    to = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  } else if (period === 'Yearly' || period === 'Annual') {
    from.setMonth(0, 1);
    to = new Date(d.getFullYear(), 11, 31);
  } else if (period === 'All-Time' || period === 'Overall') {
    return { from: '1970-01-01', to: '2099-12-31' };
  }

  return { from: fmt(from), to: fmt(to) };
}

export function collectorAutoComputedQuota(c: Collector, period: string, from: string, to: string, db: Database): number {
  if (!c) return 0;
  const collectorId = c.id;
  let scheduledSum = 0;

  for (const l of db.loans) {
    if (!loanIsCurrent(l)) continue;
    const b = db.borrowers.find(x => x.id === l.borrowerId);
    const isAssigned = (l.collectorId === collectorId) || (b && b.collectorId === collectorId) || (b && b.areaId === c.areaId);
    if (!isAssigned) continue;

    const sched = l.schedule || [];
    for (const s of sched) {
      if (s.due >= from && s.due <= to && num(s.remaining) > 0.01) {
        scheduledSum += num(s.remaining);
      }
    }
  }

  if (scheduledSum > 0.01) {
    return round2(scheduledSum);
  }

  // If no schedule items specifically within [from, to], compute from expected active client daily dues
  const clientRows = collectionCustomerRows(db, c.id, to);
  const expectedDaily = round2(clientRows.reduce((s, x) => s + num(x.expectedToday), 0));

  if (period === 'Daily') return expectedDaily;
  if (period === 'Weekly') return round2(expectedDaily * 6);
  if (period === 'Semi-monthly') return round2(expectedDaily * 13);
  if (period === 'Monthly') return round2(expectedDaily * 26);

  return expectedDaily;
}

export function collectorQuotaValue(c: Collector, period: string, from?: string, to?: string, db?: Database): number {
  if (!c) return 0;

  // 1. Primary: Dynamically compute automatic quota from assigned active loans
  if (db && from && to) {
    const autoQuota = collectorAutoComputedQuota(c, period, from, to, db);
    if (autoQuota > 0.01) {
      return autoQuota;
    }
  }

  // 2. Secondary fallback to manual target if set
  if (period === 'Daily') return Math.max(0, num(c.dailyQuota));
  if (period === 'Weekly') return Math.max(0, num(c.weeklyQuota) || num(c.dailyQuota) * 7);
  if (period === 'Semi-monthly') return Math.max(0, num(c.semiMonthlyQuota) || (num(c.monthlyQuota) > 0 ? num(c.monthlyQuota) / 2 : num(c.dailyQuota) * 15));
  return Math.max(0, num(c.monthlyQuota) || num(c.dailyQuota) * 30);
}

export function collectorPerformanceRow(c: Collector, period: string, from: string, to: string, db: Database) {
  const collected = round2(db.payments.filter(p => p.collectorId === c.id && p.date >= from && p.date <= to).reduce((s, p) => s + num(p.amount), 0));
  const quota = round2(collectorQuotaValue(c, period, from, to, db));
  const achievement = quota > 0 ? (collected / quota) * 100 : 0;
  const variance = round2(quota - collected);
  const clients = collectionCustomerRows(db, c.id, to);
  const active = clients.filter(x => x.state === 'Active').length;
  const overdue = clients.filter(x => x.state === 'Overdue').length;
  const autoQuota = round2(collectorAutoComputedQuota(c, period, from, to, db));
  const isAuto = quota > 0 && quota === autoQuota;
  return { c, quota, collected, achievement, variance, active, overdue, clients: clients.length, from, to, isAuto };
}

export const dataIntegrityReport = (db: Database): IntegrityReport => {
  const issues: IntegrityIssue[] = [];
  const push = (type: string, detail: string) => issues.push({ type, detail });

  const borrowerMap = new Map(db.borrowers.map(b => [String(b?.id || ''), b]));
  const loanMap = new Map(db.loans.map(l => [String(l?.id || ''), l]));

  const checkIds = <T extends { id?: string }>(rows: T[], label: string) => {
    const m = new Map<string, T[]>();
    for (const r of rows) {
      const id = String(r?.id || '').trim();
      if (!id) {
        push('Missing ID', `${label} record without ID`);
        continue;
      }
      if (!m.has(id)) m.set(id, []);
      m.get(id)!.push(r);
    }
    for (const [id, arr] of m) {
      if (arr.length > 1) push('Duplicate ID', `${label} ID ${id} appears ${arr.length} times`);
    }
  };

  checkIds(db.borrowers, 'Borrower');
  checkIds(db.loans, 'Loan');
  checkIds(db.payments, 'Payment');
  checkIds(db.renewalRequests, 'Renewal Request');

  db.loans.forEach(l => {
    if (!['Flat', 'Standard Amortization', 'Diminishing'].includes(String(l?.loanType || l?.method || 'Flat'))) {
      push('Invalid Loan Type', `Loan ${l?.loanNo || l?.id || '—'} has an unsupported type.`);
    }
  });

  const names = new Map<string, Borrower[]>();
  for (const b of db.borrowers) {
    const k = borrowerNameKey(b);
    if (!k || k === '|') continue;
    if (!names.has(k)) names.set(k, []);
    names.get(k)!.push(b);
  }
  for (const [, arr] of names) {
    if (arr.length > 1) push('Duplicate Borrower Name', arr.map(b => `${bname(b)} [${b.id}]`).join(' • '));
  }

  const loanNos = new Map<string, Loan[]>();
  for (const l of db.loans) {
    const n = String(l?.loanNo || '').trim().toUpperCase();
    if (!n) push('Missing Loan No', String(l?.id || 'Unknown'));
    else {
      if (!loanNos.has(n)) loanNos.set(n, []);
      loanNos.get(n)!.push(l);
    }
  }
  for (const [n, arr] of loanNos) {
    if (arr.length > 1) push('Duplicate Loan No', `${n} appears ${arr.length} times`);
  }

  for (const l of db.loans) {
    const b = borrowerMap.get(String(l?.borrowerId || ''));
    if (!b) push('Orphan Loan', `${String(l.loanNo || l.id)} → borrower ${String(l.borrowerId || 'MISSING')} not found`);
    else if (l.collectorId !== b.collectorId) push('Relationship Mismatch', `${String(l.loanNo || l.id)} collector does not match borrower assignment for ${bname(b)}`);
    if (!l.borrowerId) push('Missing Borrower Link', `${String(l.loanNo || l.id)} has no borrowerId`);
  }

  const current = new Map<string, Loan[]>();
  for (const l of db.loans) {
    if (!loanIsCurrent(l)) continue;
    const a = current.get(String(l.borrowerId || '')) || [];
    a.push(l);
    current.set(String(l.borrowerId || ''), a);
  }
  for (const [bid, arr] of current) {
    if (arr.length > 1) push('Multiple Current Loans', `${bname(borrowerMap.get(bid))} has ${arr.length} current loans: ${arr.map(l => l.loanNo).join(', ')}`);
  }

  for (const p of db.payments) {
    const l = loanMap.get(String(p?.loanId || ''));
    const b = borrowerMap.get(String(p?.borrowerId || ''));
    if (!l) push('Orphan Payment', `${String(p.id)} → loan ${String(p.loanId || 'MISSING')} not found`);
    else {
      if (l.borrowerId !== p.borrowerId) push('Payment Relationship Mismatch', `${String(p.loanNo || p.id)} payment borrower link differs from loan borrower`);
      if (!b) push('Payment Borrower Missing', `${String(p.id)} points to missing borrower ${String(p.borrowerId || 'MISSING')}`);
    }
  }

  for (const r of db.renewalRequests) {
    const l = loanMap.get(String(r?.loanId || ''));
    const b = borrowerMap.get(String(r?.borrowerId || ''));
    if (!l) push('Orphan Renewal Request', `${String(r.id)} → loan ${String(r.loanId || 'MISSING')} not found`);
    if (!b) push('Renewal Borrower Missing', `${String(r.id)} → borrower ${String(r.borrowerId || 'MISSING')} not found`);
    if (l && b && l.borrowerId !== b.id) push('Renewal Relationship Mismatch', `${String(r.id)} borrower does not match linked loan`);
    if (l && r.status === 'Pending' && status(l) !== 'Paid') push('Invalid Renewal State', `${String(r.id)} is pending but loan ${l.loanNo} is not Paid`);
  }

  return {
    ok: issues.length === 0,
    issues,
    summary: {
      duplicateBorrowerNames: issues.filter(x => x.type === 'Duplicate Borrower Name').length,
      orphanLoans: issues.filter(x => x.type === 'Orphan Loan').length,
      duplicateLoanIds: issues.filter(x => x.type === 'Duplicate ID' && x.detail.startsWith('Loan')).length,
      duplicateLoanNos: issues.filter(x => x.type === 'Duplicate Loan No').length,
      multipleCurrentLoans: issues.filter(x => x.type === 'Multiple Current Loans').length,
      total: issues.length
    }
  };
};

export async function sha256(text: string): Promise<string> {
  const str = String(text ?? '');
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
      const data = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback if Web Crypto is blocked or fails
  }

  // Pure JS Hash fallback (guaranteed synchronous execution without Web Crypto dependency)
  let h1 = 0xdeadbeef ^ 0, h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  return hex.padStart(16, '0');
}

export function uid(prefix = 'ID'): string {
  const r = (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function')
    ? globalThis.crypto.randomUUID().replaceAll('-', '')
    : Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  return String(prefix || 'ID') + r;
}

export function computeOverduePenalty(
  loan: Loan,
  asOfDate: string,
  settings?: SystemSettings
): { penaltyAmount: number; daysOverdue: number; isEligible: boolean; explanation: string } {
  if (!loan) return { penaltyAmount: 0, daysOverdue: 0, isEligible: false, explanation: 'Walang loan' };
  const bal = outstanding(loan);
  if (bal <= 0.01) return { penaltyAmount: 0, daysOverdue: 0, isEligible: false, explanation: 'Fully paid' };

  const pastDueSchedules = (loan.schedule || []).filter(
    s => s.due < asOfDate && round2(s.remaining) > 0.01
  );

  if (pastDueSchedules.length === 0) {
    return { penaltyAmount: 0, daysOverdue: 0, isEligible: false, explanation: 'On-time / Current' };
  }

  const oldestDueDate = pastDueSchedules[0].due;
  const daysOverdue = Math.max(0, dateDiffDays(oldestDueDate, asOfDate));
  const graceDays = settings?.penaltyGraceDays ?? 0;

  if (daysOverdue <= graceDays) {
    return { penaltyAmount: 0, daysOverdue, isEligible: false, explanation: `Nasa loob ng grace period (${daysOverdue} / ${graceDays} days)` };
  }

  const penaltyType = settings?.penaltyType || 'Flat';
  const penaltyRate = settings?.penaltyRate ?? 50; // Default flat 50 or 2%

  let penalty = 0;
  if (penaltyType === 'Flat') {
    penalty = penaltyRate * pastDueSchedules.length;
  } else {
    const arrears = pastDueSchedules.reduce((s, x) => s + num(x.remaining), 0);
    penalty = round2((arrears * (penaltyRate / 100)));
  }

  return {
    penaltyAmount: penalty,
    daysOverdue,
    isEligible: true,
    explanation: `${daysOverdue} araw overdue (${pastDueSchedules.length} missed schedules, ${penaltyType === 'Flat' ? `₱${penaltyRate} bawat missed` : `${penaltyRate}% ng arrears`})`
  };
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (val: string | number) => {
    const str = String(val ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map(row => row.map(escapeCell).join(','))
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportLoansToCSV(db: Database) {
  const headers = [
    'Loan No',
    'Borrower Name',
    'ID Number',
    'Contact',
    'Area',
    'Collector',
    'Release Date',
    'Due Date',
    'Principal (₱)',
    'Rate (%)',
    'Term (Months)',
    'Frequency',
    'Total Payable (₱)',
    'Current Balance (₱)',
    'Status',
    'Approval Status'
  ];

  const rows = db.loans.map(l => {
    const b = db.borrowers.find(x => x.id === l.borrowerId);
    const c = db.collectors.find(x => x.id === l.collectorId) || (b ? db.collectors.find(x => x.id === b.collectorId) : undefined);
    const a = b ? db.areas.find(x => x.id === b.areaId) : undefined;

    return [
      l.loanNo,
      b ? bname(b) : 'Unknown',
      b?.idNo || '',
      b?.contact || '',
      a?.name || '',
      c?.name || 'Unassigned',
      l.date,
      l.dueDate,
      l.principal,
      l.rate,
      l.months,
      l.frequency,
      l.totalPayable,
      outstanding(l),
      status(l),
      l.approvalStatus || 'Approved'
    ];
  });

  downloadCSV(`LOANS_MASTERLIST_${today()}`, headers, rows);
}

export function exportPaymentsToCSV(db: Database) {
  const headers = [
    'Payment ID',
    'Date',
    'Loan No',
    'Borrower Name',
    'Collector',
    'Area',
    'Amount (₱)',
    'Principal Part (₱)',
    'Interest Part (₱)',
    'Channel / Method',
    'Reference / OR No',
    'Remarks'
  ];

  const rows = db.payments.map(p => {
    const c = db.collectors.find(x => x.id === p.collectorId);
    const a = db.areas.find(x => x.id === p.areaId);

    return [
      p.id,
      p.date,
      p.loanNo,
      p.borrowerName,
      c?.name || 'Unassigned',
      a?.name || '',
      p.amount,
      p.principalCollected ?? '',
      p.interestCollected ?? '',
      p.method,
      p.reference || '',
      p.remarks || ''
    ];
  });

  downloadCSV(`COLLECTION_LEDGER_${today()}`, headers, rows);
}

export function exportBorrowersToCSV(db: Database) {
  const headers = [
    'Borrower ID',
    'First Name',
    'Last Name',
    'Full Name',
    'ID Type',
    'ID No',
    'Contact Number',
    'Address',
    'Area',
    'Collector',
    'Co-maker Name',
    'Co-maker Contact',
    'Total Loans Count',
    'Active Loans Count',
    'Total Outstanding Balance (₱)'
  ];

  const rows = db.borrowers.map(b => {
    const c = db.collectors.find(x => x.id === b.collectorId);
    const a = db.areas.find(x => x.id === b.areaId);
    const bLoans = db.loans.filter(l => l.borrowerId === b.id);
    const activeLoans = bLoans.filter(l => outstanding(l) > 0.01 && l.approvalStatus !== 'Rejected');
    const totalBal = bLoans.reduce((s, l) => s + outstanding(l), 0);

    return [
      b.id,
      b.first,
      b.last,
      bname(b),
      b.idType || '',
      b.idNo || '',
      b.contact || '',
      b.address || '',
      a?.name || '',
      c?.name || 'Unassigned',
      b.comaker || '',
      b.comakerContact || '',
      bLoans.length,
      activeLoans.length,
      round2(totalBal)
    ];
  });

  downloadCSV(`BORROWERS_DIRECTORY_${today()}`, headers, rows);
}

