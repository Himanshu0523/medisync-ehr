# MediSync Frontend Client

The frontend for MediSync is a responsive, single-page application built using React 19, Vite, Redux Toolkit, and Tailwind CSS v4. It provides dedicated role-based portals for hospital administrators, clinical doctors, front-desk receptionists, and patients.

## Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Global State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing**: [React Router DOM v7](https://reactrouter.com/)
- **Iconography**: [React Icons](https://react-icons.github.io/react-icons/)
- **HTTP Client**: Axios with JWT refresh token interceptor

---

## Directory Layout

```
frontend/
├── public/               # Static assets and icons
├── src/
│   ├── assets/           # Images, illustrations, and SVG graphics
│   ├── components/       # Reusable UI primitives (Buttons, Cards, Modals, Forms)
│   ├── layouts/          # Role-specific dashboard layouts and sidebars
│   ├── pages/            # View pages grouped by feature and role
│   ├── services/         # Axios API clients, auth token handlers, WebSocket listener
│   ├── store/            # Redux store configuration and slice reducers
│   ├── App.jsx           # Root route configuration and auth guard checks
│   ├── index.css         # Tailwind CSS imports and custom design tokens
│   └── main.jsx          # React DOM bootstrapping
├── index.html            # Application HTML shell
├── vite.config.js        # Vite build and dev server config
└── package.json          # Dependencies and scripts
```

---

## Getting Started

### 1. Environment Setup (Optional)
```bash
cp .env.example .env
```
Configure your backend API base URL (defaults to `http://localhost:5000/api/v1`).

### 2. Dependency Installation
```bash
npm install
```

### 3. Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 4. Production Build & Preview
```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview
```

### 5. Linting
```bash
npm run lint
```

---

## Role-Based Portals

- **SuperAdmin**: Platform-wide hospital onboarding, subscription tier management, system audits.
- **Hospital Admin**: Hospital staff management, department assignment, billing metrics, inventory oversight.
- **Doctor Portal**: Daily queue, clinical consultation notes (SOAP format), prescription writer, patient medical history.
- **Receptionist Portal**: Patient registration, queue check-in, doctor schedule lookup, invoice collection.
- **Patient Portal**: Appointment self-booking, lab report downloads, prescription history, cross-hospital consent management.
