import { Outlet } from 'react-router-dom';
import Header from './components/layout/header';
import Footer from './components/layout/footer';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      {/* Global Header Navigation */}
      <Header />

      {/* Main Dynamic View Canvas */}
      <main className="flex-1 w-full flex flex-col">
        <Outlet />
      </main>

      {/* Global Medical Footer */}
      <Footer />
    </div>
  );
}

export default App;
