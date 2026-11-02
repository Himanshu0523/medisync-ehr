import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app.js';

let mongo;
beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
});

afterEach(async () => {
    const collections = await mongoose.connection.db.collections();
    for (let c of collections) await c.deleteMany({});
});

test('register creates patient and returns token', async () => {
    const res = await request(app).post('/api/v1/auth/register').send({
        name: 'John', mobile: '9999999999', email: 'j@x.com', password: 'secret1',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.user.role).toBe('patient');
    expect(res.body.data.token).toBeDefined();
});