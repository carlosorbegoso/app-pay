import {TicketOption} from '../../../../core/models/ticket-option.interface';
import {Injectable} from '@angular/core';
import {TicketType} from '../../../../core/models/ticket-type';
import {PaymentMethod} from '../../../../core/models/payment-method';
import {Transaction} from '../../../../core/models/transaction';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  readonly adultTickets: TicketOption[] = [
    { type: TicketType.ADULT_DIRECT, price: 2.00, label: 'DIRECT' },
    { type: TicketType.ADULT_ZONAL, price: 2.50, label: 'ZONAL' },
    { type: TicketType.ADULT_INTERZONAL, price: 3.00, label: 'INTERZONAL' }
  ];

  readonly studentTickets: TicketOption[] = [
    { type: TicketType.STUDENT_DIRECT, price: 1.00, label: 'DIRECT' },
    { type: TicketType.STUDENT_ZONAL, price: 1.20, label: 'ZONAL' },
    { type: TicketType.STUDENT_INTERZONAL, price: 1.50, label: 'INTERZONAL' }
  ];

  createTransaction(type: TicketType, price: number, driver: any): Transaction {
    return {
      ticketType: type,
      amount: price,
      timestamp: new Date(),
      synced: false,
      paymentMethod: PaymentMethod.CASH,
      driver: { id: driver.id }
    };
  }
}
