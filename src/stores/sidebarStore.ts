import { create } from 'zustand';
import { SidebarConfig, SidebarTheme } from '@/types/sidebar';

const adminTheme: SidebarTheme = {
  primary: '#2563EB',
  secondary: '#3B82F6',
  hover: '#DBEAFE',
  active: '#DBEAFE',
  text: '#1E40AF',
  border: '#BFDBFE'
};

const contractTheme: SidebarTheme = {
  primary: '#059669',
  secondary: '#10B981',
  hover: '#D1FAE5',
  active: '#D1FAE5',
  text: '#047857',
  border: '#A7F3D0'
};

interface SidebarState extends SidebarConfig {
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  setActiveSection: (section: 'admin' | 'contracts') => void;
  toggleCollapsed: () => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: false,
  isMobileOpen: false,
  activeSection: 'contracts',
  theme: contractTheme,
  
  setCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
  setMobileOpen: (open) => set({ isMobileOpen: open }),
  setActiveSection: (section) => set({ 
    activeSection: section,
    theme: section === 'admin' ? adminTheme : contractTheme
  }),
  toggleCollapsed: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen }))
}));