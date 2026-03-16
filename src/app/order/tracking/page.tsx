'use client';

import Link from 'next/link';
import { Coffee, MapPin, CheckCircle2, Clock } from 'lucide-react';

export default function OrderTracking() {
  const steps = [
    { label: 'Order Received', icon: <CheckCircle2 size={20} />, status: 'completed' },
    { label: 'Brewing', icon: <Coffee size={20} />, status: 'current' },
    { label: 'Out for Delivery', icon: <MapPin size={20} />, status: 'pending' },
    { label: 'Delivered', icon: <Clock size={20} />, status: 'pending' },
  ];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="px-8 py-6 flex items-center justify-between border-b bg-white">
        <Link href="/" className="font-bold text-primary">Kopiden</Link>
        <span className="font-bold text-sm tracking-widest text-gray-400 uppercase">Order #KPD-8291</span>
        <div className="w-10"></div>
      </nav>

      <div className="container mx-auto px-8 py-12 max-w-2xl">
        <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-gray-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-secondary animate-pulse"></div>
          
          <h1 className="text-4xl font-black mb-12">Tracking Your Brew</h1>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <div key={idx} className="flex gap-8 items-start relative">
                {idx < steps.length - 1 && (
                  <div className={`absolute left-6 top-10 w-0.5 h-12 ${step.status === 'completed' ? 'bg-primary' : 'bg-gray-100'}`}></div>
                )}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                  step.status === 'completed' ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' : 
                  step.status === 'current' ? 'bg-secondary text-primary animate-bounce' : 
                  'bg-gray-50 text-gray-300'
                }`}>
                  {step.icon}
                </div>
                <div className="pt-2">
                  <h3 className={`text-lg font-bold ${step.status === 'pending' ? 'text-gray-300' : 'text-gray-900'}`}>{step.label}</h3>
                  <p className="text-sm text-gray-400">
                    {step.status === 'completed' ? 'Done' : step.status === 'current' ? 'Your barista is hard at work.' : 'Upcoming'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-gray-50 rounded-[2.5rem] flex items-center gap-6">
             <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-2xl">☕</div>
             <div>
                <p className="font-bold">Barista: Agus Susanto</p>
                <p className="text-sm text-gray-500">Brewing your Signature Cappuccino</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
