import {TicketType} from './ticket-type';

export interface Ticket {
  id?: number;
  type: TicketType;
  price: number;
  validUntil?: Date;
  active: boolean;
}
