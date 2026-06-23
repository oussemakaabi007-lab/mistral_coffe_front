import React, { useContext, useState } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const SidebarLayout: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 🟢 État de contrôle anti-spam

  const menuItems = [
    { name: 'Accueil', path: '/dashboard', icon: '🏠' },
    { name: 'Ventes', path: '/dashboard/ventes', icon: '🛒' },
    { name: 'Produits', path: '/dashboard/produits', icon: '☕' },
    { name: 'Catégories', path: '/dashboard/categories', icon: '📁' },
    { name: 'Stock', path: '/dashboard/ingredients', icon: '📦' },
    { name: 'Personnel', path: '/dashboard/staff', icon: '👥' },
    { name: 'Rapports', path: '/dashboard/rapports', icon: '📊' },
    { name: 'Journal du Calendrier', path: '/dashboard/journalcalendrier', icon: '📅' },
  ];

  // DYNAMIC HEADER TEXT: Identifies route title dynamically
  const currentMenuItem = menuItems.find(
    (item) => 
      location.pathname === item.path || 
      (item.path === '/dashboard' && location.pathname === '/dashboard/')
  );
  const headerTitle = currentMenuItem ? currentMenuItem.name : 'Gestion du Comptoir';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2] font-sans antialiased">
      
      {/* 1. Collapsible Left Sidebar */}
      <aside 
        className={`bg-[#1C120C] text-white flex flex-col justify-between shadow-2xl h-full overflow-hidden border-r border-[#2C1E15] shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'
        }`}
      >
        {/* Top Sticky Brand Header */}
        <div className="p-5 flex items-center gap-4 border-b border-[#2C1E15] shrink-0 min-w-[256px]">
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="text-xl text-[#EAD7C3] hover:text-white bg-[#2C1E15] w-9 h-9 rounded-lg flex items-center justify-center border border-[#3A291E] active:scale-95 transition-all shrink-0"
            title="Masquer le menu"
          >
            ☰
          </button>
          
          <h1 className="text-xl font-serif font-bold tracking-wide text-[#EAD7C3] truncate">
            Café <span className="italic inline text-base text-[#C49A74] font-sans ml-1">Mistral</span>
          </h1>
        </div>

        {/* Scrollable Navigation Links List */}
        <div className="flex-1 overflow-y-auto py-4 px-3 min-w-[256px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/');
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold tracking-wide transition-all duration-150 ${
                    isActive
                      ? 'bg-[#A26D42] text-white shadow-md'
                      : 'text-[#D0C2B7] hover:bg-[#2C1E15] hover:text-white'
                  }`}
                >
                  <span className="text-base shrink-0">{item.icon}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar Brand Stamp */}
        <div className="p-5 border-t border-[#2C1E15] text-center space-y-4 shrink-0 bg-[#160E0A] min-w-[256px]">
          <div className="border-t border-b border-[#3A291E] py-2">
            <p className="font-serif tracking-widest text-sm text-[#EAD7C3]">CAFÉ MISTRAL</p>
            <p className="text-[10px] text-[#A28F81] tracking-widest mt-0.5">Depuis 1995</p>
          </div>
          <button
            type="button"
            disabled={isLoggingOut} // 🛡️ Désactive le bouton pendant la déconnexion
            onClick={async () => {
              if (isLoggingOut) return; // 🛡️ Garde-fou anti-spam
              setIsLoggingOut(true);
              try {
                if (auth?.logout) {
                  await auth.logout(); // ⏳ Clôture asynchrone du shift via API
                }
                navigate('/login');
              } catch (err) {
                console.error("Erreur lors de la déconnexion", err);
                navigate('/login'); // Redirection forcée même en cas de crash réseau
              } finally {
                setIsLoggingOut(false);
              }
            }}
            className="w-full bg-transparent hover:bg-red-950/20 border border-red-900/40 text-red-400 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? '⏳ Clôture du shift...' : '🚪 Déconnexion'}
          </button>
        </div>
      </aside>

      {/* 2. Main Canvas Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Top Navigation Strip */}
        <header className="h-16 bg-[#1C120C] text-white flex items-center justify-between px-6 shadow-md shrink-0 z-10">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button 
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                className="text-2xl text-[#EAD7C3] hover:text-white bg-[#2C1E15] w-10 h-10 rounded-lg flex items-center justify-center border border-[#3A291E] active:scale-95 transition-all mr-1"
                title="Afficher le menu"
              >
                ☰
              </button>
            )}
            
            <h2 className="text-lg font-bold tracking-wide text-[#EAD7C3]">
              {headerTitle}
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="bg-[#2C1E15] px-4 py-1.5 rounded-md border border-[#3A291E] flex items-center gap-2 text-xs font-mono">
              📅 {new Date().toLocaleDateString('fr-TN')}
            </span>
            <span className="text-[#EAD7C3] flex items-center gap-2 bg-[#2C1E15] px-4 py-1.5 rounded-md border border-[#3A291E] text-xs">
              👤 {auth?.user?.nomUtilisateur || 'Admin'}
            </span>
          </div>
        </header>

        {/* 3. Main Workspace Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF7F2] focus:outline-none">
          <div className="mx-auto max-w-7xl w-full h-full">
            <Outlet />
          </div>
        </main>

        {/* System Footer Block */}
        <footer className="h-8 bg-[#EAD7C3] border-t border-[#DCC7B3] flex items-center justify-center text-[11px] text-[#5C4636] font-semibold shrink-0 tracking-wide">
          Café Mistral - Gestion du Comptoir © {new Date().getFullYear()} - Tous droits réservés
        </footer>
      </div>
    </div>
  );
};