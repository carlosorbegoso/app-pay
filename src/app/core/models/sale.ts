import {Ticket} from './ticket';
import {PaymentMethod} from './payment-method';

export interface Sale {
  id?: number;
  tickets: Ticket[];
  total: number;
  paymentMethod: PaymentMethod;
  timestamp: Date;
  userId: number;
}
