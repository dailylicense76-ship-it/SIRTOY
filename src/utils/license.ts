import { safeStorage, loadDB } from './storage';

export type LicenseType = 'Perpetual' | 'Annual' | 'Monthly' | 'Trial';

export interface LicenseInfo {
  productKey: string;
  clientName: string;
  machineId: string;
  licenseType: LicenseType;
  issuedAt: string;
  expiresAt: string | null; // null = Never (Perpetual)
  isValid: boolean;
  statusMessage: string;
  isTrial: boolean;
  isExpired: boolean;
}

export interface EulaAcceptance {
  accepted: boolean;
  acceptedAt: string | null;
  acceptedBy: string | null;
  version: string;
}

const STORAGE_LICENSE_KEY = 'sirtoy_product_license_v2';
const STORAGE_EULA_KEY = 'sirtoy_eula_accepted_v2';
const STORAGE_DEVICE_UUID = 'sirtoy_machine_uuid_v2';
const MASTER_SECRET = 'SIRTOY_MICROFINANCE_MASTER_SECRET_2026_PROD';
const STORAGE_USED_KEYS = 'sirtoy_used_keys_list_v3';

/**
 * Advanced Time-Spoofing & Date Rollback Detection Engine
 * Ensures that if they manually set their Windows/PC calendar date to the past offline, the system will lock instantly.
 */
export const detectDateRollback = (): boolean => {
  const currentNow = new Date();
  if (isNaN(currentNow.getTime())) return false;
  
  const currentStr = currentNow.toISOString().slice(0, 10); // YYYY-MM-DD
  const lastMax = safeStorage.get('sirtoy_max_known_date_v2') || '';
  
  // Scan database transactions to find the absolute latest recorded date in the system's database
  let dbMax = '';
  try {
    const db = loadDB();
    if (db && Array.isArray(db.payments)) {
      for (const p of db.payments) {
        if (p.date && p.date > dbMax) dbMax = p.date;
      }
    }
    if (db && Array.isArray(db.loans)) {
      for (const l of db.loans) {
        if (l.date && l.date > dbMax) dbMax = l.date;
      }
    }
    if (db && Array.isArray(db.audit)) {
      for (const a of db.audit) {
        if (a.at) {
          const atDate = a.at.slice(0, 10);
          if (atDate > dbMax) dbMax = atDate;
        }
      }
    }
  } catch {
    // ignore
  }

  const absoluteMax = lastMax > dbMax ? lastMax : dbMax;

  if (absoluteMax && currentStr < absoluteMax) {
    // System clock has been rolled back!
    return true;
  }

  // Clock is normal, save the latest maximum date
  if (currentStr > lastMax) {
    safeStorage.set('sirtoy_max_known_date_v2', currentStr);
  }

  return false;
};

export const isKeyUsed = (key: string): boolean => {
  const raw = safeStorage.get(STORAGE_USED_KEYS);
  if (!raw) return false;
  try {
    const list: string[] = JSON.parse(raw);
    return list.includes(key.trim().toUpperCase());
  } catch {
    return false;
  }
};

export const markKeyAsUsed = (key: string): void => {
  const raw = safeStorage.get(STORAGE_USED_KEYS);
  let list: string[] = [];
  if (raw) {
    try {
      list = JSON.parse(raw);
    } catch {
      // ignore
    }
  }
  const clean = key.trim().toUpperCase();
  if (!list.includes(clean)) {
    list.push(clean);
    safeStorage.set(STORAGE_USED_KEYS, JSON.stringify(list));
  }
};

/**
 * Generates or retrieves a unique Machine ID (Browser/PC Hardware Fingerprint)
 */
export const getMachineId = (): string => {
  let deviceUuid = safeStorage.get(STORAGE_DEVICE_UUID);
  if (!deviceUuid) {
    deviceUuid = 'DEV-' + Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
    safeStorage.set(STORAGE_DEVICE_UUID, deviceUuid);
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Node/Desktop';
  const platform = typeof navigator !== 'undefined' ? navigator.platform || '' : '';
  const screenInfo = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}` : '1920x1080x24';
  const cores = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
  const lang = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
  const tz = typeof Intl !== 'undefined' && Intl.DateTimeFormat ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC';

  const rawFingerprint = `${ua}|${platform}|${screenInfo}|${cores}|${lang}|${tz}|${deviceUuid}`;
  
  // Fast FNV-1a hash formatted as MID-XXXX-XXXX-XXXX-XXXX
  let hash1 = 2166136261;
  let hash2 = 305419896;
  for (let i = 0; i < rawFingerprint.length; i++) {
    const char = rawFingerprint.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 16777619);
    hash2 ^= char;
    hash2 = Math.imul(hash2, 16777619);
  }

  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0').toUpperCase();

  return `MID-${part1.slice(0, 4)}-${part1.slice(4, 8)}-${part2.slice(0, 4)}-${part2.slice(4, 8)}`;
};

/**
 * Computes simple HMAC-like signature for key encoding
 */
const computeKeySignature = (payload: string): string => {
  const combined = `${payload}:${MASTER_SECRET}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193);
    h2 = Math.imul(h2 ^ code, 0x811c9dc5);
  }
  const str1 = (h1 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  const str2 = (h2 >>> 0).toString(16).padStart(8, '0').toUpperCase();
  return (str1 + str2).slice(0, 8);
};

