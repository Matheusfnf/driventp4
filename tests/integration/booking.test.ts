import app, { init } from '@/app';
import { TicketStatus } from '@prisma/client';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import * as factory from '../factories';
import httpStatus from 'http-status';
import supertest from 'supertest';
import { cleanDb, generateValidToken } from '../helpers';

beforeAll(async () => {
  await init();
});

beforeEach(async () => {
  await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
  it('should respond with status 401 if provided token is invalid', async () => {
    const faketoken = faker.lorem.word();

    const res = await server.get('/booking').set('Authorization', `Bearer ${faketoken}`);

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if no token is provided', async () => {
    const res = await server.get('/booking');

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if is no session for the provided token', async () => {
    const userWithoutSession = await factory.createUser();
    const faketoken = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const res = await server.get('/booking').set('Authorization', `Bearer ${faketoken}`);

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 404 when user not have a booking', async () => {
      const createuser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const createdHotel = await factory.createHotel();
      await factory.createRoomWithHotelId(createdHotel.id);

      const res = await server.get('/booking').set('Authorization', `Bearer ${faketoken}`);

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 200 and with data of booking', async () => {
      const createuser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);

      const booking = await factory.createBooking(room.id, createuser.id);

      const res = await server.get('/booking').set('Authorization', `Bearer ${faketoken}`);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({
        id: booking.id,
        Room: {
          id: booking.Room.id,
          name: booking.Room.name,
          capacity: booking.Room.capacity,
          hotelId: booking.Room.hotelId,
          createdAt: booking.Room.createdAt.toISOString(),
          updatedAt: booking.Room.updatedAt.toISOString(),
        },
      });
    });
  });
});

