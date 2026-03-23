import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import midtransClient from 'midtrans-client';

const apiClient = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1. Get the order from Supabase
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('midtrans_order_id, id')
      .eq('id', id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const midtransOrderId = order.midtrans_order_id || order.id;

    // 2. Query Midtrans
    let statusResponse;
    try {
      statusResponse = await apiClient.transaction.status(midtransOrderId);
    } catch (e: any) {
        // If not found with suffix, try without suffix just in case
        if (midtransOrderId.includes('__')) {
            try {
                statusResponse = await apiClient.transaction.status(order.id);
            } catch (innerError) {
                throw e; // rethrow original error if both fail
            }
        } else {
            throw e;
        }
    }

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

    // 3. Update Supabase
    await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', id);

    return NextResponse.json({ 
      success: true, 
      payment_status: paymentStatus,
      raw: statusResponse 
    });

  } catch (error: any) {
    console.error('Sync error:', error);
    return NextResponse.json({ 
      error: error.message, 
      details: 'Check if transaction exists in Midtrans sandbox dashboard'
    }, { status: 500 });
  }
}
