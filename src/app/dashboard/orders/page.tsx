"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AppHeader from "@/components/AppHeader";
import {
  History,
  ChevronLeft,
  Loader2,
  Calendar,
  CreditCard,
  Clock,
  ChevronRight,
  Coffee,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Package,
  ShoppingBag
} from "lucide-react";
import Link from "next/link";

export default function OrderHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function getOrders() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items (
            *,
            menu (name, price, image_url)
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch error:", error);
      } else {
        setOrders(data || []);
      }
      setLoading(false);
    }
    getOrders();
  }, [router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "brewing":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "processing":
        return "bg-blue-50 text-blue-600 border-blue-100";
      case "pending":
        return "bg-amber-50 text-amber-600 border-amber-100";
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-100";
      default:
        return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 size={14} />;
      case "brewing":
        return <Coffee size={14} />;
      case "pending":
        return <Clock size={14} />;
      case "cancelled":
        return <XCircle size={14} />;
      default:
        return <Package size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-20">
      <AppHeader title="Riwayat Pesanan" />

      <div className="container mx-auto px-4 max-w-lg mt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 font-bold text-sm mb-6 hover:text-primary transition-colors"
        >
          <ChevronLeft size={16} /> Kembali ke Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-primary/10 rounded-2xl text-primary">
            <History size={24} />
          </div>
          <div>
            <h1 className="font-black text-2xl text-[#1a1a1a]">Pesanan Saya</h1>
            <p className="text-xs text-gray-400 font-bold">
              Total {orders.length} transaksi☕️
            </p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-12 text-center shadow-sm border border-gray-50">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
              <ShoppingBag size={40} />
            </div>
            <h3 className="font-black text-lg text-[#1a1a1a] mb-2">
              Belum ada pesanan
            </h3>
            <p className="text-sm text-gray-400 font-medium mb-6">
              Mulai petualangan kopimu hari ini!
            </p>
            <Link
              href="/menu"
              className="inline-block bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black shadow-xl shadow-black/10 hover:bg-black transition-all"
            >
              Lihat Menu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-gray-50 hover:border-primary/20 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar size={12} className="text-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        {new Date(order.created_at).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                    <div className="font-black text-[#1a1a1a] text-sm truncate max-w-[150px]">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${getStatusColor(order.order_status)}`}
                  >
                    {getStatusIcon(order.order_status)}
                    {order.order_status}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  {order.order_items.map((item: any) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                        {item.menu?.image_url ? (
                          <img
                            src={item.menu.image_url}
                            alt={item.menu.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Coffee size={20} />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-[#1a1a1a] truncate">
                          {item.menu?.name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold">
                          {item.quantity}x • Rp{" "}
                          {item.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Total Pembayaran
                    </div>
                    <div className="text-base font-black text-primary">
                      Rp {(order.total_price || 0).toLocaleString()}
                    </div>
                  </div>
                  <Link
                    href={`/order-tracking/${order.id}`}
                    className="flex items-center gap-1 text-[11px] font-black text-[#1a1a1a] hover:text-primary transition-colors bg-gray-50 px-3 py-2 rounded-xl"
                  >
                    Detail <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
