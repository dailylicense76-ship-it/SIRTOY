import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Upload, Camera, UserPlus } from 'lucide-react';

export const BorrowerModal: React.FC = () => {
  const { db, activeModal, modalParams, closeModal, openModal, saveBorrower, showToast } = useApp();

  const editId = modalParams.id as string | undefined;
  const existing = editId ? db.borrowers.find(b => b.id === editId) : undefined;

  const [first, setFirst] = useState(existing?.first || '');
  const [last, setLast] = useState(existing?.last || '');
  const [contact, setContact] = useState(existing?.contact || '');
  const [email, setEmail] = useState(emailOrEmpty(existing?.email));
  const [address, setAddress] = useState(existing?.address || '');
  const [areaId, setAreaId] = useState(existing?.areaId || (db.areas[0]?.id || ''));
  const [idType, setIdType] = useState(existing?.idType || '');
  const [idNo, setIdNo] = useState(existing?.idNo || '');
  const [idImage, setIdImage] = useState(existing?.idImage || '');
  const [idImageName, setIdImageName] = useState(existing?.idImageName || '');
  const [comaker, setComaker] = useState(existing?.comaker || '');
  const [comakerContact, setComakerContact] = useState(existing?.comakerContact || '');
  const [notes, setNotes] = useState(existing?.notes || '');

  function emailOrEmpty(val?: string) {
    return val || '';
  }

  if (activeModal !== 'borrowerModal') return null;

  // Derive collector from area
  const assignedCollector = db.collectors.find(c => c.areaId === areaId);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast('Please choose an image under 8MB.', 'warn');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1400;
        const scale = Math.min(1, max / img.width, max / img.height);
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setIdImage(dataUrl);
        setIdImageName(file.name);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignedCollector) {
      showToast('Selected area has no assigned collector. Assign a collector to this area first.', 'warn');
      return;
    }
    const saved = saveBorrower(
      {
        first: first.trim(),
        last: last.trim(),
        contact: contact.trim(),
        email: email.trim(),
        address: address.trim(),
        areaId,
        collectorId: assignedCollector.id,
        idType: idType.trim(),
        idNo: idNo.trim(),
        idImage,
        idImageName,
        comaker: comaker.trim(),
        comakerContact: comakerContact.trim(),
        notes: notes.trim()
      },
      editId
    );

    // If a new borrower was successfully added, automatically trigger the Loan Modal pre-filled with this borrower
    if (saved && !editId) {
      openModal('loanModal', { borrowerId: saved.id, autoCreated: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl lg:max-w-5xl w-full shadow-2xl border-2 border-slate-300 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-3d-modal">
        {/* Header */}
        <div
          style={{
            backgroundColor: '#1e3a8a',
            backgroundImage: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #1d4ed8 100%)',
            color: '#ffffff',
            borderColor: '#60a5fa'
          }}
          className="flex items-center justify-between px-5 py-3.5 border-b shadow-md flex-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 border border-white/30 text-white flex items-center justify-center font-black shadow-inner">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base leading-tight">
                {editId ? 'Edit Borrower Record' : 'Register New Borrower (Client Profile)'}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-blue-100 font-semibold">Landscape Entry • Compact auto-sized fields for fast desktop recording</p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white border border-white/20 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Landscape 2-Column Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* LEFT COLUMN: Personal Info & Area */}
            <div className="space-y-3 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
              <div className="text-[11px] font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>1. Personal & Area Profile</span>
                <span className="text-[10px] text-slate-400 font-normal">Primary Identity</span>
              </div>

              {/* Names row - auto compact */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={first}
                    onChange={e => setFirst(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Juan"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={last}
                    onChange={e => setLast(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="e.g. Dela Cruz"
                  />
                </div>
              </div>

              {/* Contact & Email row - contact is compact w-36, email flexes */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                <div className="w-full sm:w-36 flex-none">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Contact No.</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={e => setContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                    placeholder="0917XXXXXXX"
                  />
                </div>
                <div className="flex-1 min-w-[160px]">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="juan@example.com (optional)"
                  />
                </div>
              </div>

              {/* Area & Collector row */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                <div className="w-full sm:w-44 flex-none">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Assigned Area *</label>
                  <select
                    required
                    value={areaId}
                    onChange={e => setAreaId(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="">Select Area</option>
                    {db.areas.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.code || 'No Code'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Assigned Collector (Auto)</label>
                  <input
                    type="text"
                    readOnly
                    value={assignedCollector ? assignedCollector.name : 'No collector in area'}
                    className={`w-full px-2.5 py-1.5 border rounded-xl text-xs font-bold ${
                      assignedCollector ? 'bg-slate-100 border-slate-300 text-slate-800' : 'bg-red-50 border-red-300 text-red-600'
                    }`}
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Residential Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="House #, Street, Barangay, City / Province"
                />
              </div>
            </div>

            {/* RIGHT COLUMN: ID Documents, Photo & Co-Maker */}
            <div className="space-y-3 bg-slate-50/70 p-3.5 sm:p-4 rounded-2xl border border-slate-200">
              <div className="text-[11px] font-black uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                <span>2. Verification, ID & Co-Maker</span>
                <span className="text-[10px] text-slate-400 font-normal">Collateral & Guarantee</span>
              </div>

              {/* ID Type (compact w-32) & ID Number */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                <div className="w-full sm:w-36 flex-none">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Gov ID Type</label>
                  <input
                    type="text"
                    value={idType}
                    onChange={e => setIdType(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                    placeholder="UMID / PhilSys / DL"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={idNo}
                    onChange={e => setIdNo(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white font-mono"
                    placeholder="e.g. 1234-5678-9012"
                  />
                </div>
              </div>

              {/* ID / Photo Upload - Compact inline layout */}
              <div className="p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  {idImage ? (
                    <img src={idImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-300 flex-none shadow-xs" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center flex-none">
                      <Camera className="w-5 h-5" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-slate-800 block truncate">
                      {idImageName ? idImageName : idImage ? 'Photo attached' : 'Valid ID / Borrower Photo'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">JPEG/PNG max 8MB</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-none">
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 font-bold text-[11px] transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageCapture} className="hidden" />
                  </label>
                  {idImage && (
                    <button
                      type="button"
                      onClick={() => {
                        setIdImage('');
                        setIdImageName('');
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold border border-rose-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Co-Maker row */}
              <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Co-maker Name</label>
                  <input
                    type="text"
                    value={comaker}
                    onChange={e => setComaker(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                    placeholder="Full name of co-maker"
                  />
                </div>
                <div className="w-full sm:w-36 flex-none">
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Co-maker Contact</label>
                  <input
                    type="text"
                    value={comakerContact}
                    onChange={e => setComakerContact(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white font-mono"
                    placeholder="09XXXXXXXXX"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 mb-1">Internal Notes / Background</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 bg-white"
                  placeholder="Credit background notes or collateral details"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions Footer */}
          <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 flex-none">
            <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
              Fields marked with (*) are required for registration.
            </span>
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-3d-blue px-6 py-2 rounded-xl text-xs font-black shadow-lg cursor-pointer"
              >
                {editId ? 'Save Changes' : 'Save & Register Borrower'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
