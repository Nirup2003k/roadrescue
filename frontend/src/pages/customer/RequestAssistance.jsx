import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Star, Car, PlusCircle, MapPin, Clock, IndianRupee, LocateFixed, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { customerNav } from '../../components/layout/navConfig';
import { vehicleApi } from '../../api/vehicles';
import { serviceApi } from '../../api/services';
import { mechanicApi } from '../../api/mechanics';
import { bookingApi } from '../../api/bookings';
import { useToast } from '../../context/ToastContext';
import { getServiceIcon } from '../../utils/serviceIcons';
import { formatCurrency } from '../../utils/format';
import { Card, CardBody } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import ErrorBanner from '../../components/ui/ErrorBanner';
import EmptyState from '../../components/ui/EmptyState';

export default function RequestAssistance() {
  const toast = useToast();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState(null);
  const [services, setServices] = useState(null);
  const [mechanics, setMechanics] = useState([]);
  const [mechanicsLoading, setMechanicsLoading] = useState(false);
  const [mechanicsError, setMechanicsError] = useState('');

  const [vehicleId, setVehicleId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [locationAddress, setLocationAddress] = useState('');

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    vehicleApi.list().then((res) => setVehicles(res.data.vehicles)).catch(() => setVehicles([]));
    serviceApi.list().then((res) => setServices(res.data.services)).catch(() => setServices([]));
  }, []);

  const hasCoords = latitude !== '' && longitude !== '';

  const fetchNearby = useCallback(() => {
    if (!serviceId || !hasCoords) { setMechanics([]); return; }
    setMechanicsLoading(true);
    setMechanicsError('');
    mechanicApi
      .nearby({ serviceId, lat: latitude, lng: longitude })
      .then((res) => setMechanics(res.data.mechanics))
      .catch((err) => { setMechanics([]); setMechanicsError(err.message); })
      .finally(() => setMechanicsLoading(false));
  }, [serviceId, latitude, longitude, hasCoords]);

  useEffect(() => {
    setMechanicId('');
    fetchNearby();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId, latitude, longitude]);

  function handleUseCurrentLocation() {
    setLocationNote('');
    if (!navigator.geolocation) {
      setLocationNote("Your browser doesn't support automatic location — enter coordinates manually below.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setLocationNote("Couldn't access your location automatically — enter coordinates manually below.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!vehicleId || !serviceId || !mechanicId || !problemDescription || !locationAddress || !hasCoords) {
      setError('Please fill in all fields, including your breakdown location, before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await bookingApi.create({
        vehicleId, serviceId, mechanicId, problemDescription, locationAddress,
        latitude: Number(latitude), longitude: Number(longitude),
      });
      toast.success('Assistance request sent to the mechanic.');
      navigate(`/customer/bookings/${res.data.booking.id}`);
    } catch (err) {
      setError(err.message);
      if (err.status === 422) {
        // Most likely the mechanic went busy/offline between discovery and submit.
        setMechanicId('');
        fetchNearby();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const loading = vehicles === null || services === null;

  return (
    <DashboardLayout navItems={customerNav} title="Request Assistance">
      {loading ? (
        <Loader label="Loading..." />
      ) : vehicles.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState icon={Car} title="Add a vehicle first" description="You need at least one vehicle on your account before requesting assistance."
              action={<Link to="/customer/vehicles"><Button variant="beacon"><PlusCircle className="h-4 w-4" /> Add Vehicle</Button></Link>} />
          </CardBody>
        </Card>
      ) : (
        <div className="max-w-2xl">
          <Card>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-5">
                <ErrorBanner message={error} />

                <Select label="Vehicle" required value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                  <option value="">Select a vehicle</option>
                  {vehicles.map((v) => <option key={v.id} value={v.id}>{v.brand} {v.model} · {v.registration_number}</option>)}
                </Select>

                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-1.5">Service Type <span className="text-danger-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {services.map((s) => {
                      const Icon = getServiceIcon(s.name);
                      const active = String(serviceId) === String(s.id);
                      return (
                        <button type="button" key={s.id} onClick={() => setServiceId(s.id)}
                          className={`flex flex-col items-start gap-1.5 rounded-lg border-2 p-3 text-left transition-colors ${active ? 'border-beacon-500 bg-beacon-50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <Icon className={`h-[18px] w-[18px] ${active ? 'text-beacon-600' : 'text-slate-400'}`} />
                          <span className="text-xs font-medium text-ink leading-tight">{s.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-800 mb-1.5">Breakdown Location <span className="text-danger-500">*</span></label>
                  <Input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="Street, area, landmark, city" />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleUseCurrentLocation} loading={locating}>
                      <LocateFixed className="h-3.5 w-3.5" /> Use my current location
                    </Button>
                    {hasCoords && <span className="text-xs text-slate-500">📍 Location set ({Number(latitude).toFixed(4)}, {Number(longitude).toFixed(4)})</span>}
                  </div>
                  {locationNote && <p className="text-xs text-beacon-700 mt-1.5">{locationNote}</p>}
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <Input label="Latitude" type="number" step="any" placeholder="e.g. 12.9716" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
                    <Input label="Longitude" type="number" step="any" placeholder="e.g. 77.5946" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
                  </div>
                </div>

                {serviceId && hasCoords && (
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-sm font-medium text-ink-800">Nearby Mechanics <span className="text-danger-500">*</span></label>
                      <button type="button" onClick={fetchNearby} className="text-xs text-route-600 font-medium flex items-center gap-1 hover:underline">
                        <RefreshCw className="h-3 w-3" /> Refresh
                      </button>
                    </div>
                    {mechanicsLoading ? (
                      <Loader label="Finding nearby mechanics..." />
                    ) : mechanicsError ? (
                      <ErrorBanner message={mechanicsError} />
                    ) : mechanics.length === 0 ? (
                      <p className="text-sm text-slate-500 border border-dashed border-slate-300 rounded-lg p-4">
                        No available mechanics nearby for this service. Try a different service type or refresh in a moment.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {mechanics.map((m) => {
                          const active = String(mechanicId) === String(m.id);
                          return (
                            <button type="button" key={m.id} onClick={() => setMechanicId(m.id)}
                              className={`w-full flex items-center justify-between gap-3 rounded-lg border-2 p-3 text-left transition-colors ${active ? 'border-beacon-500 bg-beacon-50' : 'border-slate-200 hover:border-slate-300'}`}>
                              <div>
                                <p className="font-medium text-ink text-sm">{m.name}</p>
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-600">
                                  <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-beacon-500 text-beacon-500" />{Number(m.avg_rating).toFixed(1)} ({m.review_count})</span>
                                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {m.distance_km} km away</span>
                                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Est. arrival: {m.estimated_arrival_minutes} min</span>
                                  <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" /> {formatCurrency(m.service_price)}</span>
                                </div>
                              </div>
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success-50 text-success-700 shrink-0">🟢 Available</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <Textarea label="Problem Description" required value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)}
                  placeholder="Describe what happened — e.g. car won't start, flat rear tyre, etc." />

                <Button type="submit" variant="beacon" className="w-full" loading={submitting}>Submit Request</Button>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </DashboardLayout>
  );
}
