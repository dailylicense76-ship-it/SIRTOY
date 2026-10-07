# Complete Guide: Automatic `.exe` Build via GitHub & Local Desktop Packaging

---

## ⚡ Option 1: Automatic `.exe` Build on GitHub (Zero PC Setup / Cloud Builder)

**Oo, 100% Pwede at Automated!** Kapag in-upload / push mo ang code na ito sa iyong **GitHub repository**, ang naka-configure nating **GitHub Actions (`.github/workflows/build-exe.yml`)** ang kusang magko-compile ng code gamit ang cloud Windows server ng GitHub at magbibigay sa iyo ng ready-to-download `.exe` installer at standalone portable `.exe`.

### 📌 Paano Gawin (Step-by-Step):

1. **I-push ang code sa iyong GitHub Repository:**
   ```bash
   git init
   git add .
   git commit -m "feat: release sirtoy lending plus desktop version"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO_NAME>.git
   git push -u origin main
   ```

2. **Pumunta sa "Actions" Tab sa GitHub:**
   * Sa iyong GitHub repository page sa browser, i-click ang tab na **`Actions`**.
   * Makikita mo ang workflow na **`Build Windows Desktop EXE`**.
   * Kusang tatakbo ito (o maaari mong i-click ang **"Run workflow"** button).
   * Maghintay ng humigit-kumulang 2 hanggang 3 minuto habang kinocompile ng GitHub ang Windows binary.

3. **I-download ang `.exe`:**
   * I-click ang natapos na green checkmark workflow run.
   * Sa ilalim ng **Artifacts**, i-click ang **`Sirtoy-Lending-Plus-Windows-EXE`** para ma-download ang `.zip` na naglalaman ng:
     * `Sirtoy Lending Plus Setup.exe` (Windows Installer)
     * `Sirtoy Lending Plus.exe` (Portable / No installation needed)

---

## 🚀 Option 2: Local NW.js / Web2Executable (Walang Coding / Simple GUI sa PC)

Kung nais mong mag-build nang mabilis sa sarili mong PC gamit ang visual app:
1. I-run sa terminal: `npm run build` (gagawa ito ng `dist` folder).
2. I-download ang **Web2Executable** mula sa GitHub Releases.
3. Piliin ang `dist` folder bilang source, itakda ang App Name bilang `Sirtoy Lending Plus`, piliin ang **Windows (64-bit)**, at i-click ang **Export / Compile**.

---

## 🛠️ Option 3: Local Tauri Build (Lightweight < 5MB Binary)

1. I-install ang Tauri CLI: `npm install -D @tauri-apps/cli`
2. I-compile: `npx tauri build`
3. Ang installer ay makikita sa `src-tauri/target/release/bundle/msi/`.

---

## 🔒 Security & Data Integrity Features:
- **100% Offline Capable:** Lahat ng assets, CSS, at UI icons ay naka-bundle sa loob ng `.exe`.
- **Dual Persistent Storage:** Native IndexedDB + File System Access API para sa automated daily JSON backups sa folder ng computer.
