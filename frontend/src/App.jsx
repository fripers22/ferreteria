import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Accounts from './pages/Accounts';
import Reports from './pages/Reports';
import Chatbot from './pages/Chatbot';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pos" element={<POS />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
