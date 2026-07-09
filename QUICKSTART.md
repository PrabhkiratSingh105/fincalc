# FinCalc - Quick Start Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Start the Server

```bash
npm start
```

Open your browser and go to **http://localhost:3000**

For local React development, use `npm run dev`. For `npm start`, build the React app first with `npm run build`.

## Step 3 (optional): Build the React App

```bash
npm run build
```

Then restart with `npm start` to use the React version in `build/`.

---

## For Development

To work on the React app with hot reload:

```bash
npm run dev
```

This runs:
- Express API on http://localhost:3001
- React dev server on http://localhost:3000 (open this URL; API calls are proxied)

---

## Project Features

### 📊 Three Calculator Pages

1. **SIP Calculator** (`/sip`)
   - Systematic Investment Plan calculations
   - Simple and Step-Up modes
   - Tax & inflation adjustments
   - Real-time charts

2. **Lumpsum Calculator** (`/lumpsum`)
   - One-time investment growth
   - Post-tax valuations
   - Inflation impact

3. **SWP Calculator** (`/swp`)
   - Systematic Withdrawal Plan
   - Corpus sustainability
   - Withdrawal tracking

### 👤 User Accounts

- Sign up / Login from header
- Save calculation results
- View calculation history
- Secure password storage

### 🎨 Modern UI

- Responsive design (mobile-friendly)
- Real-time calculations
- Interactive charts
- Clean, professional interface

---

## Navigation

The app uses React Router for multipage navigation:

| URL | Page |
|-----|------|
| `/` | Home with calculator links |
| `/sip` | SIP Calculator |
| `/lumpsum` | Lumpsum Calculator |
| `/swp` | SWP Calculator |

---

## Keyboard Shortcuts

- Click calculator cards on home page
- Use dropdown menus in header to navigate
- All calculators have slider controls

---

## Troubleshooting

**Port already in use?**
```bash
npm start -- --port 3001
```

**White screen or blank page?**
- Run `npm run build`, then `npm start` for the production server
- For React development, use `npm run dev` and open **http://localhost:3000** (not 3001)
- Clear browser cache (Ctrl+Shift+Delete)

**Dependencies issue?**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## File Structure

```
src/
├── pages/          # Calculator pages
├── components/     # Reusable components
├── context/        # Auth state management
├── styles/         # CSS
├── App.js          # Main routing
└── index.js        # React entry point

public/
└── index.html      # HTML template

build/             # Production build (after npm run build)
server.js          # Express backend
```

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Build React: `npm run build`
3. ✅ Start server: `npm start`
4. 🌐 Visit http://localhost:3000
5. 📱 Test all calculators
6. 👤 Create an account and save results

---

**Happy calculating!** 📈