/**
 * Generates an official Product Key (for seller/vendor use)
 * Key format: SIR-[TYPE]-[CLIENT_HASH]-[EXPIRY_HASH]-[SIG]
 */
export const generateProductKey = (params: {
  clientName: string;
  machineId?: string; // If empty or 'ANY', key works on any PC
  licenseType: LicenseType;
  expiryDate?: string; // YYYY-MM-DD, or empty for perpetual
}): string => {
  const clientClean = (params.clientName || 'CLIENT').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'CLIENT';
  const targetMID = (params.machineId || 'ANY').trim().toUpperCase();
  const typeCode = params.licenseType === 'Perpetual' ? 'PERP' : params.licenseType === 'Annual' ? 'ANNL' : params.licenseType === 'Monthly' ? 'MNTH' : 'TRAL';

  let expCode = 'PERPETUAL';
  if (params.licenseType !== 'Perpetual') {
    if (params.expiryDate) {
      expCode = params.expiryDate.replace(/-/g, '');
    } else {
      // Default expiry periods if date not specified
      const d = new Date();
      if (params.licenseType === 'Annual') d.setFullYear(d.getFullYear() + 1);
      else if (params.licenseType === 'Monthly') d.setMonth(d.getMonth() + 1);
      else if (params.licenseType === 'Trial') d.setDate(d.getDate() + 14);
      expCode = d.toISOString().slice(0, 10).replace(/-/g, '');
    }
  }

  const midShort = targetMID === 'ANY' ? 'ALLPC' : targetMID.replace(/-/g, '').slice(-6);
  const payload = `${typeCode}-${clientClean}-${midShort}-${expCode}`;
  const sig = computeKeySignature(payload);

  return `SIR-${typeCode}-${clientClean}-${midShort}-${expCode}-${sig}`;
};

/**
 * Validates a Product Key against Machine ID and Expiry
 */
