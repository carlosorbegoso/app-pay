import {BusStatus} from './bus-status';

export interface Bus {
  id: number;
  routeId: number;
  position: number;
  timeToNextStop: number;
  status: BusStatus;
}
