import { authenticateToken } from '@/middlewares';
import { takeBooking, createBooking, updateBooking } from '@/controllers';
import { Router } from 'express';

const bookingRouter = Router();

bookingRouter.all('/*', authenticateToken).get('/', takeBooking).post('/', createBooking).put('/:bookingId', updateBooking);

export { bookingRouter };
