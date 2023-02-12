import { authenticateToken } from '@/middlewares';
import { getBooking, postBooking, putBooking } from '@/controllers';
import { Router } from 'express';

const bookingRouter = Router();

bookingRouter.all('/*', authenticateToken).get('/', getBooking).post('/', postBooking).put('/:bookingId', putBooking);

export { bookingRouter };
