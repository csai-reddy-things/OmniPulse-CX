import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { 
  Package, 
  Truck, 
  Clock, 
  AlertOctagon, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  ExternalLink,
  ChevronRight,
  Search
} from 'lucide-react';

export const CustomerOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [simulatingOrderId, setSimulatingOrderId] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateDelay = async (orderId) => {
    try {
      setSimulatingOrderId(orderId);
      const res = await axiosClient.post(`/orders/${orderId}/simulate-delay`);
      setStatusMessage(`Delay simulated for order ${res.data.order.order_number}. Proactive outreach generated.`);
      fetchOrders();
    } catch (err) {
      console.error('Error simulating delay:', err);
    } finally {
      setSimulatingOrderId(null);
    }
  };

  const handleAskAi = (orderNumber) => {
    navigate('/cx-hub', { state: { prefilledQuery: `Status of order #${orderNumber}` } });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'out_for_delivery':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">
            <Truck className="w-3 h-3 animate-pulse" />
            Out for Delivery
          </span>
        );
      case 'delayed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase">
            <AlertOctagon className="w-3 h-3" />
            Delayed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">
            <RotateCcw className="w-3 h-3" />
            Refunded
          </span>
        );
      case 'replacement_dispatched':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase">
            <Package className="w-3 h-3" />
            Replacement Dispatched
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-500/15 text-slate-400 border border-slate-500/30 uppercase">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
    }
  };

  const filteredOrders = orders.filter(o => 
    o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 bg-slate-950 p-4 sm:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Package className="w-6 h-6 text-indigo-400" />
              <span>My Orders & Actionable Tracking</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Real-time transactional states stored in Supabase PostgreSQL and synced with OmniPulse AI
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order or product..."
              className="rounded-xl bg-slate-900 border border-slate-700 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-full sm:w-64"
            />
          </div>
        </div>

        {statusMessage && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage('')} className="font-bold hover:underline">Dismiss</button>
          </div>
        )}

        {/* Orders Table */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Order Details</th>
                  <th className="px-4 py-3.5">Carrier Logistics</th>
                  <th className="px-4 py-3.5">Estimated Delivery</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Live Status</th>
                  <th className="px-5 py-3.5 text-right">Autonomous Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-medium">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      Loading orders from database...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      No matching orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isSimulating = simulatingOrderId === order.id;
                    const canDelay = order.status !== 'delivered' && order.status !== 'refunded' && order.status !== 'delayed';

                    return (
                      <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-4">
                          <span className="font-mono text-indigo-300 font-bold block">
                            {order.order_number}
                          </span>
                          <span className="text-white font-semibold block text-sm mt-0.5">
                            {order.product_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Qty: {order.quantity}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-200 font-semibold">
                            {order.carrier_name || 'BlueDart Express'}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {order.tracking_hub || 'Central Sort Hub'}
                          </div>
                          {order.delay_reason && (
                            <div className="text-[10px] text-rose-400 mt-0.5 max-w-[200px] leading-tight">
                              ⚠️ {order.delay_reason}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-slate-200">
                            {new Date(order.estimated_delivery).toLocaleDateString()}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-semibold">
                            {order.delivery_slot || '10:00 AM - 2:00 PM'}
                          </div>
                        </td>

                        <td className="px-4 py-4 font-mono font-bold text-white text-sm">
                          ₹{Number(order.total_amount).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-4">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="px-5 py-4 text-right space-y-1.5">
                          <button
                            type="button"
                            onClick={() => handleAskAi(order.order_number)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all mr-2"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Ask AI</span>
                          </button>

                          <button
                            type="button"
                            disabled={!canDelay || isSimulating}
                            onClick={() => handleSimulateDelay(order.id)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                              order.status === 'delayed'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 opacity-60 cursor-not-allowed'
                                : canDelay
                                ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                                : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                            }`}
                          >
                            <AlertOctagon className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                            <span>{isSimulating ? 'Simulating...' : 'Simulate Delay'}</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerOrdersPage;
