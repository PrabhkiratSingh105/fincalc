# PlanMyCapital - Investment Calculator

A modern, multipage React application for calculating SIP (Systematic Investment Plan), SWP (Systematic Withdrawal Plan), and Lumpsum investment returns with tax and inflation adjustments.

## Features

- **SIP Calculator** - Calculate systematic investment plan returns with:
  - Simple SIP and Step-Up SIP modes
  - Flexible step-up options (percentage, fixed amount, inflation-linked)
  - Tax and inflation adjustments
  - Real-time charts and visualizations

- **Lumpsum Calculator** - Calculate one-time investment returns with:
  - Post-tax and inflation-adjusted values
  - Growth visualization over time

- **SWP Calculator** - Plan systematic withdrawals with:
  - Corpus sustainability analysis
  - Tax impact calculations
  - Real-time corpus and withdrawal tracking

- **User Accounts** - Secure login and signup with:
  - Calculation history saving
  - Account management

## Project Structure

```
FinCalc/
├── public/
│   └── index.html              # React HTML entry point
├── src/
│   ├── components/
│   │   ├── Header.js           # Navigation header
│   │   └── AuthModal.js        # Login/signup modal
│   ├── context/
│   │   └── AuthContext.js      # Auth state management
│   ├── pages/
│   │   ├── Home.js             # Home page
│   │   ├── SIPCalculator.js    # SIP calculator page
│   │   ├── LumpsumCalculator.js # Lumpsum calculator page
│   │   └── SWPCalculator.js    # SWP calculator page
│   ├── styles/
│   │   └── main.css            # Global styles
│   ├── App.js                  # Main React app with routing
│   └── index.js                # React entry point
├── build/                      # Built React app (generated)
├── server.js                   # Express backend server
├── package.json
```

Data persistence is handled by Supabase Postgres, not local JSON files or MongoDB.
Use `supabase-schema.sql` to create or verify the required Supabase tables.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs both React and backend dependencies:
- **React** - UI framework
- **React Router** - Client-side routing for multipage functionality
- **Express** - Backend server
- **Chart.js & react-chartjs-2** - Charts and visualizations
- **Axios** - HTTP client (for future API calls)

### 2. Build React App

```bash
npm run build
```

This creates a production build of the React app in the `build/` folder.

### 3. Start the Server

```bash
npm start
```

The server will:
- Run on http://localhost:3000 (or PORT env variable)
- Serve the React build files
- Handle API requests for authentication and history

### 4. Development Mode (Optional)

For development with hot reload:

```bash
npm run dev
```

This runs both the Express server and React development server concurrently.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/login` - Login with credentials
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/logout` - Logout user

### History
- `GET /api/history` - Get user's calculation history
- `POST /api/history` - Save a new calculation
- `DELETE /api/history/:id` - Delete a calculation

## Technologies Used

### Frontend
- **React 18** - UI library
- **React Router v6** - Client-side routing
- **Chart.js** - Charts and graphs
- **CSS** - Styling (custom CSS with CSS variables)

### Backend
- **Express.js** - HTTP server
- **Supabase Postgres** - User data, settings, saved configs, public configs, and portfolio links
- **Node.js crypto** - Password hashing (PBKDF2)

## Features

### Calculations
- **SIP Calculator**
  - Simple SIP with fixed monthly amount
  - Step-Up SIP with annual increases
  - Tax calculation on gains
  - Inflation-adjusted real purchasing power

- **Lumpsum Calculator**
  - One-time investment growth
  - Post-tax valuations
  - Inflation impact analysis

- **SWP Calculator**
  - Monthly withdrawal planning
  - Corpus depletion tracking
  - Tax implications
  - Sustainability analysis

### User Management
- Secure account creation and login
- Password hashing with PBKDF2
- Session token-based authentication
- Calculation history storage (up to 50 items per user)

## Browser Compatibility

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Performance

- Lightweight (~50KB React bundle)
- Real-time calculations
- Smooth animations and transitions
- Optimized chart rendering

## Future Enhancements

- [ ] More calculator types (EMI, FD, RD)
- [ ] Export calculations as PDF
- [ ] Multiple calculation scenarios comparison
- [ ] Mobile app version
- [ ] Advanced tax planning features
- [ ] API integration for live market data

## Security

- Passwords hashed with PBKDF2 (120,000 iterations)
- Bearer token authentication
- CORS ready for API expansion
- Input validation on all endpoints

## License

MIT

## Support

For issues or feature requests, please create an issue in the repository.
