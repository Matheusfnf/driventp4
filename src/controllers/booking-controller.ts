import bookingService from '@/services/booking-service';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import { Response } from 'express';


export async function createBooking(req: AuthenticatedRequest, res: Response) {
  const {
    userId,
    body: { roomId },
  } = req;

  try {
    const CreatedBookingId = await bookingService.createBooking(+roomId, +userId);
    return res.status(httpStatus.OK).send(CreatedBookingId);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    if (error.name === 'NoVacanciesAvailableError') {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}

export async function takeBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  try {
    const takebooking = await bookingService.takeBookingbyUserId(+userId);
    return res.status(httpStatus.OK).send(takebooking);
  } catch (error) {
    if (error.name === 'NotFoundError') {
      return res.sendStatus(httpStatus.NOT_FOUND);
    }
    return res.sendStatus(httpStatus.BAD_REQUEST);
  }
}



export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const {
    userId,
    body: { roomId },
    params: { bookingId },
  } = req;

  try {
    const UpdatedBookingId = await bookingService.updateBooking(+roomId, +bookingId, +userId);
    return res.status(httpStatus.OK).send(UpdatedBookingId);
  } catch (error) {
   if (error.name === 'UnauthorizedError') {
      return res.sendStatus(httpStatus.UNAUTHORIZED);
    }
     if (error.name === 'NotFoundError') {
       return res.sendStatus(httpStatus.NOT_FOUND);
     }
    if (error.name === 'NoVacanciesAvailableError') {
      return res.sendStatus(httpStatus.FORBIDDEN);
    }
    return res.sendStatus(httpStatus.FORBIDDEN);
  }
}
