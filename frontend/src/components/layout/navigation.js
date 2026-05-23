import {
  HiHome,
  HiShoppingCart,
  HiCube,
  HiUsers,
  HiCreditCard,
  HiChartBar,
  HiChat,
  HiCog
} from 'react-icons/hi';

export const getNavigationItems = (isAdmin = false) => [
  { path: '/', icon: HiHome, label: 'Dashboard' },
  { path: '/pos', icon: HiShoppingCart, label: 'POS' },
  { path: '/inventory', icon: HiCube, label: 'Inventario' },
  { path: '/customers', icon: HiUsers, label: 'Clientes' },
  { path: '/accounts', icon: HiCreditCard, label: 'Cuentas' },
  { path: '/reports', icon: HiChartBar, label: 'Reportes', adminOnly: true },
  { path: '/chatbot', icon: HiChat, label: 'Asistente' },
  { path: '/settings', icon: HiCog, label: 'Ajustes', adminOnly: true }
].filter((item) => !item.adminOnly || isAdmin);