export const validateProductKey = (key: string, currentMID: string): LicenseInfo => {
  const cleanKey = (key || '').trim().toUpperCase();
  const defaultInvalid: LicenseInfo = {
    productKey: cleanKey,
    clientName: 'Unregistered / Demo Mode',
    machineId: currentMID,
    licenseType: 'Trial',
    issuedAt: new Date().toISOString(),
    expiresAt: null,
    isValid: false,
    statusMessage: 'Walang valid na Product Key na nakalagay. Demo mode active.',
    isTrial: true,
    isExpired: false
  };

  // Check Date Rollback Tampering
  if (detectDateRollback()) {
    return {
      ...defaultInvalid,
      isValid: false,
      statusMessage: '🚨 DATE TAMPERING DETECTED! Ang oras o petsa ng iyong computer ay ibinalik sa nakaraan (Clock Rollback). Mangyaring i-set ang tamang petsa sa inyong Windows settings para ma-unlock ang system.'
    };
  }

  if (!cleanKey || !cleanKey.startsWith('SIR-')) {
    return defaultInvalid;
  }

  // Check if it's already used on another occasion (Single-Use check)
  const activeKey = safeStorage.get(STORAGE_LICENSE_KEY);
  if (cleanKey !== activeKey && isKeyUsed(cleanKey)) {
    return {
      ...defaultInvalid,
      statusMessage: 'Maling Product Key! Ang Key na ito ay nagamit na sa ibang device o pagkakataon at hindi na maaaring gamitin muli (Single-Use Only).'
    };
  }

  const parts = cleanKey.split('-');
  if (parts.length !== 6) {
    return {
      ...defaultInvalid,
      statusMessage: 'Mali ang format ng Product Key. Siguraduhing kumpleto ang SIR-XXXX-XXXX-XXXX-XXXX-XXXX.'
    };
  }

  const [, typeCode, clientClean, midShort, expCode, sig] = parts;
  const payload = `${typeCode}-${clientClean}-${midShort}-${expCode}`;
  const expectedSig = computeKeySignature(payload);

  if (sig !== expectedSig) {
    return {
      ...defaultInvalid,
      statusMessage: 'Invalid Product Key Signature! Ang key na ito ay gawa-gawa o tampered.'
    };
  }

  // Check Machine Binding
  const curMidShort = currentMID.replace(/-/g, '').slice(-6);
  if (midShort !== 'ALLPC' && midShort !== curMidShort) {
    return {
      ...defaultInvalid,
      statusMessage: `Hardware Mismatch! Ang Product Key na ito ay nakatali sa ibang Machine ID (${midShort}) at hindi pwede sa PC na ito (${curMidShort}).`
    };
  }

  // Determine License Type
  let licenseType: LicenseType = 'Perpetual';
  if (typeCode === 'ANNL') licenseType = 'Annual';
  else if (typeCode === 'MNTH') licenseType = 'Monthly';
  else if (typeCode === 'TRAL') licenseType = 'Trial';

  // Check Expiry Date
  let expiresAt: string | null = null;
  let isExpired = false;

  if (expCode !== 'PERPETUAL') {
    const year = parseInt(expCode.slice(0, 4), 10);
    const month = parseInt(expCode.slice(4, 6), 10) - 1;
    const day = parseInt(expCode.slice(6, 8), 10);
    const expDate = new Date(year, month, day, 23, 59, 59);
    expiresAt = `${expCode.slice(0, 4)}-${expCode.slice(4, 6)}-${expCode.slice(6, 8)}`;

    if (isNaN(expDate.getTime()) || new Date() > expDate) {
      isExpired = true;
    }
  }

  if (isExpired) {
    return {
      productKey: cleanKey,
      clientName: clientClean,
      machineId: currentMID,
      licenseType,
      issuedAt: new Date().toISOString(),
      expiresAt,
      isValid: false,
      statusMessage: `Expired License! Ang inyong ${licenseType} Product Key ay nag-expire noong ${expiresAt}. Mangyaring mag-renew sa developer.`,
      isTrial: licenseType === 'Trial',
      isExpired: true
    };
  }

  return {
    productKey: cleanKey,
    clientName: clientClean,
    machineId: currentMID,
    licenseType,
    issuedAt: new Date().toISOString(),
    expiresAt,
    isValid: true,
    statusMessage: `✓ Licensed Active (${licenseType}${expiresAt ? ` - Expires: ${expiresAt}` : ' - Lifetime Perpetual'})`,
    isTrial: licenseType === 'Trial',
    isExpired: false
  };
};

/**
 * Gets currently active stored license
 */
export const getStoredLicense = (): LicenseInfo => {
  const currentMID = getMachineId();
  const storedKey = safeStorage.get(STORAGE_LICENSE_KEY);
  if (!storedKey) {
    return validateProductKey('', currentMID);
  }
  return validateProductKey(storedKey, currentMID);
};

/**
 * Saves and activates a Product Key
 */
export const saveProductKey = (key: string): LicenseInfo => {
  const currentMID = getMachineId();
  const info = validateProductKey(key, currentMID);
  if (info.isValid) {
    safeStorage.set(STORAGE_LICENSE_KEY, key.trim().toUpperCase());
    markKeyAsUsed(key); // Mark as used once it is activated successfully!
  }
  return info;
};

/**
 * Removes active Product Key
 */
export const removeProductKey = (): void => {
  safeStorage.remove(STORAGE_LICENSE_KEY);
};

const STORAGE_LICENSE_SIGNAL_KEY = 'sirtoy_license_signal_v2';

export const getLicenseSignal = (): 'Active' | 'Paused' | 'Terminated' => {
  // First, check direct localStorage signal override
  const directSig = safeStorage.get(STORAGE_LICENSE_SIGNAL_KEY);
  if (directSig === 'Paused' || directSig === 'Terminated') {
    return directSig as 'Paused' | 'Terminated';
  }

  // Second, check if this Machine ID is registered and marked Paused or Terminated in telemetry list
  const currentMID = getMachineId();
  const rawInstallations = safeStorage.get('sirtoy_live_installations_v3');
  if (rawInstallations) {
    try {
      const list = JSON.parse(rawInstallations);
      if (Array.isArray(list)) {
        const found = list.find((item: any) => item.machineId && item.machineId.trim().toUpperCase() === currentMID.toUpperCase());
        if (found) {
          if (found.status === 'Paused') return 'Paused';
          if (found.status === 'Terminated') return 'Terminated';
        }
      }
    } catch {
      // ignore
    }
  }

  return (directSig as any) || 'Active';
};

