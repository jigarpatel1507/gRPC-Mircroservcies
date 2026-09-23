// Original file: proto/user.proto


export interface OrderStreamResponse {
  'order_id'?: (string);
  'user_id'?: (string);
  'item_name'?: (string);
  'amount'?: (number | string);
  'status'?: (string);
  'timestamp'?: (string);
}

export interface OrderStreamResponse__Output {
  'order_id': (string);
  'user_id': (string);
  'item_name': (string);
  'amount': (number);
  'status': (string);
  'timestamp': (string);
}
