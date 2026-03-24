import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';
import { supabase } from '@/lib/supabase';

const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
});

interface CreatePaymentRequest {
  order_id: string;
  gross_amount: number;
  customer_details: {
    first_name: string;
    email: string;
    address: string;
  };
  items: any[];
}

export async function POST(request: Request) {
  const { order_id, gross_amount, customer_details, items }: CreatePaymentRequest = await request.json();

  // 1. Check for existing token to reuse
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('midtrans_token, midtrans_order_id')
    .eq('id', order_id)
    .single();

  if (existingOrder?.midtrans_token) {
    return NextResponse.json({ 
      token: existingOrder.midtrans_token,
      order_id: existingOrder.midtrans_order_id || order_id
    });
  }

  const parameter = {
    transaction_details: {
      order_id: order_id, // Back to clean order_id
      gross_amount: Math.round(gross_amount)
    },
    customer_details: {
      first_name: customer_details.first_name,
      email: customer_details.email,
      shipping_address: {
        address: customer_details.address,
        first_name: customer_details.first_name,
      }
    },
    item_details: [
      ...(items?.map((item: any) => ({
        id: item.id,
        price: Math.round(item.price),
        quantity: item.quantity,
        name: item.name
      })) || []),
      {
        id: 'tax-10',
        price: Math.round(gross_amount - (items?.reduce((acc: number, item: any) => acc + (item.price * item.quantity), 0) || 0)),
        quantity: 1,
        name: 'Service Tax (10%)'
      }
    ]
  };

  try {
    const transaction = await snap.createTransaction(parameter);
    return NextResponse.json({ 
      token: transaction.token, 
      order_id: parameter.transaction_details.order_id 
    });
  } catch (error: any) {
    console.error('Midtrans API Error:', error);
    
    // 3. Fallback: If "order_id" already exists, create with suffix
    if (error.message.match(/exists|digunakan|used|taken/i)) {
       const suffixOrderId = `${order_id}__${Math.floor(Date.now() / 1000)}`;
       const suffixParam = {
         ...parameter,
         transaction_details: {
           ...parameter.transaction_details,
           order_id: suffixOrderId
         }
       };
       const suffixTransaction = await snap.createTransaction(suffixParam);
       return NextResponse.json({ 
         token: suffixTransaction.token, 
         order_id: suffixOrderId 
       });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
