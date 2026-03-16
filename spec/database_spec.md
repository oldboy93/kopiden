users
id
email
role
created_at

menu
id
category
name
price
description
image_url
created_at

menu_options
id
menu_id
size
sugar_level
topping

orders
id
user_id
total_price
payment_status
order_status
created_at

order_items
id
order_id
menu_id
size
sugar_level
topping
quantity
price

payments
id
order_id
midtrans_transaction_id
payment_status
payment_proof
created_at