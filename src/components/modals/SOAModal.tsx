import React from 'react';
import { useApp } from '../../context/AppContext';
import { printBorrowerSOA, printLoanSOA, printLoanAgreement, borrowerSOABody } from '../../utils/print';
import { bname, outstanding } from '../../utils/calculations';
import { X, Printer, FileText, FileSignature, RefreshCw } from 'lucide-react';

export const SOAModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, renewLoan } = useApp();

  const borrowerId = modalParams.borrowerId as string | undefined;
  const loanId = modalParams.loanId as string | undefined;

  if (activeModal !== 'soaModal') return null;

  const borrowerObj = borrowerId ? db.borrowers.find(b => b.id === borrowerId) : undefined;
  const loanObj = loanId ? db.loans.find(l => l.id === loanId) : undefined;
  const targetBorrower = borrowerObj || (loanObj ? db.borrowers.find(b => b.id === loanObj.borrowerId) : undefined);

  if (!targetBorrower) return null;

  const handlePrint = () => {
    if (loanId) printLoanSOA(db, loanId);
    else printBorrowerSOA(db, targetBorrower.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-3d-modal">
        <div
          style={{
            backgroundColor: '#1e3a8a',
            backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
            color: '#ffffff',
            borderColor: '#60a5fa'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Statement of Account — {bname(targetBorrower)}
              </h3>
              <p className="text-[11px] text-blue-100 font-semibold">Official ledger, payments breakdown & amortization breakdown</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loanObj && (loanObj.status === 'Paid' || outstanding(loanObj) <= 0.01) && (
              <button
                onClick={() => {
                  closeModal();
                  renewLoan(loanObj.id);
                }}
                style={{
                  backgroundColor: '#ecfdf5',
                  color: '#065f46',
                  borderColor: '#a7f3d0'
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs hover:bg-emerald-100 border shadow-md transition-all cursor-pointer"
                title="Renew this settled loan"
              >
                <RefreshCw className="w-4 h-4 text-emerald-700" />
                <span>Renew Loan</span>
              </button>
            )}
            {loanId && (
              <button
                onClick={() => printLoanAgreement(db, loanId)}
                style={{
                  backgroundColor: '#fef3c7',
                  color: '#92400e',
                  borderColor: '#fde68a'
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-black text-xs hover:bg-amber-200 border shadow-md transition-all cursor-pointer"
                title="Print Official Corporate Loan Agreement & Promissory Note"
              >
                <FileSignature className="w-4 h-4 text-amber-800" />
                <span>Print Agreement</span>
              </button>
            )}
            <button
              onClick={handlePrint}
              style={{
                backgroundColor: '#ffffff',
                color: '#1e3a8a'
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-xs hover:bg-blue-50 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-700" />
              <span>Print Official SOA</span>
            </button>
            <button
              onClick={closeModal}
              className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          className="p-5 overflow-y-auto flex-1 space-y-4"
          dangerouslySetInnerHTML={{ __html: borrowerSOABody(db, targetBorrower) }}
        />
      </div>
    </div>
  );
};
