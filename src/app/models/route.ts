import {RouteStatus} from './route-status';
import {Bus} from './bus';

export interface Route {
  id: number;
  name: string;
  buses: Bus[];
  status: RouteStatus;
  timeEstimate: number;
}
