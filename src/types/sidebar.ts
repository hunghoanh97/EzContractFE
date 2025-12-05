export interface SidebarItem {
  path: string;
  label: string;
  icon?: string;
  roles?: string[];
}

export interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

export interface SidebarTheme {
  primary: string;
  secondary: string;
  hover: string;
  active: string;
  text: string;
  border: string;
}

export interface SidebarConfig {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  activeSection: 'admin' | 'contracts';
  theme: SidebarTheme;
}

export interface SidebarContainerProps {
  userRole: 'admin' | 'user';
  onSectionChange?: (section: 'admin' | 'contracts') => void;
  className?: string;
}

export interface BaseSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export interface AdminSidebarProps extends BaseSidebarProps {}
export interface ContractSidebarProps extends BaseSidebarProps {}