describe('POST /booking', () => {
  it('should respond with status 401 if given token is not valid', async () => {
    const faketoken = faker.lorem.word();
    const res = await server.get('/booking').set('Authorization', `Bearer ${faketoken}`);
    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if no token is provided', async () => {
    const res = await server.get('/booking');
    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await factory.createUser();
    const faiketoken = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
    const res = await server.get('/booking').set('Authorization', `Bearer ${faiketoken}`);
    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
  

    it('should respond with status 403 when body params roomId not exists', async () => {
      const user = await factory.createUser();
      const faketoken = await generateValidToken(user);
      const enrollment = await factory.createEnrollmentWithAddress(user);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      await factory.createRoomWithHotelId(hotel.id);
      const body = {};
      const res = await server.post('/booking').set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
    });

      it('should respond with status 403 when ticket type provided is not remote', async () => {
        const user = await factory.createUser();
        const faketoken = await generateValidToken(user);
        const enrollment = await factory.createEnrollmentWithAddress(user);
        const ticketType = await factory.createTicketTypeRemote();
        const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
        await factory.createPayment(ticket.id, ticketType.price);

        const hotel = await factory.createHotel();
        const room = await factory.createRoomWithHotelId(hotel.id);
        const body = { roomId: room.id };

        const res = await server.post('/booking').set('Authorization', `Bearer ${faketoken}`).send(body);

        expect(res.status).toEqual(httpStatus.FORBIDDEN);
      });

    it('should respond with status 403 when given ticket type not includes hotel', async () => {
      const createuser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithoutHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const createroom = await factory.createRoomWithHotelId(hotel.id);
      const body = { roomId: createroom.id };

      const res = await server.post('/booking').set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status 404 when gived room does not exist', async () => {
      const user = await factory.createUser();
      const token = await generateValidToken(user);
      const enrollment = await factory.createEnrollmentWithAddress(user);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      await factory.createHotel();

      const body = { roomId: 1 };

      const res = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
    });

 
    it('should respond with status 403 when provided room capacity has been all filled', async () => {
      const user = await factory.createUser();

      const enrollment = await factory.createEnrollmentWithAddress(user);
      const faketoken = await generateValidToken(user);
      const ticketType = await factory.createTicketTypeWithHotel();
      const secondUser = await factory.createUser();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id, 1);

      await factory.createBooking(room.id, secondUser.id);

      const body = { roomId: room.id };

      const res = await server.post('/booking').set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
    });

       it('should respond with status 403 when ticket provided is not paid', async () => {
         const user = await factory.createUser();
         const token = await generateValidToken(user);
         const enrollment = await factory.createEnrollmentWithAddress(user);
         const ticketType = await factory.createTicketTypeWithoutHotel();
         const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED);
         await factory.createPayment(ticket.id, ticketType.price);

         const hotel = await factory.createHotel();
         const room = await factory.createRoomWithHotelId(hotel.id);

         const body = { roomId: room.id };

         const res = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(body);

         expect(res.status).toEqual(httpStatus.FORBIDDEN);
       });


    it('should respond with status 200 and with bookingId param', async () => {
      const user = await factory.createUser();
      const faketoken = await generateValidToken(user);
      const enrollment = await factory.createEnrollmentWithAddress(user);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);

      const body = { roomId: room.id };

      const res = await server.post('/booking').set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});

describe('PUT /booking/:bookingId', () => {
  it('should respond with status 401 if no token is provided', async () => {
    const res = await server.put('/booking/1');

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if given token is not valid', async () => {
    const faketoken = faker.lorem.word();

    const res = await server.put('/booking/1').set('Authorization', `Bearer ${faketoken}`);

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  it('should respond with status 401 if there is no session for given token', async () => {
    const userWithoutSession = await factory.createUser();
    const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

    const res = await server.put('/booking/1').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(httpStatus.UNAUTHORIZED);
  });

  describe('when token is valid', () => {
    it('should respond with status 403 if missed body param roomId', async () => {
      const createuser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      await factory.createRoomWithHotelId(hotel.id);

      const body = {};

      const res = await server.put('/booking/1').set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status 403 when given user not have booking', async () => {
      const createuser = await factory.createUser();
      const secondUser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);
      const AnotherRoom = await factory.createRoomWithHotelId(hotel.id);

      const booking = await factory.createBooking(room.id, secondUser.id);

      const body = { roomId: AnotherRoom.id };

      const res = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status 401 when given booking user isnt param of bookingId ', async () => {
      const createuser = await factory.createUser();
      const SecondUser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);
      const AnotherRoom = await factory.createRoomWithHotelId(hotel.id);

      const otherBooking = await factory.createBooking(room.id, SecondUser.id);
      await factory.createBooking(room.id, createuser.id);

      const body = { roomId: AnotherRoom.id };

      const res = await server.put(`/booking/${otherBooking.id}`).set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 404 when given room doesnt exist', async () => {
      const createuser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);
      const booking = await factory.createBooking(room.id, createuser.id);
      const body = { roomId: 1 };

      const res = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.NOT_FOUND);
    });

    it('should respond with status 403 when given room capacity has been all filled', async () => {
      const createuser = await factory.createUser();
      const SecondUser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);
      const AnotherRoom = await factory.createRoomWithHotelId(hotel.id, 1);

      const booking = await factory.createBooking(room.id, createuser.id);

      await factory.createBooking(AnotherRoom.id, SecondUser.id);

      const body = { roomId: AnotherRoom.id };

      const res = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.FORBIDDEN);
    });

    it('should respond with status 200 and with bookingId param', async () => {
      const createuser = await factory.createUser();
      const faketoken = await generateValidToken(createuser);
      const enrollment = await factory.createEnrollmentWithAddress(createuser);
      const ticketType = await factory.createTicketTypeWithHotel();
      const ticket = await factory.createTicket(enrollment.id, ticketType.id, TicketStatus.PAID);
      await factory.createPayment(ticket.id, ticketType.price);

      const hotel = await factory.createHotel();
      const room = await factory.createRoomWithHotelId(hotel.id);
      const AnotherRoom = await factory.createRoomWithHotelId(hotel.id);

      const booking = await factory.createBooking(room.id, createuser.id);

      const body = { roomId: AnotherRoom.id };

      const res = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${faketoken}`).send(body);

      expect(res.status).toEqual(httpStatus.OK);
      expect(res.body).toEqual({ bookingId: expect.any(Number) });
    });
  });
});
