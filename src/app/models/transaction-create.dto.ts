import {TicketType} from './ticket-type';
import {PaymentMethod} from './payment-method';

export interface TransactionCreateDto {
  ticketType: TicketType;
  paymentMethod: PaymentMethod;
  amount: number;
  timestamp: Date;
  synced: boolean;
}
