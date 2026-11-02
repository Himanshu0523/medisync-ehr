import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { requireHospitalScope } from '../src/middleware/tenant.middleware.js';
import Hospital from '../src/modules/hospital/hospital.model.js';
import { ROLES } from '../src/modules/auth/auth.constants.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Hospital.deleteMany({});
});

describe('Milestone 3 — Tenant Scope Middleware (requireHospitalScope)', () => {
  let activeHospital;
  let inactiveHospital;
  let deletedHospital;

  beforeEach(async () => {
    activeHospital = await Hospital.create({
      name: 'City Care Multispeciality Hospital',
      code: 'CITY-IND',
      email: 'contact@citycare.com',
      contactNumber: '07312554400',
      status: 'active',
      deletedAt: null,
    });

    inactiveHospital = await Hospital.create({
      name: 'LifeLine Hospital',
      code: 'LIFE-PUN',
      email: 'contact@lifeline.com',
      contactNumber: '02025667788',
      status: 'inactive',
      deletedAt: null,
    });

    deletedHospital = await Hospital.create({
      name: 'Old Hospital',
      code: 'OLD-HOSP',
      email: 'contact@oldhosp.com',
      contactNumber: '02025667799',
      status: 'active',
      deletedAt: new Date(),
    });
  });

  const runMiddleware = (req) =>
    new Promise((resolve, reject) => {
      const res = {};
      const next = (err) => (err ? reject(err) : resolve(req));
      requireHospitalScope(req, res, next).catch(reject);
    });

  it('1. Hospital Admin gets assigned req.tenant.hospitalId', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: activeHospital._id,
      },
    };

    await runMiddleware(req);
    expect(req.tenant).toBeDefined();
    expect(req.tenant.hospitalId.toString()).toBe(activeHospital._id.toString());
    expect(req.tenant.hospitalCode).toBe('CITY-IND');
  });

  it('2. Doctor gets assigned req.tenant.hospitalId', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.DOCTOR,
        hospitalId: activeHospital._id,
      },
    };

    await runMiddleware(req);
    expect(req.tenant.hospitalId.toString()).toBe(activeHospital._id.toString());
  });

  it('3. Receptionist gets assigned req.tenant.hospitalId', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.RECEPTIONIST,
        hospitalId: activeHospital._id,
      },
    };

    await runMiddleware(req);
    expect(req.tenant.hospitalId.toString()).toBe(activeHospital._id.toString());
  });

  it('4. Super Admin receives 403 on hospital-staff routes', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.SUPER_ADMIN,
        hospitalId: null,
      },
    };

    await expect(runMiddleware(req)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringMatching(/cannot access hospital-scoped operations/i),
    });
  });

  it('5. Patient receives 403 on hospital-staff routes', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.PATIENT,
        hospitalId: null,
      },
    };

    await expect(runMiddleware(req)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringMatching(/cannot access hospital-scoped operations/i),
    });
  });

  it('6. Staff without hospitalId receives 403', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: null,
      },
    };

    await expect(runMiddleware(req)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringMatching(/No valid hospital assignment found/i),
    });
  });

  it('7. Inactive hospital receives 403', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: inactiveHospital._id,
      },
    };

    await expect(runMiddleware(req)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringMatching(/inactive, suspended, or unavailable/i),
    });
  });

  it('8. Soft-deleted hospital receives 403', async () => {
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: deletedHospital._id,
      },
    };

    await expect(runMiddleware(req)).rejects.toMatchObject({
      statusCode: 403,
      message: expect.stringMatching(/inactive, suspended, or unavailable/i),
    });
  });

  it('9. Client-supplied body/query hospitalId does not override user tenant', async () => {
    const forgedHospitalId = new mongoose.Types.ObjectId();
    const req = {
      user: {
        _id: new mongoose.Types.ObjectId(),
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: activeHospital._id,
      },
      body: { hospitalId: forgedHospitalId },
      query: { hospitalId: forgedHospitalId },
      params: { hospitalId: forgedHospitalId },
    };

    await runMiddleware(req);
    expect(req.tenant.hospitalId.toString()).toBe(activeHospital._id.toString());
    expect(req.tenant.hospitalId.toString()).not.toBe(forgedHospitalId.toString());
  });

  it('10. Unauthenticated request receives 401', async () => {
    const req = {};
    await expect(runMiddleware(req)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Authentication required',
    });
  });
});
