import request from 'supertest';
import app from '../src/app.js';
import User from '../src/modules/user/user.model.js';

export const api = request(app);

let userCounter = 0;

export const createUser = async (overrides = {}) => {
  userCounter += 1;
  // Collision-proof: timestamp (ms) + pid (last 3 digits) + monotonic counter
  // Fits a 10-digit mobile: 9 + <3 digits pid> + <3 digits counter padded> + extra
  const ts   = Date.now().toString().slice(-5);          // last 5 ms digits
  const pid  = (process.pid % 100).toString().padStart(2, '0'); // 2 digits
  const seq  = (userCounter % 1000).toString().padStart(3, '0'); // 3 digits
  const base = {
    name: 'Test User',
    mobile: `9${ts}${pid}${seq}`,                         // 10 digits total
    email: `test${Date.now()}_${process.pid}_${userCounter}_${Math.random().toString(36).slice(2, 9)}@x.com`,
    password: 'Password123',
    role: 'patient',
    emailVerified: true,
    ...overrides,
  };
  return User.create(base);
};

export const loginAs = async (user) => {
  const res = await api.post('/api/v1/auth/login').send({
    email: user.email, password: 'Password123',
  });
  return res.body.data.accessToken;
};
