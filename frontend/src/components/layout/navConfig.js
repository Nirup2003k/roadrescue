import {
  LayoutDashboard, Car, PlusCircle, ClipboardList, UserCircle, Star,
  Inbox, Wrench, History, Users, ShieldCheck, ListChecks, MessageSquare,
} from 'lucide-react';
export const customerNav = [
  { to: '/customer', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/customer/vehicles', label: 'My Vehicles', icon: Car },
  { to: '/customer/request', label: 'Request Assistance', icon: PlusCircle },
  { to: '/customer/bookings', label: 'My Bookings', icon: ClipboardList },
  { to: '/customer/reviews', label: 'My Reviews', icon: Star },
  { to: '/customer/profile', label: 'Profile', icon: UserCircle },
];
export const mechanicNav = [
  { to: '/mechanic', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/mechanic/requests', label: 'Incoming Requests', icon: Inbox },
  { to: '/mechanic/active', label: 'Active Jobs', icon: Wrench },
  { to: '/mechanic/history', label: 'Job History', icon: History },
  { to: '/mechanic/reviews', label: 'Reviews', icon: Star },
  { to: '/mechanic/profile', label: 'Profile', icon: UserCircle },
];
export const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/mechanics', label: 'Mechanics', icon: ShieldCheck },
  { to: '/admin/services', label: 'Services', icon: ListChecks },
  { to: '/admin/bookings', label: 'Bookings', icon: ClipboardList },
  { to: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
];
