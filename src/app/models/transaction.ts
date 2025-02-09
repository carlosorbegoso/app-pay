import {TicketType} from './ticket-type';
import {PaymentMethod} from './payment-method';

export interface Transaction {
  id?: number;
  ticketType: TicketType;
  paymentMethod: PaymentMethod;
  amount: number;
  timestamp: Date;
  synced: boolean;
}
