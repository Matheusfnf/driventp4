import { Room } from '@prisma/client';
import { notFoundError, noVacanciesAvailableError, unauthorizedError } from '@/errors';
import ticketRepository from '@/repositories/ticket-repository';
import bookingRepository from '@/repositories/booking-repository';

interface RoomUser {
  id: number;
  Room: Room;
}

async function createBooking(roomId: number, userId: number) {
  if (!roomId) throw new Error('params in body of roomId isnt included');

  const tkt = await ticketRepository.findTicketByUserId(userId);
  const RemoteTicket = tkt.TicketType.isRemote;
  const notTicketPaid = tkt.status === 'RESERVED';
  const noIncludesHotel = !tkt.TicketType.includesHotel;

  if (RemoteTicket || notTicketPaid || noIncludesHotel) throw new Error();

  const room = await bookingRepository.findRoom(roomId);
  if (!room) throw notFoundError();

  const NoVacancy = room.capacity === room.Booking.length;
  if (NoVacancy) throw noVacanciesAvailableError();

  const { id: bookingId } = await bookingRepository.createBooking(roomId, userId);

  return { bookingId };
}

async function takeBookingbyUserId(id: number): Promise<RoomUser> {
  const takeRoom = await bookingRepository.findBookingById(id);
  if (!takeRoom) throw notFoundError();

  return takeRoom;
}

async function updateBooking(roomId: number, bookingId: number, userId: number) {
  if (!roomId) throw new Error('Body param roomId is missing');

  const existBooking = await bookingRepository.findBookingById(userId);
  if (!existBooking) throw noVacanciesAvailableError();

  const room = await bookingRepository.findRoom(roomId);
  if (!room) throw notFoundError();

  const userBooking = existBooking.id === bookingId;
  if (!userBooking) throw unauthorizedError();


  const NoVacancy = room.capacity === room.Booking.length;
  if (NoVacancy) throw noVacanciesAvailableError();

  const { id: newBookingId } = await bookingRepository.putBooking(bookingId, roomId);

  return { bookingId: newBookingId };
}

const bookingService = {
  takeBookingbyUserId,
  createBooking,
  updateBooking,
};

export default bookingService;
