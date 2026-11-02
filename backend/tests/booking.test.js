import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api, createUser, loginAs } from './helpers.js';
import Doctor from '../src/modules/doctor/doctor.model.js';

let mongo;
beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60000);
afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
}, 60000);
afterEach(async () => {
  const cols = await mongoose.connection.db.collections();
  for (const c of cols) await c.deleteMany({});
});

const dayOfWeek = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short' });

describe('Bookings', () => {
  test('rejects booking outside availability', async () => {
    const patient = await createUser();
    const token = await loginAs(patient);
    const nextMonday = (() => {
      const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      return d.toISOString().split('T')[0];
    })();
    const doctor = await Doctor.create({
      name: 'Dr Test', mobile: '1111111111', email: 'doc@x.com',
      specialization: 'General',
      availability: [{ day: dayOfWeek(nextMonday), start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    const res = await api.post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ doctor: doctor._id, date: nextMonday, time: '20:00' });

    expect(res.status).toBe(400);
  });

  test('patient can only see own bookings', async () => {
    const p1 = await createUser();
    const p2 = await createUser();
    const token1 = await loginAs(p1);
    const token2 = await loginAs(p2);

    const nextMonday = (() => {
      const d = new Date(); d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7));
      return d.toISOString().split('T')[0];
    })();
    const doctor = await Doctor.create({
      name: 'Dr Test', mobile: '2222222222', email: 'doc2@x.com',
      specialization: 'General',
      availability: [{ day: dayOfWeek(nextMonday), start: '09:00', end: '17:00', slotMinutes: 30 }],
    });

    await api.post('/api/v1/bookings')
      .set('Authorization', `Bearer ${token1}`)
      .send({ doctor: doctor._id, date: nextMonday, time: '10:00' });

    const list2 = await api.get('/api/v1/bookings').set('Authorization', `Bearer ${token2}`);
    expect(list2.body.data.bookings.length).toBe(0);
  });
});
