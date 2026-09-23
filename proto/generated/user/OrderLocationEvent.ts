// Original file: proto/user.proto


export interface OrderLocationEvent {
  'order_id'?: (string);
  'courier_id'?: (string);
  'latitude'?: (number | string);
  'longitude'?: (number | string);
  'note'?: (string);
}

export interface OrderLocationEvent__Output {
  'order_id': (string);
  'courier_id': (string);
  'latitude': (number);
  'longitude': (number);
  'note': (string);
}
