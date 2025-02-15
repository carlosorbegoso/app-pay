import {TicketType} from '../../models/ticket-type';

export  interface TicketOption {
  type: TicketType;
  price: number;
  label: string;
}