export const setLicenseSignal = (sig: 'Active' | 'Paused' | 'Terminated'): void => {
  safeStorage.set(STORAGE_LICENSE_SIGNAL_KEY, sig);
};

/**
 * Gets EULA acceptance state
 */
export const getEulaAcceptance = (): EulaAcceptance => {
  const raw = safeStorage.get(STORAGE_EULA_KEY);
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    accepted: false,
    acceptedAt: null,
    acceptedBy: null,
    version: '2026.1'
  };
};

/**
 * Saves EULA acceptance
 */
export const saveEulaAcceptance = (userName: string): EulaAcceptance => {
  const state: EulaAcceptance = {
    accepted: true,
    acceptedAt: new Date().toISOString(),
    acceptedBy: userName || 'System User',
    version: '2026.1'
  };
  safeStorage.set(STORAGE_EULA_KEY, JSON.stringify(state));
  return state;
};

/**
 * Full Legal End User License Agreement (EULA) Text & Financial Disclaimer
 */
export const EULA_TEXT_CONTENT = {
  title: 'END USER LICENSE AGREEMENT (EULA) & FINANCIAL LIABILITY DISCLAIMER',
  subtitle: 'SIRTOY LENDING PLUS, INC. - Universal Microfinance & Loan Management System',
  version: 'Version 2026.1 Commercial Offline Release',
  sections: [
    {
      heading: '1. GRANT OF LICENSE & ANTI-PIRACY RESTRICTIONS',
      body: `This software application, including all source code, database structures, interface designs, 3D assets, and algorithms, is licensed—not sold—to you ("Licensee" / "Company") by the Developer. This License confers a non-exclusive, non-transferable right to execute and utilize the software on authorized computer hardware bound to the registered Machine ID (MID) or verified Product Key.

PIRACY WARNING & ANTI-DUPLICATION: You shall not copy, distribute, sublicense, reverse-engineer, decompile, modify, lease, or make the software installer/files available to unauthorized third parties or unverified computer units without express written authorization from the Developer. Failure to comply constitutes software piracy and intentional infringement punishable under national intellectual property laws.`
    },
    {
      heading: '2. ABSOLUTE DISCLAIMER OF FINANCIAL & LEGAL LIABILITY',
      body: `THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESS OR IMPLIED. THE DEVELOPER DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO ACCURACY, RELIABILITY, OR FITNESS FOR A SPECIFIC FINANCIAL PURPOSE.

USER RESPONSIBILITY & AUDIT: The Licensee, Company Owners, Administrators, and Authorized Operators bear 100% sole responsibility for:
a) The input, accuracy, completeness, and audit of all borrower data, loan principal amounts, interest rates, computation models (Flat, Amortization, Diminishing), penalty fees, and disbursement records.
b) Compliance with national laws, SEC/BSP regulations, Truth in Lending Acts, ceiling interest rate limits, and tax reporting.
c) Discrepancies arising from manual overrides, voided transactions, modified payment schedules, or incorrect system date/time settings on the host computer.

IN NO EVENT SHALL THE DEVELOPER BE LIABLE FOR ANY FINANCIAL LOSSES, UNCOLLECTED LOANS, BALANCING DISCREPANCIES, LOST PROFITS, INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES ARISING FROM THE USE OF OR INABILITY TO USE THIS SYSTEM.`
    },
    {
      heading: '3. DATA BACKUP & PHYSICAL RECORD RETENTION RESPONSIBILITY',
      body: `The software operates primarily in an Offline Local PC Desktop environment. While automated backup snapshots and PC folder sync functions are provided, the Licensee is strictly required to:
a) Maintain regular off-site and physical USB/Cloud backups of the local database files (JSON/PC Database folder).
b) Retain signed physical promissory notes, loan contracts, and customer payment receipts.
c) Perform routine end-of-day cash reconciliations to verify physical cash on hand against system ledger balance.`
    },
    {
      heading: '4. PRODUCT KEY ACTIVATION & MACHINE ID BINDING',
      body: `Each commercial license key is encrypted and cryptographically signed. Certain product key tiers strictly bind to the host PC's Hardware Machine Fingerprint (MID). Hardware changes or operating system re-installs may require contacting the Developer for license re-validation or key re-issuance.`
    },
    {
      heading: '5. OFFICIAL DEVELOPER SUPPORT & CONTACT INQUIRIES',
      body: `For official commercial license purchasing, key re-issuance, custom feature requests, or technical support, contact the official system developer directly via:

Developer Facebook Page: https://www.facebook.com/profile.php?id=61595333360264
Email / Account: dailylicense76@gmail.com`
    }
  ]
};
