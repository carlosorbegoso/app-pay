import {TicketType} from './ticket-type';
import {PaymentMethod} from './payment-method';

export interface Transaction {
  id?: number;
  driver?: {
    id: number;
  };
  ticketNumber?: string;
  ticketType: TicketType;
  paymentMethod: PaymentMethod;
  amount: number;
  timestamp: Date;
  synced: boolean;
}
