import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { api, createUser } from './helpers.js';

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

describe('Auth', () => {
  test('register forces patient role (cannot escalate to admin)', async () => {
    const res = await api.post('/api/v1/auth/register').send({
      name: 'A', mobile: '9999999991', email: 'a@x.com',
      password: 'Password123', role: 'admin',
    });
    expect(res.status).toBe(201);
    const user = await (await import('../src/modules/user/user.model.js')).default.findOne({ email: 'a@x.com' });
    expect(user.role).toBe('patient');
  });

  test('login fails for unverified email', async () => {
    await createUser({ email: 'u@x.com', emailVerified: false });
    const res = await api.post('/api/v1/auth/login').send({ email: 'u@x.com', password: 'Password123' });
    expect(res.status).toBe(403);
  });

  test('login succeeds and returns tokens', async () => {
    await createUser({ email: 'v@x.com' });
    const res = await api.post('/api/v1/auth/login').send({ email: 'v@x.com', password: 'Password123' });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.refreshToken).toBeDefined();
  });

  test('refresh rotates token', async () => {
    await createUser({ email: 'r@x.com' });
    const login = await api.post('/api/v1/auth/login').send({ email: 'r@x.com', password: 'Password123' });
    const { refreshToken } = login.body.data;

    const r1 = await api.post('/api/v1/auth/refresh').send({ refreshToken });
    expect(r1.status).toBe(200);
    expect(r1.body.data.accessToken).toBeDefined();

    const r2 = await api.post('/api/v1/auth/refresh').send({ refreshToken });
    expect(r2.status).toBe(401); // old token revoked

    // Replay attack detection: since r2 re-used a revoked token, the entire family was invalidated!
    const r3 = await api.post('/api/v1/auth/refresh').send({ refreshToken: r1.body.data.refreshToken });
    expect(r3.status).toBe(401); // new child token also revoked due to reuse detection
  });

  test('account locks after failed attempts', async () => {
    await createUser({ email: 'lock@x.com' });
    for (let i = 0; i < 10; i++) {
      await api.post('/api/v1/auth/login').send({ email: 'lock@x.com', password: 'Wrong1234' });
    }
    const res = await api.post('/api/v1/auth/login').send({ email: 'lock@x.com', password: 'Password123' });
    expect(res.status).toBe(423);
  }, 30000);

  test('protect middleware rejects token signed with wrong secret or algorithm confusion', async () => {
    const jwt = (await import('jsonwebtoken')).default;
    // Forged token with invalid secret
    const forgedToken = jwt.sign({ id: new mongoose.Types.ObjectId(), type: 'access' }, 'attacker-controlled-secret-key-1234');
    const res = await api.post('/api/v1/auth/logout-all').set('Authorization', `Bearer ${forgedToken}`);
    expect(res.status).toBe(401);
  });

  test('staff onboarding: hospital admin invites doctor, patient cannot invite (RBAC)', async () => {
    const Hospital = (await import('../src/modules/hospital/hospital.model.js')).default;
    const testHospital = await Hospital.create({
      name: 'City General Hospital',
      code: 'CGH-TEST',
      email: 'contact@cgh.test',
      contactNumber: '0123456789',
      status: 'active',
      deletedAt: null,
    });
    const hospitalId = testHospital._id;
    const adminUser = await createUser({
      email: 'hadmin@hospital.com',
      role: 'hospital_admin',
      hospitalId,
    });
    const patientUser = await createUser({
      email: 'patient123@x.com',
      role: 'patient',
    });

    const { loginAs } = await import('./helpers.js');
    const adminToken = await loginAs(adminUser);
    const patientToken = await loginAs(patientUser);

    // 1. Patient trying to invite staff -> 403 Forbidden
    const patientAttempt = await api.post('/api/v1/auth/invite-staff')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        name: 'Dr. Jane Doe',
        email: 'dr.jane@hospital.com',
        mobile: '9888877771',
        role: 'doctor',
      });
    expect(patientAttempt.status).toBe(403);

    // 2. Hospital Admin invites doctor -> 201 Created
    const inviteRes = await api.post('/api/v1/auth/invite-staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Jane Doe',
        email: 'dr.jane@hospital.com',
        mobile: '9888877771',
        role: 'doctor',
      });
    expect(inviteRes.status).toBe(201);
    expect(inviteRes.body.data.userId).toBeDefined();

    // 3. Pending doctor cannot login yet -> 403 Account inactive
    const loginAttempt = await api.post('/api/v1/auth/login').send({
      email: 'dr.jane@hospital.com',
      password: 'AnyPassword123',
    });
    expect(loginAttempt.status).toBe(401); // or 403 inactive

    // 4. Verify Doctor clinical profile created with pending status
    const User = (await import('../src/modules/user/user.model.js')).default;
    const Doctor = (await import('../src/modules/doctor/doctor.model.js')).default;
    const pendingDoc = await User.findOne({ email: 'dr.jane@hospital.com' }).select('+invitationTokenHash');
    expect(pendingDoc.status).toBe('pending');
    expect(pendingDoc.hospitalId.toString()).toBe(hospitalId.toString());

    const docProfile = await Doctor.findOne({ email: 'dr.jane@hospital.com' });
    expect(docProfile).toBeDefined();
    expect(docProfile.user.toString()).toBe(pendingDoc._id.toString());
    expect(docProfile.status).toBe('pending');
    expect(docProfile.isPublished).toBe(false);

    // 5. Retrieve enqueued invitation token
    const { __testNotifications } = await import('../src/jobs/queues.js');
    const notification = __testNotifications.find(
      (n) => n.name === 'staff-invitation' && n.data.email === 'dr.jane@hospital.com'
    );
    expect(notification).toBeDefined();
    const { token } = notification.data;
    expect(token).toBeDefined();

    // 6. Test invalid token / bad request on accept-invitation
    const badAccept = await api.post('/api/v1/auth/accept-invitation').send({
      token: 'invalid-nonexistent-token-12345678901234567890',
      password: 'DoctorPassword@123',
    });
    expect(badAccept.status).toBe(400);

    // 7. Accept invitation via HTTP API
    const acceptRes = await api.post('/api/v1/auth/accept-invitation').send({
      token,
      password: 'DoctorPassword@123',
    });
    expect(acceptRes.status).toBe(200);

    // 8. Verify User account is active, BUT Doctor clinical profile requires administrative verification
    const activeDoc = await User.findOne({ email: 'dr.jane@hospital.com' });
    expect(activeDoc.status).toBe('active');
    expect(activeDoc.emailVerified).toBe(true);

    const docAfterAccept = await Doctor.findOne({ email: 'dr.jane@hospital.com' });
    expect(docAfterAccept.status).toBe('active');
    expect(docAfterAccept.verificationStatus).toBe('pending_verification');
    expect(docAfterAccept.isApproved).toBe(false);
    expect(docAfterAccept.isPublished).toBe(false);

    // 9. Doctor can log in, but is NOT yet published in public directory
    const loginSuccess = await api.post('/api/v1/auth/login').send({
      email: 'dr.jane@hospital.com',
      password: 'DoctorPassword@123',
    });
    expect(loginSuccess.status).toBe(200);
    expect(loginSuccess.body.data.user.role).toBe('doctor');
    const docToken = loginSuccess.body.data.accessToken;

    const publicDocsBefore = await api.get('/api/v1/doctors');
    const isDocPublicBefore = (publicDocsBefore.body.data?.doctors || []).some(
      (d) => d.email === 'dr.jane@hospital.com'
    );
    expect(isDocPublicBefore).toBe(false);

    // 10. Clinical Privilege Gate: Unverified doctor CANNOT perform clinical operations (e.g., diagnose / prescribe)
    const clinicalAttemptBefore = await api.post('/api/v1/visit-diseases')
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        diseaseName: 'Hypertension',
        treatmentDetails: 'Lisinopril 10mg daily',
      });
    expect(clinicalAttemptBefore.status).toBe(403);
    expect(clinicalAttemptBefore.body.message).toMatch(/Clinical privileges withheld/);

    // 11. Cross-Hospital Isolation: Other hospital admin cannot approve or reject
    const otherAdmin = await createUser({
      email: 'otheradmin@hospital2.com',
      role: 'hospital_admin',
      hospitalId: new mongoose.Types.ObjectId(),
    });
    const otherAdminToken = await loginAs(otherAdmin);

    const crossHospitalAttempt = await api.patch(`/api/v1/doctors/${docAfterAccept._id}/approve`)
      .set('Authorization', `Bearer ${otherAdminToken}`);
    expect(crossHospitalAttempt.status).toBe(403);

    // 12. Rejection Workflow: Admin can reject credentials with a recorded reason
    const rejectAttempt = await api.patch(`/api/v1/doctors/${docAfterAccept._id}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ reason: 'Medical registration number requires re-verification with state council' });
    expect(rejectAttempt.status).toBe(200);
    expect(rejectAttempt.body.data.verificationStatus).toBe('rejected');
    expect(rejectAttempt.body.data.isApproved).toBe(false);
    expect(rejectAttempt.body.data.verificationRejectionReason).toBe(
      'Medical registration number requires re-verification with state council'
    );

    const AuditLog = (await import('../src/modules/audit/audit.model.js')).default;
    const rejectionAudit = await AuditLog.findOne({
      entityId: docAfterAccept._id.toString(),
      action: 'DOCTOR_CREDENTIALS_REJECTED',
    });
    expect(rejectionAudit).toBeTruthy();
    expect(rejectionAudit.after.verificationStatus).toBe('rejected');

    // 13. Authorized Hospital Admin approves professional credentials -> publishes profile
    const approveRes = await api.patch(`/api/v1/doctors/${docAfterAccept._id}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.verificationStatus).toBe('verified');
    expect(approveRes.body.data.isApproved).toBe(true);
    expect(approveRes.body.data.isPublished).toBe(true);

    const approvalAudit = await AuditLog.findOne({
      entityId: docAfterAccept._id.toString(),
      action: 'DOCTOR_CREDENTIALS_APPROVED',
    });
    expect(approvalAudit).toBeTruthy();
    expect(approvalAudit.after.verificationStatus).toBe('verified');

    // 14. Clinical Privileges Granted: Doctor can now perform clinical operations
    const Visit = (await import('../src/modules/visit/visit.model.js')).default;
    const testPatient = await createUser({ role: 'patient', mobile: '9123456789' });
    const dummyVisit = await Visit.create({
      patient: testPatient._id,
      mobile: testPatient.mobile,
      date: new Date(),
      time: '10:00 AM',
      doctor: docAfterAccept._id,
      booking: new mongoose.Types.ObjectId(),
    });

    const clinicalAttemptAfter = await api.post('/api/v1/visit-diseases')
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        visit: dummyVisit._id.toString(),
        disease: 'Hypertension',
        prescription: 'Lisinopril 10mg daily',
      });
    expect(clinicalAttemptAfter.status).toBe(201);

    // 15. Now publicly visible to patients
    const publicDocsAfter = await api.get('/api/v1/doctors');
    const isDocPublicAfter = (publicDocsAfter.body.data?.doctors || []).some(
      (d) => d.email === 'dr.jane@hospital.com'
    );
    expect(isDocPublicAfter).toBe(true);

    // 16. Reusing the invitation token is rejected
    const replayAccept = await api.post('/api/v1/auth/accept-invitation').send({
      token,
      password: 'AnotherPassword@123',
    });
    expect(replayAccept.status).toBe(400);
  });

  test('atomic invitation consumption prevents concurrent double-acceptance (race condition test)', async () => {
    const adminUser = await createUser({
      email: 'admin_atomic@hospital.com',
      role: 'super_admin',
    });
    const { loginAs } = await import('./helpers.js');
    const adminToken = await loginAs(adminUser);

    // Invite doctor
    await api.post('/api/v1/auth/invite-staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dr. Concurrency Test',
        email: 'dr.race@hospital.com',
        mobile: '9888877779',
        role: 'doctor',
      });

    const { __testNotifications } = await import('../src/jobs/queues.js');
    const notification = __testNotifications.find(
      (n) => n.name === 'staff-invitation' && n.data.email === 'dr.race@hospital.com'
    );
    const { token } = notification.data;

    // Send TWO simultaneous acceptance requests with the exact same token
    const [res1, res2] = await Promise.all([
      api.post('/api/v1/auth/accept-invitation').send({ token, password: 'StrongPassword@1' }),
      api.post('/api/v1/auth/accept-invitation').send({ token, password: 'StrongPassword@2' }),
    ]);

    // Exactly one must succeed (200) and exactly one must fail (400)
    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 400]);
  });
});


