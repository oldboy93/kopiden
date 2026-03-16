import { NextResponse } from 'next/server';
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY as string,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY as string
});

export async function POST(request: Request) {
  const { order_id, gross_amount, customer_details, items } = await request.json();

  const parameter = {
    transaction_details: {
      order_id: order_id,
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
    return NextResponse.json(transaction);
  } catch (error: any) {
    console.error('Midtrans API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
