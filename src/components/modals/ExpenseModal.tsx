import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DisbursementMethod } from '../../types';
import { today } from '../../utils/calculations';
import { X, ReceiptText } from 'lucide-react';

export const ExpenseModal: React.FC = () => {
  const { activeModal, closeModal, saveExpense, showToast } = useApp();

  const [date, setDate] = useState(today());
  const [category, setCategory] = useState('Operations');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<DisbursementMethod>('Cash');

  if (activeModal !== 'expenseModal') return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const aNum = Number(amount) || 0;
    if (aNum <= 0) {
      showToast('Enter a valid expense amount.', 'warn');
      return;
    }
    saveExpense({
      date,
      category,
      description: description.trim(),
      amount: aNum,
      paymentMethod
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto animate-3d-modal">
        <div
          style={{
            backgroundColor: '#78350f',
            backgroundImage: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #b45309 100%)',
            color: '#ffffff',
            borderColor: '#fbbf24'
          }}
          className="flex items-center justify-between px-5 py-4 border-b shadow-md"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <ReceiptText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base leading-tight">
                Record Operating Expense
              </h3>
              <p className="text-[11px] text-amber-100 font-semibold">Track daily business expenditures, payroll & overhead</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Expense Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Expense Category *</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Operations">Operations</option>
              <option value="Transportation">Transportation / Gas</option>
              <option value="Office Supplies">Office Supplies</option>
              <option value="Salary / Payroll">Salary / Payroll</option>
              <option value="Utilities">Utilities (Electric, Water, Internet)</option>
              <option value="Rent">Rent</option>
              <option value="Collection Expense">Collection Expense</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Amount (₱) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value as DisbursementMethod)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
            >
              <option value="Cash">Cash (Affects Physical Cash on Hand)</option>
              <option value="GCash">GCash</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Check">Check</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">Description / Particulars</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
              placeholder="What was this expense for?"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-3d-amber px-6 py-2.5 rounded-xl text-xs font-black shadow-lg cursor-pointer"
            >
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
