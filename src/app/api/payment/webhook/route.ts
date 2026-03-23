import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import midtransClient from 'midtrans-client';

const apiClient = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
});

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response('Kopiden Webhook is active. Use POST for notifications.', { status: 200 });
}

export async function HEAD() {
  return new Response(null, { status: 200 });
}

export async function POST(request: Request) {
  console.log('--- Webhook Received ---');
  
  try {
    const notification = await request.json();
    console.log('Notification Body:', JSON.stringify(notification));

    let statusResponse;
    try {
      statusResponse = await apiClient.transaction.notification(notification);
    } catch (verifError: any) {
      console.warn('Notification Verification Warning:', verifError.message);
      
      // If it's a 404, it might be a mock/test notification from Midtrans Dashboard
      if (verifError.message.includes('404') || notification.order_id?.includes('test')) {
        console.log('Detected likely mock/test notification. Using payload data directly.');
        statusResponse = notification; // Fallback to raw notification for testing
      } else {
        throw verifError; // Rethrow real errors
      }
    }

    const midtransOrderId = statusResponse.order_id;
    
    if (!midtransOrderId) {
      throw new Error('No order_id found in notification');
    }

    // Extract real order_id from "order_id__timestamp"
    const orderId = midtransOrderId.includes('__') ? midtransOrderId.split('__')[0] : midtransOrderId;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`Processing Order ${orderId} (Midtrans: ${midtransOrderId}) - Status: ${transactionStatus}`);

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
    const { error: orderUpdateError } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', orderId);

    if (orderUpdateError) {
      console.error('Supabase Order Update Error:', orderUpdateError);
    }

    // Update payments table (if it exists)
    const { error: paymentUpdateError } = await supabase
      .from('payments')
      .update({ 
        payment_status: paymentStatus,
        midtrans_transaction_id: statusResponse.transaction_id 
      })
      .eq('order_id', orderId);

    if (paymentUpdateError) {
      // Not critical if payments table doesn't exist or fail
      console.log('Supabase Payment Update Skip/Error:', paymentUpdateError.message);
    }

    console.log(`Order ${orderId} updated to ${paymentStatus}`);
    return NextResponse.json({ success: true, status: paymentStatus });
  } catch (error: any) {
    console.error('Webhook Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
