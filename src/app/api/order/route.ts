import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  const { user_id, items, total_price } = await request.json();

  // 1. Create Order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ user_id, total_price, payment_status: 'pending', order_status: 'pending' }])
    .select()
    .single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  // 2. Create Order Items
  const orderItems = items.map((item: any) => ({
    order_id: order.id,
    menu_id: item.menu_id,
    size: item.size,
    sugar_level: item.sugar_level,
    topping: item.topping,
    quantity: item.quantity,
    price: item.price
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItems);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(order);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  let query = supabase.from('orders').select('*, order_items(*)');

  if (user_id) {
    query = query.eq('user_id', user_id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
