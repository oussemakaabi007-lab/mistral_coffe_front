import React, { useContext, useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { 
  Home, 
  ShoppingCart, 
  Coffee, 
  Folder, 
  Box, 
  Users, 
  BarChart3, 
  CalendarDays, 
  Clock, 
  Menu, 
  LogOut,
  Calendar,
  Bell
} from 'lucide-react';

export const SidebarLayout: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);


  useEffect(() => {
    const socket = io(process.env.backapi,{
  transports: ['websocket'],
  reconnection: true,
  reconnectionAttempts: 5,
}); 

    socket.on('newOrder', (payload) => {
      setNotification(payload.data.data.msg);
      setTimeout(() => {
        setNotification(null);
      }, 10000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const menuItems = [
    { name: 'Accueil', path: '/dashboard', icon: <Home size={18} /> },
    { name: 'Ventes', path: '/dashboard/ventes', icon: <ShoppingCart size={18} /> },
    { name: 'Produits', path: '/dashboard/produits', icon: <Coffee size={18} /> },
    { name: 'Catégories', path: '/dashboard/categories', icon: <Folder size={18} /> },
    { name: 'Stock', path: '/dashboard/ingredients', icon: <Box size={18} /> },
    { name: 'Personnel', path: '/dashboard/staff', icon: <Users size={18} /> },
    { name: 'Rapports', path: '/dashboard/rapports', icon: <BarChart3 size={18} /> },
    { name: 'Journal du Calendrier', path: '/dashboard/journalcalendrier', icon: <Calendar size={18} /> },
    { name: 'Shifts', path: '/dashboard/shifts', icon: <Clock size={18} /> },
  ];

  const headerTitle = menuItems.find(
    (item) => location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard/')
  )?.name || 'Gestion du Comptoir';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#FAF7F2] font-sans antialiased">
      {notification && (
        <div className="fixed top-20 right-6 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="bg-emerald-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-emerald-500">
            <Bell className="animate-bounce shrink-0" size={20} />
            <span className="font-black uppercase text-sm tracking-wide whitespace-pre-wrap">
              {notification}
            </span>
          </div>
        </div>
      )}
      
      <aside className={`bg-[#1C120C] text-white flex flex-col justify-between shadow-2xl h-full overflow-hidden border-r border-[#2C1E15] shrink-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0 border-r-0 pointer-events-none'}`}>
        <div className="p-5 flex items-center gap-4 border-b border-[#2C1E15] shrink-0 min-w-[256px]">
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="text-xl text-[#EAD7C3] hover:text-white bg-[#2C1E15] w-9 h-9 rounded-lg flex items-center justify-center border border-[#3A291E] active:scale-95 transition-all shrink-0"
          >
            <Menu size={20} />
          </button>
          <h1 className="text-xl font-serif font-bold tracking-wide text-[#EAD7C3] truncate">
            Café <span className="italic inline text-base text-[#C49A74] font-sans ml-1">Mistral</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3 min-w-[256px] [scrollbar-width:none]">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${location.pathname === item.path ? 'bg-[#A26D42] text-white' : 'text-[#D0C2B7] hover:bg-[#2C1E15]'}`}
              >
                {item.icon}
                <span className="truncate">{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-5 border-t border-[#2C1E15] bg-[#160E0A] min-w-[256px]">
          <button
            onClick={async () => {
              setIsLoggingOut(true);
              await auth?.logout();
              navigate('/login');
            }}
            className="w-full text-red-400 py-2 rounded-lg text-xs font-bold border border-red-900/40 hover:bg-red-950/20 flex items-center justify-center gap-2"
          >
            {isLoggingOut ? '⏳...' : <><LogOut size={14}/> Déconnexion</>}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-[#1C120C] text-white flex items-center justify-between px-6 shadow-md shrink-0">
          <div className="flex items-center gap-4">
            {!isSidebarOpen && (
              <button onClick={() => setIsSidebarOpen(true)} className="text-[#EAD7C3] bg-[#2C1E15] p-2 rounded-lg"><Menu size={20} /></button>
            )}
            <h2 className="text-lg font-bold text-[#EAD7C3]">{headerTitle}</h2>
          </div>
          <span className="text-xs bg-[#2C1E15] px-4 py-1.5 rounded border border-[#3A291E] flex items-center gap-2">
            👤 {auth?.user?.nomUtilisateur}
          </span>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#FAF7F2]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};