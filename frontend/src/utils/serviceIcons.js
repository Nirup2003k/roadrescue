import { Disc3, BatteryCharging, BatteryFull, Fuel, Wrench, Truck, LifeBuoy } from 'lucide-react';
export const SERVICE_ICONS = {
  'Flat Tyre': Disc3, 'Battery Jump Start': BatteryCharging, 'Battery Replacement': BatteryFull,
  'Fuel Delivery': Fuel, 'Engine Problem': Wrench, 'Towing': Truck, 'General Breakdown Assistance': LifeBuoy,
};
export function getServiceIcon(name) { return SERVICE_ICONS[name] || Wrench; }
