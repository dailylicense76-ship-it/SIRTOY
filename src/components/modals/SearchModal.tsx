import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { bname, money, outstanding, datef, status, today } from '../../utils/calculations';
import {
  X,
  Search,
  User,
  FileText,
  CreditCard,
  Plus,
  MapPin,
  UserCheck,
  Calculator,
  ArrowRight,
  TrendingUp,
  Download,
  Receipt,
  Sparkles,
  Command
} from 'lucide-react';

type SearchCategory = 'all' | 'borrowers' | 'loans' | 'payments' | 'actions';

export const SearchModal: React.FC = () => {
  const { db, activeModal, closeModal, go, openModal, exportBackup, showToast } = useApp();
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeModal === 'searchModal') {
      setQuery('');
      setActiveTab('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [activeModal]);

  if (activeModal !== 'searchModal') return null;

  const q = query.trim().toLowerCase();

  // 1. Matched Borrowers
  const matchedBorrowers = useMemo(() => {
    if (!q) return [];
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    return db.borrowers
      .filter(b => {
        const full = `${bname(b)} ${b.contact} ${b.idNo} ${b.id} ${b.address} ${b.email || ''}`.toLowerCase();
        const bDigits = (b.idNo || b.id || '').replace(/\D/g, '');
        return full.includes(q) || (cleanQ.length > 0 && bDigits.endsWith(cleanQ));
      })
      .slice(0, 8);
  }, [db.borrowers, q]);

  // 2. Matched Loans
  const matchedLoans = useMemo(() => {
    if (!q) return [];
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    return db.loans
      .filter(l => {
        const b = db.borrowers.find(x => x.id === l.borrowerId);
        const full = `${l.loanNo} ${b ? bname(b) : ''} ${l.loanType} ${l.id}`.toLowerCase();
        const loanDigits = (l.loanNo || '').replace(/\D/g, '');
        return full.includes(q) || (cleanQ.length > 0 && loanDigits.endsWith(cleanQ));
      })
      .slice(0, 8);
  }, [db.loans, db.borrowers, q]);

  // 3. Matched Payments
  const matchedPayments = useMemo(() => {
    if (!q) return [];
    return db.payments
      .filter(p => {
        const full = `${p.loanNo} ${p.borrowerName} ${p.reference || ''} ${p.remarks || ''}`.toLowerCase();
        return full.includes(q);
      })
      .slice(0, 6);
  }, [db.payments, q]);

  // 4. Matched Areas
  const matchedAreas = useMemo(() => {
    if (!q) return [];
    return db.areas
      .filter(a => `${a.name} ${a.code || ''}`.toLowerCase().includes(q))
      .slice(0, 4);
  }, [db.areas, q]);

  // 5. Matched Collectors
  const matchedCollectors = useMemo(() => {
    if (!q) return [];
    return db.collectors
      .filter(c => `${c.name}`.toLowerCase().includes(q))
      .slice(0, 4);
  }, [db.collectors, q]);

  // 6. System Quick Actions
  const systemActions = [
    {
      id: 'act-new-loan',
      title: 'New Loan Application / Release',
      category: 'Loan',
      icon: Plus,
      keywords: 'new loan pautang release apply dagdag utang',
      action: () => {
        closeModal();
        openModal('loanModal');
      }
    },
    {
      id: 'act-new-borrower',
      title: 'Register New Borrower / Client',
      category: 'Borrower',
      icon: User,
      keywords: 'add borrower bagong kliyente register customer create',
      action: () => {
        closeModal();
        openModal('borrowerModal');
      }
    },
    {
      id: 'act-record-payment',
      title: 'Post Customer Payment / Remittance',
      category: 'Payment',
      icon: CreditCard,
      keywords: 'record payment bayad hulog collection remit resibo',
      action: () => {
        closeModal();
        openModal('paymentModal');
      }
    },
    {
      id: 'act-cash-counter',
      title: 'Cash Denomination Counter (Money Breakdown)',
      category: 'Cash',
      icon: Calculator,
      keywords: 'cash counter denomination barya bills breakdown bilang pera kaha',
      action: () => {
        closeModal();
        openModal('denominationModal');
      }
    },
    {
      id: 'act-daily-collections',
      title: 'Open Daily Collection Sheet',
      category: 'Collection',
      icon: Receipt,
      keywords: 'daily collections sheet rota arawang singilin collector',
      action: () => {
        closeModal();
        go('collections');
      }
    },
    {
      id: 'act-performance',
      title: 'Collector Performance & Auto Quotas',
      category: 'Analytics',
      icon: TrendingUp,
      keywords: 'collector performance quota achievement targets analytics',
      action: () => {
        closeModal();
        go('collectorPerformance');
      }
    },
    {
      id: 'act-backup',
      title: 'Export Full Database Backup (JSON)',
      category: 'System',
      icon: Download,
      keywords: 'backup export json download copy database save',
      action: () => {
        closeModal();
        exportBackup();
        showToast('Database exported successfully!', 'ok');
      }
    }
  ];

  const matchedActions = useMemo(() => {
    if (!q) return systemActions;
    return systemActions.filter(a => `${a.title} ${a.keywords}`.toLowerCase().includes(q));
  }, [q]);

  const totalResults =
    (activeTab === 'all' || activeTab === 'borrowers' ? matchedBorrowers.length : 0) +
    (activeTab === 'all' || activeTab === 'loans' ? matchedLoans.length : 0) +
    (activeTab === 'all' || activeTab === 'payments' ? matchedPayments.length : 0) +
    (activeTab === 'all' || activeTab === 'actions' ? matchedActions.length : 0) +
    (activeTab === 'all' ? matchedAreas.length + matchedCollectors.length : 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/70 backdrop-blur-md p-3 sm:p-6 overflow-y-auto pt-[8vh]"
      onClick={e => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[82vh] animate-3d-modal">
        {/* Spotlight Search Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 bg-white">
          <Search className="w-5 h-5 text-blue-600 flex-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search borrower name, loan #, receipt ref, area, or command..."
            className="w-full bg-transparent border-none text-sm sm:text-base font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-semibold"
            >
              Clear
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-300 rounded-md">
            ESC
          </kbd>
          <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 bg-slate-50/80 overflow-x-auto text-xs font-bold text-slate-600">
          {(['all', 'borrowers', 'loans', 'payments', 'actions'] as SearchCategory[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded-xl capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-200/70 text-slate-700 border border-slate-200'
              }`}
            >
              {tab === 'all' ? '✨ All Results' : tab}
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {!q && (
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Actions & Shortcuts</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {systemActions.slice(0, 6).map(act => {
                  const Icon = act.icon;
                  return (
                    <div
                      key={act.id}
                      onClick={act.action}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 cursor-pointer flex items-center justify-between transition-all group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <b className="text-xs font-bold text-slate-900 block leading-tight">{act.title}</b>
                          <span className="text-[10px] text-slate-400 font-semibold">{act.category}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {q && totalResults === 0 && (
            <div className="text-center py-12 space-y-2">
              <p className="text-sm font-bold text-slate-600">No results found for &ldquo;{query}&rdquo;</p>
              <p className="text-xs text-slate-400">Try searching by first name, last name, phone number, area, or loan number.</p>
            </div>
          )}

          {q && (
            <>
              {/* Borrowers Section */}
              {(activeTab === 'all' || activeTab === 'borrowers') && matchedBorrowers.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Borrowers ({matchedBorrowers.length})</span>
                    </span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedBorrowers.map(b => {
                      const area = db.areas.find(a => a.id === b.areaId);
                      const bLoans = db.loans.filter(l => l.borrowerId === b.id);
                      const activeLoan = bLoans.find(l => status(l) === 'Current' || status(l) === 'Overdue');

                      return (
                        <div
                          key={b.id}
                          className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 transition-all shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <b className="text-xs font-black text-slate-900">{bname(b)}</b>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {area ? area.name : 'No Area'}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              📞 {b.contact || 'No phone'} • ID: {b.idNo || b.id} • {bLoans.length} Loans
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                closeModal();
                                openModal('soaModal', { borrowerId: b.id });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[11px] transition-colors"
                            >
                              SOA
                            </button>
                            {activeLoan && (
                              <button
                                onClick={() => {
                                  closeModal();
                                  openModal('paymentModal', { loanId: activeLoan.id });
                                }}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs transition-colors"
                              >
                                + Pay
                              </button>
                            )}
                            <button
                              onClick={() => {
                                closeModal();
                                openModal('loanModal', { borrowerId: b.id });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] transition-colors"
                            >
                              + New Loan
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Loans Section */}
              {(activeTab === 'all' || activeTab === 'loans') && matchedLoans.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Loans ({matchedLoans.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedLoans.map(l => {
                      const b = db.borrowers.find(x => x.id === l.borrowerId);
                      const lStatus = status(l);
                      const bal = outstanding(l);

                      return (
                        <div
                          key={l.id}
                          className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 transition-all shadow-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-xs text-blue-600">{l.loanNo}</span>
                              <b className="text-xs font-bold text-slate-900">{b ? bname(b) : 'Unknown'}</b>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                  lStatus === 'Current'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : lStatus === 'Overdue'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {lStatus}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Principal: <b>{money(l.principal)}</b> • Bal: <b className="text-amber-700">{money(bal)}</b> • Released: {datef(l.date)}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                closeModal();
                                openModal('soaModal', { loanId: l.id });
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px]"
                            >
                              Statement
                            </button>
                            {bal > 0.01 && (
                              <button
                                onClick={() => {
                                  closeModal();
                                  openModal('paymentModal', { loanId: l.id });
                                }}
                                className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-xs"
                              >
                                + Pay
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payments Section */}
              {(activeTab === 'all' || activeTab === 'payments') && matchedPayments.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Payments ({matchedPayments.length})</span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedPayments.map(p => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200 flex justify-between items-center text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <b className="font-extrabold text-slate-900">{p.borrowerName}</b>
                            <span className="font-mono text-[11px] text-slate-500">{p.loanNo}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {datef(p.date)} • Ref: <span className="font-mono font-bold text-slate-700">{p.reference || 'None'}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <b className="font-black text-emerald-600 text-sm">{money(p.amount)}</b>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions Section */}
              {(activeTab === 'all' || activeTab === 'actions') && matchedActions.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Command className="w-3.5 h-3.5 text-slate-500" />
                    <span>Commands & Quick Actions</span>
                  </h4>
                  <div className="space-y-1.5">
                    {matchedActions.map(act => {
                      const Icon = act.icon;
                      return (
                        <div
                          key={act.id}
                          onClick={act.action}
                          className="p-2.5 rounded-2xl bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 cursor-pointer flex justify-between items-center transition-all group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 text-blue-600" />
                            <b className="text-xs font-bold text-slate-900">{act.title}</b>
                          </div>
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            Run
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
          <span>💡 Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-slate-800 text-[10px]">Ctrl + K</kbd> anywhere to open search</span>
          <button
            onClick={closeModal}
            className="text-xs font-extrabold text-slate-700 hover:text-slate-900"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
