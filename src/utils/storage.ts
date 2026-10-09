import { Database, User, Loan, Borrower, Payment } from '../types';
import defaultLogo from '../assets/images/3d_mascot_logo_1791389838102.jpg';
import {
  today,
  uid,
  num,
  round2,
  schedulePlan,
  outstanding,
  borrowerNameKey,
  effectiveCollectorIdForBorrower,
  ensureLoanCollectionAssignment,
  sha256
} from './calculations';

const KEY = 'SIRTOY_LENDING_PLUS_DB_V2';
export const SESSION = 'SIRTOY_LENDING_PLUS_SESSION_V2';

export const safeStorage = {
  get(k: string): string | null {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string): boolean {
    try {
      localStorage.setItem(k, v);
      return true;
    } catch {
      return false;
    }
  },
  remove(k: string): void {
    try {
      localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }
};

export function seed(): Database {
  return {
    version: 10,
    settings: {
      company: 'LENDING MANAGEMENT SYSTEM, INC.',
      logoUrl: defaultLogo,
      diskFolderName: '',
      diskFolderConfigured: false,
      diskDatabaseVersion: 1,
      fakeDataRemoved: true,
      integrityRulesVersion: 5
    },
    areas: [],
    collectors: [],
    borrowers: [],
    capital: [],
    expenses: [],
    loans: [],
    payments: [],
    audit: [],
    cashReconciliations: [],
    renewalRequests: [],
    users: [
      {
        id: 'U_DEV',
        name: 'System Developer',
        username: 'degshit',
        passwordHash: 'degshit66',
        role: 'Developer',
        collectorId: '',
        status: 'Active'
      },
      {
        id: 'U1',
        name: 'System Administrator',
        username: 'admin',
        passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // 'admin123'
        role: 'Admin',
        collectorId: '',
        status: 'Active'
      }
    ]
  };
}

export function normalizeLoan(l: Partial<Loan>): Loan {
  const x = l && typeof l === 'object' ? l : {};
  const id = x.id || uid('L');
  const loanNo = x.loanNo || 'LN-' + String(Date.now()).slice(-5);
  const borrowerId = x.borrowerId || '';
  const collectorId = x.collectorId || '';
  const principal = Math.max(0, num(x.principal));
  const rate = Math.max(0, num(x.rate));
  const term = Math.max(0, Math.floor(num(x.term)));
  const frequency = x.frequency || 'Monthly';

  const rawType = String(x.loanType || x.method || 'Flat').trim();
  const loanType = ['Flat', 'Standard Amortization', 'Diminishing'].includes(rawType) ? (rawType as Loan['loanType']) : 'Flat';
  const method = loanType;

  const date = x.date || today();
  const fee = Math.max(0, num(x.fee));
  const feePaid = round2(Math.min(Math.max(0, num(x.feePaid)), fee));
  const status = x.status || 'Active';
  const ref = x.ref || '';
  const remarks = x.remarks || '';
  const restructureFrom = x.restructureFrom || '';
  const renewedFrom = x.renewedFrom || '';
  const approvalStatus = x.approvalStatus || 'Approved';
  const approvedBy = x.approvedBy || '';
  const approvedAt = x.approvedAt || '';
  const createdBy = x.createdBy || '';
  const disbursementMethod = x.disbursementMethod || 'Cash';
  const cashDisbursed = x.cashDisbursed !== undefined ? (x.cashDisbursed !== false) : (disbursementMethod === 'Cash' && !restructureFrom);
  const renewalRequestId = x.renewalRequestId || '';
  const createdAt = x.createdAt || new Date().toISOString();

  const months = Math.max(1, Math.floor(num(x.months) || num(x.term) || 1));
  const plan = schedulePlan(principal, rate, months, frequency, date, loanType);

  const dueDate = x.dueDate || ((Array.isArray(x.schedule) && x.schedule.length) ? x.schedule[x.schedule.length - 1].due : plan.dueDate);

  let schedule = (Array.isArray(x.schedule) && x.schedule.length && num(x.dailyCollection)) ? x.schedule : plan.rows;

  schedule = schedule.map((s, i) => {
    const amount = Math.max(0, num(s?.amount));
    const paid = round2(Math.min(Math.max(0, num(s?.paid)), amount));
    const ratio = amount > 0 ? num(s?.principal) / amount : 0;
    const pp = round2(Math.min(Math.max(0, num(s?.paidPrincipal ?? paid * ratio)), num(s?.principal)));
    const pi = round2(Math.min(Math.max(0, num(s?.paidInterest ?? paid - pp)), num(s?.interest)));
    return {
      ...s,
      n: s.n || i + 1,
      paid,
      paidPrincipal: pp,
      paidInterest: pi,
      remaining: round2(Math.max(0, amount - paid)),
      beginningBalance: round2(s?.beginningBalance ?? 0),
      endingBalance: round2(s?.endingBalance ?? 0)
    };
  });

  const dailyCollection = Math.max(0, num(x.dailyCollection) || plan.collection);
  const totalPayable = round2(plan.total + fee);

  return {
    id,
    loanNo,
    borrowerId,
    collectorId,
    principal,
    rate,
    months,
    term: plan.periods || term,
    frequency,
    loanType,
    method,
    date,
    dueDate,
    dailyCollection,
    totalPayable,
    disbursementMethod,
    fee,
    feePaid,
    ref,
    remarks,
    status,
    approvalStatus,
    approvedBy,
    approvedAt,
    createdBy,
    cashDisbursed,
    schedule,
    restructureFrom,
    renewedFrom,
    renewalRequestId,
    createdAt
  };
}

export function ensureDB(raw: unknown): Database {
  const s = seed();
  const d = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const db: Database = { ...s, ...(d as unknown as Database) };

  db.version = 10;
  db.settings = { ...s.settings, ...(d.settings as Database['settings'] || {}) };
  if (!db.settings.logoUrl || db.settings.logoUrl === '/logo.png' || db.settings.logoUrl.startsWith('/src/assets/')) {
    db.settings.logoUrl = defaultLogo;
  }
  db.settings.integrityRulesVersion = 5;

  if (!Array.isArray(db.areas)) db.areas = [];
  if (!Array.isArray(db.collectors)) db.collectors = [];
  if (!Array.isArray(db.borrowers)) db.borrowers = [];
  if (!Array.isArray(db.capital)) db.capital = [];
  if (!Array.isArray(db.expenses)) db.expenses = [];
  if (!Array.isArray(db.loans)) db.loans = [];
  if (!Array.isArray(db.payments)) db.payments = [];
  if (!Array.isArray(db.audit)) db.audit = [];
  if (!Array.isArray(db.cashReconciliations)) db.cashReconciliations = [];
  if (!Array.isArray(db.renewalRequests)) db.renewalRequests = [];
  if (!Array.isArray(db.users)) db.users = [];

  db.areas = db.areas.map(a => ({
    id: a?.id || uid('A'),
    name: a?.name || 'Unnamed Area',
    code: a?.code || ''
  }));

  db.collectors = db.collectors.map(c => {
    const daily = Math.max(0, num(c?.dailyQuota));
    const monthly = Math.max(0, num(c?.monthlyQuota));
    const weekly = Math.max(0, num(c?.weeklyQuota) || daily * 7);
    const semi = Math.max(0, num(c?.semiMonthlyQuota) || (monthly > 0 ? monthly / 2 : daily * 15));
    return {
      id: c?.id || uid('C'),
      name: c?.name || 'Unnamed Collector',
      areaId: c?.areaId || '',
      dailyQuota: daily,
      weeklyQuota: weekly,
      semiMonthlyQuota: semi,
      monthlyQuota: monthly > 0 ? monthly : daily * 30
    };
  });

  db.borrowers = db.borrowers.map(b => ({
    ...b,
    id: b?.id || uid('B'),
    first: b?.first || '',
    last: b?.last || '',
    contact: b?.contact || '',
    email: b?.email || '',
    address: b?.address || '',
    areaId: b?.areaId || '',
    collectorId: b?.collectorId || '',
    idType: b?.idType || '',
    idNo: b?.idNo || '',
    idImage: b?.idImage || '',
    idImageName: b?.idImageName || '',
    comaker: b?.comaker || '',
    comakerContact: b?.comakerContact || '',
    notes: b?.notes || ''
  }));

  db.loans = db.loans.map(normalizeLoan);

  db.capital = db.capital.map(x => ({
    ...x,
    id: x?.id || uid('K'),
    date: x?.date || today(),
    type: x?.type === 'Withdraw' ? 'Withdraw' : 'Add',
    amount: Math.max(0, num(x?.amount)),
    method: x?.method || 'Cash',
    description: String(x?.description || ''),
    user: String(x?.user || 'system')
  }));

  db.expenses = db.expenses.map(x => ({
    ...x,
    id: x?.id || uid('E'),
    date: x?.date || today(),
    category: String(x?.category || 'General'),
    description: String(x?.description || ''),
    amount: Math.max(0, num(x?.amount)),
    paymentMethod: x?.paymentMethod || 'Cash',
    user: String(x?.user || 'system'),
    approvalStatus: x?.approvalStatus || 'Approved',
    approvedBy: String(x?.approvedBy || ''),
    approvedAt: String(x?.approvedAt || '')
  }));

  db.cashReconciliations = db.cashReconciliations.map(x => ({
    ...x,
    id: x?.id || uid('R'),
    date: x?.date || today(),
    systemCash: round2(x?.systemCash),
    actualCash: round2(x?.actualCash),
    variance: round2(num(x?.actualCash) - num(x?.systemCash)),
    notes: String(x?.notes || ''),
    user: String(x?.user || 'system')
  }));

  db.renewalRequests = db.renewalRequests.map(x => ({
    ...x,
    id: x?.id || uid('RR'),
    loanId: x?.loanId || '',
    borrowerId: x?.borrowerId || '',
    status: x?.status || 'Pending',
    requestedBy: String(x?.requestedBy || 'system'),
    requestedAt: x?.requestedAt || new Date().toISOString(),
    processedBy: String(x?.processedBy || ''),
    processedAt: String(x?.processedAt || '')
  }));

  db.payments = db.payments.map(p => ({
    ...p,
    id: p?.id || uid('P'),
    date: p?.date || today(),
    loanId: p?.loanId || '',
    loanNo: p?.loanNo || '',
    borrowerId: p?.borrowerId || '',
    borrowerName: p?.borrowerName || '',
    collectorId: p?.collectorId || '',
    areaId: p?.areaId || '',
    amount: round2(p?.amount),
    method: p?.method || 'Cash',
    reference: p?.reference || '',
    remarks: p?.remarks || '',
    allocations: p?.allocations || null
  }));

  db.audit = db.audit.map(a => ({
    ...a,
    id: a?.id || uid('AU'),
    at: a?.at || new Date().toISOString(),
    user: a?.user || 'system',
    action: a?.action || '',
    module: a?.module || '',
    details: a?.details ?? ''
  }));

  db.users = db.users.map(u => ({
    ...u,
    id: u?.id || uid('U'),
    name: u?.name || '',
    username: String(u?.username || ''),
    passwordHash: String(u?.passwordHash || ''),
    role: u?.role,
    collectorId: u?.collectorId || '',
    status: u?.status || 'Active'
  }));

  db.users = db.users.filter(u => u.role === 'Developer' || u.role === 'Admin' || u.role === 'Staff');

  let devUser = db.users.find(u => String(u.username || '').trim().toLowerCase() === 'degshit' || String(u.username || '').trim().toLowerCase() === 'developer');
  if (!devUser) {
    devUser = {
      id: 'U_DEV',
      name: 'System Developer',
      username: 'degshit',
      passwordHash: 'degshit66',
      role: 'Developer',
      collectorId: '',
      status: 'Active'
    };
    db.users.unshift(devUser);
  } else {
    devUser.username = 'degshit';
    devUser.role = 'Developer';
    devUser.status = 'Active';
    devUser.passwordHash = 'degshit66';
  }

  let adminUser = db.users.find(u => String(u.username || '').trim().toLowerCase() === 'admin');
  if (!adminUser) {
    adminUser = {
      id: 'U1',
      name: 'System Administrator',
      username: 'admin',
      passwordHash: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // 'admin123'
      role: 'Admin',
      collectorId: '',
      status: 'Active'
    };
    db.users.push(adminUser);
  } else {
    adminUser.status = 'Active';
    if (!adminUser.passwordHash) {
      adminUser.passwordHash = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    }
  }

  const seen = new Set<string>();
  db.users = db.users.filter(u => {
    const k = u.username.trim().toLowerCase();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  return db;
}

export function normalizeSecurity(db: Database): void {
  for (const b of db.borrowers) {
    if (!b.collectorId && b.areaId) {
      const c = db.collectors.find(x => x.areaId === b.areaId);
      if (c) b.collectorId = c.id;
    }
  }

  for (const l of db.loans) {
    const b = db.borrowers.find(x => x.id === l.borrowerId);
    if (!b) continue;
    if (b.collectorId && l.collectorId !== b.collectorId) {
      l.collectorId = b.collectorId;
    } else if (!l.collectorId && b.areaId) {
      const c = db.collectors.find(x => x.areaId === b.areaId);
      if (c) {
        b.collectorId = c.id;
        l.collectorId = c.id;
      }
    }
  }
}

export function loadDB(): Database {
  let raw: unknown = null;
  try {
    const txt = safeStorage.get(KEY);
    if (txt) raw = JSON.parse(txt);
  } catch {
    raw = null;
  }
  const db = ensureDB(raw || seed());
  normalizeSecurity(db);
  return db;
}

export function saveDB(db: Database): boolean {
  try {
    db.settings.lastLocalSaveAt = new Date().toISOString();
    return safeStorage.set(KEY, JSON.stringify(db));
  } catch {
    return false;
  }
}

export function audit(db: Database, user: string, action: string, module: string, details: string | Record<string, unknown> = ''): void {
  db.audit.unshift({
    id: uid('AU'),
    at: new Date().toISOString(),
    user: user || 'system',
    action,
    module,
    details
  });
}
