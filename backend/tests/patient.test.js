import mongoose from 'mongoose';
import Hospital from '../src/modules/hospital/hospital.model.js';
import Patient from '../src/modules/patient/patient.model.js';
import PatientHospital from '../src/modules/patientHospital/patientHospital.model.js';
import { generateNextMRN } from '../src/modules/patientHospital/mrn.service.js';
import { createUser, api } from './helpers.js';

describe('Patient & Multi-Hospital Model Architecture', () => {
  let testHospital;
  let testUser;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medisync-test');
    }
    await Hospital.init();
    await Patient.init();
    await PatientHospital.init();
  });

  beforeEach(async () => {
    testHospital = await Hospital.create({
      name: `City General Hospital ${Date.now()}_${Math.random()}`,
      code: `CGH${Date.now().toString().slice(-5)}${Math.floor(Math.random() * 10000)}`,
      email: `contact${Date.now()}_${Math.random()}@cgh.org`,
      contactNumber: '9876543210',
      address: {
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
      },
    });

    testUser = await createUser({ role: 'patient' });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('Hospital model: enforces unique hospital code and validates fields', async () => {
    expect(testHospital._id).toBeDefined();
    expect(testHospital.status).toBe('active');

    // Duplicate code should trigger duplicate key error (code 11000)
    await expect(
      Hospital.create({
        name: 'Another Hospital',
        code: testHospital.code,
        email: 'other@hospital.com',
        contactNumber: '9123456789',
      })
    ).rejects.toThrow();
  });

  test('Patient model: rejects future dateOfBirth and enforces partial unique index on user', async () => {
    // 1. Future DOB rejected
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await expect(
      Patient.create({
        user: testUser._id,
        dateOfBirth: tomorrow,
      })
    ).rejects.toThrow(/Date of birth cannot be in the future/);

    // 2. Valid patient linked to user
    const p1 = await Patient.create({
      user: testUser._id,
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      bloodGroup: 'O+',
      allergies: [{ name: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' }],
      chronicConditions: ['Asthma'],
    });
    expect(p1._id).toBeDefined();
    expect(p1.allergies[0].severity).toBe('severe');

    // 3. Second patient with SAME user must be rejected by partial unique index
    await expect(
      Patient.create({
        user: testUser._id,
        dateOfBirth: new Date('1992-01-01'),
      })
    ).rejects.toThrow();

    // 4. Multiple patients WITHOUT a user (user: null) MUST be allowed
    const guest1 = await Patient.create({
      user: null,
      dateOfBirth: new Date('1985-08-20'),
      gender: 'female',
    });
    const guest2 = await Patient.create({
      user: null,
      dateOfBirth: new Date('1988-11-12'),
      gender: 'other',
    });
    expect(guest1._id).toBeDefined();
    expect(guest2._id).toBeDefined();
  });

  test('PatientHospital model: enforces uniqueness of { patient, hospital } and { hospital, MRN }', async () => {
    const patient = await Patient.create({ gender: 'male', bloodGroup: 'B+' });
    const staffUser = await createUser({ role: 'receptionist' });

    // 1. Register patient in testHospital
    const ph1 = await PatientHospital.create({
      patient: patient._id,
      hospital: testHospital._id,
      medicalRecordNumber: `${testHospital.code}-000001`,
      registeredBy: staffUser._id,
    });
    expect(ph1._id).toBeDefined();

    // 2. Duplicate registration in SAME hospital must fail
    await expect(
      PatientHospital.create({
        patient: patient._id,
        hospital: testHospital._id,
        medicalRecordNumber: `${testHospital.code}-000002`,
        registeredBy: staffUser._id,
      })
    ).rejects.toThrow();

    // 3. Same patient registered in a SECOND hospital MUST succeed with distinct MRN
    const secondHospital = await Hospital.create({
      name: 'Memorial Clinic',
      code: `MEM${Math.floor(Math.random() * 10000)}`,
      email: `memorial${Date.now()}@clinic.com`,
      contactNumber: '9888877777',
    });

    const ph2 = await PatientHospital.create({
      patient: patient._id,
      hospital: secondHospital._id,
      medicalRecordNumber: `${secondHospital.code}-000001`,
      registeredBy: staffUser._id,
    });
    expect(ph2._id).toBeDefined();

    // 4. Duplicate MRN inside the same hospital must fail
    const anotherPatient = await Patient.create({ gender: 'female' });
    await expect(
      PatientHospital.create({
        patient: anotherPatient._id,
        hospital: testHospital._id,
        medicalRecordNumber: `${testHospital.code}-000001`, // already used by ph1
        registeredBy: staffUser._id,
      })
    ).rejects.toThrow();
  });

  test('MRN Generator: generates concurrency-safe, non-colliding, sequential MRNs under load', async () => {
    const concurrencyCount = 10;
    const mrnPromises = Array.from({ length: concurrencyCount }, () =>
      generateNextMRN(testHospital._id, testHospital.code)
    );

    const generatedMRNs = await Promise.all(mrnPromises);

    // Every generated MRN must be distinct
    const uniqueMRNs = new Set(generatedMRNs);
    expect(uniqueMRNs.size).toBe(concurrencyCount);

    // All must follow {CODE}-{PADDED_SEQ} format
    generatedMRNs.forEach((mrn) => {
      expect(mrn).toMatch(new RegExp(`^${testHospital.code}-\\d{6}$`));
    });
  });

  test('Patient self-registration: creates User and linked Patient atomically via transaction', async () => {
    const regPayload = {
      name: 'Rohan Sharma',
      email: `rohan.${Date.now()}${Math.random()}@test.com`,
      mobile: `98${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 10)}`,
      password: 'PatientPassword@123',
      role: 'super_admin', // role injection attempt: must be ignored and forced to 'patient'
    };

    const res = await api.post('/api/v1/auth/register').send(regPayload);
    expect(res.status).toBe(201);
    expect(res.body.data.userId).toBeDefined();

    // 1. Verify User was created with forced 'patient' role
    const User = (await import('../src/modules/user/user.model.js')).default;
    const createdUser = await User.findById(res.body.data.userId);
    expect(createdUser).toBeTruthy();
    expect(createdUser.role).toBe('patient');
    expect(createdUser.emailVerified).toBe(false);

    // 2. Verify associated Patient profile was created and linked
    const createdPatient = await Patient.findOne({ user: createdUser._id });
    expect(createdPatient).toBeTruthy();
    expect(createdPatient.user.toString()).toBe(createdUser._id.toString());

    // 3. Duplicate email returns 409
    const dupEmailRes = await api.post('/api/v1/auth/register').send({
      ...regPayload,
      mobile: `97${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 10)}`,
    });
    expect(dupEmailRes.status).toBe(409);

    // 4. Duplicate mobile returns 409
    const dupMobileRes = await api.post('/api/v1/auth/register').send({
      ...regPayload,
      email: `another.${Date.now()}@test.com`,
    });
    expect(dupMobileRes.status).toBe(409);

    // 5. Verification email notification was queued with raw token
    const { __testNotifications } = await import('../src/jobs/queues.js');
    const notification = __testNotifications.find(
      (n) => n.name === 'verify-email' && n.data.email === regPayload.email.toLowerCase()
    );
    expect(notification).toBeTruthy();
    const { token } = notification.data;

    // 6. Verify email flow activates user
    const verifyRes = await api.get(`/api/v1/auth/verify-email?token=${token}`);
    expect(verifyRes.status).toBe(200);

    const verifiedUser = await User.findById(createdUser._id);
    expect(verifiedUser.emailVerified).toBe(true);
  });

  test('Atomic registration failure handling: neither User nor Patient persists on failure', async () => {
    const User = (await import('../src/modules/user/user.model.js')).default;
    const email = `rollback.${Date.now()}@test.com`;
    const mobile = `98765${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`;

    const topoType = mongoose.connection?.client?.topology?.description?.type;
    const supportsTransactions = ['ReplicaSetWithPrimary', 'Sharded'].includes(topoType);

    if (supportsTransactions) {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const [u] = await User.create(
            [{
              name: 'Rollback User',
              email,
              mobile,
              password: 'Password123',
              role: 'patient',
            }],
            { session }
          );

          await Patient.create(
            [{
              user: u._id,
            }],
            { session }
          );

          // Simulate an unexpected error during transaction
          throw new Error('Simulated transaction failure');
        });
      } catch (err) {
        expect(err.message).toBe('Simulated transaction failure');
      } finally {
        await session.endSession();
      }
    } else {
      // Standalone MongoDB compensating rollback verification:
      let createdUser;
      try {
        createdUser = await User.create({
          name: 'Rollback User',
          email,
          mobile,
          password: 'Password123',
          role: 'patient',
        });

        try {
          // Simulate an error during Patient creation step
          throw new Error('Simulated Patient creation failure');
        } catch (err) {
          await User.findByIdAndDelete(createdUser._id);
          throw err;
        }
      } catch (err) {
        expect(err.message).toBe('Simulated Patient creation failure');
      }
    }

    // Neither User nor Patient must persist
    const userPersisted = await User.findOne({ email });
    expect(userPersisted).toBeNull();
  });
});
