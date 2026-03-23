import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import midtransClient from 'midtrans-client';

const apiClient = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
});

export async function POST(request: Request) {
  const notification = await request.json();

  try {
    const statusResponse = await apiClient.transaction.notification(notification);
    const midtransOrderId = statusResponse.order_id;
    // Extract real order_id from "order_id__timestamp"
    const orderId = midtransOrderId.includes('__') ? midtransOrderId.split('__')[0] : midtransOrderId;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let paymentStatus = 'pending';

    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        paymentStatus = 'paid';
      } else if (fraudStatus === 'challenge') {
        paymentStatus = 'pending';
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'paid';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
      paymentStatus = 'failed';
    } else if (transactionStatus === 'expire') {
      paymentStatus = 'expired';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'pending';
    }

    // Update orders table
    await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);

    // Update payments table
    await supabase
      .from('payments')
      .update({ 
        payment_status: paymentStatus,
        midtrans_transaction_id: statusResponse.transaction_id 
      })
      .eq('order_id', orderId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
