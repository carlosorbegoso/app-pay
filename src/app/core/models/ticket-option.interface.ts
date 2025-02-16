import {TicketType} from './ticket-type';


export  interface TicketOption {
  type: TicketType;
  price: number;
  label: string;
}
