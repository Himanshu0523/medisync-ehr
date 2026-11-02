import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../config/db.js';
import Hospital from '../modules/hospital/hospital.model.js';
import User from '../modules/user/user.model.js';
import { ROLES } from '../modules/auth/auth.constants.js';
import { inviteStaff, acceptInvitation, login } from '../modules/auth/auth.service.js';
import { logger } from '../utils/logger.js';

const run = async () => {
  await connectDB();
  logger.info('--- MediSync Milestone 2 Onboarding & Tenant Isolation Verification ---');

  // 1. Ensure Super Admin exists
  let superAdmin = await User.findOne({ email: 'admin@medisync.com' });
  if (!superAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@12345', 12);
    superAdmin = await User.create({
      name: 'Super Administrator',
      email: 'admin@medisync.com',
      mobile: '9999999999',
      password: hashedPassword,
      role: ROLES.SUPER_ADMIN,
      status: 'active',
      emailVerified: true,
    });
    logger.info('Seeded Super Admin: admin@medisync.com');
  } else {
    logger.info('Super Admin already exists: admin@medisync.com');
  }

  // 2. Ensure Sample Hospitals
  const sampleHospitals = [
    {
      name: 'City Care Multispeciality Hospital',
      code: 'CITY-IND',
      email: 'contact@citycare.com',
      contactNumber: '0731-2554400',
      address: {
        street: '12 AB Road',
        city: 'Indore',
        state: 'Madhya Pradesh',
        postalCode: '452001',
        country: 'India',
      },
      status: 'active',
    },
    {
      name: 'Sunrise Memorial Hospital',
      code: 'SUN-MUM',
      email: 'contact@sunrisememorial.com',
      contactNumber: '022-26401122',
      address: {
        street: '45 Marine Lines',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400020',
        country: 'India',
      },
      status: 'active',
    },
    {
      name: 'LifeLine General Hospital',
      code: 'LIFE-PUN',
      email: 'contact@lifelinehospital.com',
      contactNumber: '020-25667788',
      address: {
        street: '88 FC Road',
        city: 'Pune',
        state: 'Maharashtra',
        postalCode: '411004',
        country: 'India',
      },
      status: 'inactive', // Intentionally inactive for Test D
    },
  ];

  const hospitalMap = {};
  for (const hData of sampleHospitals) {
    let hosp = await Hospital.findOne({ code: hData.code });
    if (!hosp) {
      hosp = await Hospital.create(hData);
      logger.info(`Created Hospital [${hData.code}]: ${hData.name} (${hData.status})`);
    } else {
      hosp.status = hData.status;
      await hosp.save();
      logger.info(`Hospital [${hData.code}] exists: ${hosp.name} (${hosp.status})`);
    }
    hospitalMap[hData.code] = hosp;
  }

  const cityCare = hospitalMap['CITY-IND'];
  const sunrise = hospitalMap['SUN-MUM'];
  const lifeLine = hospitalMap['LIFE-PUN'];

  // 3. Test A: Invite Hospital Admin for City Care (Hospital A) and Sunrise (Hospital B)
  logger.info('\n--- Running Test A: Hospital Admin Invitation Flow ---');

  // Admin A
  const adminAEmail = 'admin.citycare@medisync.com';
  let adminA = await User.findOne({ email: adminAEmail });
  let tokenA = null;
  if (!adminA) {
    const inviteRes = await inviteStaff(
      {
        name: 'Dr. Rajesh Sharma',
        email: adminAEmail,
        mobile: '9826011111',
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: cityCare._id.toString(),
      },
      { _id: superAdmin._id, role: ROLES.SUPER_ADMIN }
    );
    tokenA = inviteRes.invitationToken;
    logger.info(`Dispatched invitation for Admin A (${adminAEmail}). Token generated.`);
  } else {
    logger.info(`Admin A (${adminAEmail}) already exists with status: ${adminA.status}`);
  }

  // Admin B
  const adminBEmail = 'admin.sunrise@medisync.com';
  let adminB = await User.findOne({ email: adminBEmail });
  let tokenB = null;
  if (!adminB) {
    const inviteRes = await inviteStaff(
      {
        name: 'Dr. Anita Desai',
        email: adminBEmail,
        mobile: '9826022222',
        role: ROLES.HOSPITAL_ADMIN,
        hospitalId: sunrise._id.toString(),
      },
      { _id: superAdmin._id, role: ROLES.SUPER_ADMIN }
    );
    tokenB = inviteRes.invitationToken;
    logger.info(`Dispatched invitation for Admin B (${adminBEmail}). Token generated.`);
  } else {
    logger.info(`Admin B (${adminBEmail}) already exists with status: ${adminB.status}`);
  }

  // Accept invitations if pending
  if (tokenA) {
    await acceptInvitation(tokenA, 'AdminPass@123');
    logger.info(`Admin A accepted invitation and activated account with secure password.`);
  }
  if (tokenB) {
    await acceptInvitation(tokenB, 'AdminPass@123');
    logger.info(`Admin B accepted invitation and activated account with secure password.`);
  }

  // Reload admin records to verify MongoDB hospitalId values
  adminA = await User.findOne({ email: adminAEmail });
  adminB = await User.findOne({ email: adminBEmail });

  console.log('\n--- Test A Verification Results in MongoDB ---');
  console.log(`Admin A (${adminA.email}):`);
  console.log(`  - Role: ${adminA.role}`);
  console.log(`  - Status: ${adminA.status}`);
  console.log(`  - Assigned hospitalId: ${adminA.hospitalId}`);
  console.log(`  - Matches City Care (${cityCare._id}): ${adminA.hospitalId.toString() === cityCare._id.toString()}`);

  console.log(`Admin B (${adminB.email}):`);
  console.log(`  - Role: ${adminB.role}`);
  console.log(`  - Status: ${adminB.status}`);
  console.log(`  - Assigned hospitalId: ${adminB.hospitalId}`);
  console.log(`  - Matches Sunrise (${sunrise._id}): ${adminB.hospitalId.toString() === sunrise._id.toString()}`);

  // 4. Test B: Login Verification through Common Auth Gateway
  console.log('\n--- Running Test B: Login & Redirect Context ---');
  const loginA = await login({ email: adminAEmail, password: 'AdminPass@123' });
  console.log(`Admin A Login Response:`);
  console.log(`  - Role: ${loginA.user.role}`);
  console.log(`  - Hospital: ${loginA.user.hospitalName} [${loginA.user.hospitalCode}]`);
  console.log(`  - Target Dashboard Route: /hospital-admin/dashboard (or /admin/dashboard)`);

  const loginB = await login({ email: adminBEmail, password: 'AdminPass@123' });
  console.log(`Admin B Login Response:`);
  console.log(`  - Role: ${loginB.user.role}`);
  console.log(`  - Hospital: ${loginB.user.hospitalName} [${loginB.user.hospitalCode}]`);
  console.log(`  - Target Dashboard Route: /hospital-admin/dashboard (or /admin/dashboard)`);

  // 5. Test C: Cross-Hospital Access & Tamper Resistance
  console.log('\n--- Running Test C: Data & Hospital Assignment Tamper Check ---');
  try {
    // Admin A tries to invite staff for Hospital B
    await inviteStaff(
      {
        name: 'Malicious Staff',
        email: 'malicious@sunrise.com',
        mobile: '9999900000',
        role: ROLES.RECEPTIONIST,
        hospitalId: sunrise._id.toString(), // attempting to cross into Hospital B
      },
      {
        _id: adminA._id,
        role: adminA.role,
        hospitalId: adminA.hospitalId, // Admin A is City Care
      }
    );
    console.error('FAIL: Admin A was able to perform operations on Hospital B!');
  } catch (err) {
    console.log(`PASS: Cross-hospital staff creation blocked with: "${err.message}" (Status ${err.statusCode})`);
  }

  // 6. Test D: Inactive Hospital Access Blocking
  console.log('\n--- Running Test D: Inactive Hospital (LifeLine) Access Check ---');
  // Seed an admin or staff for LifeLine
  const lifeLineAdminEmail = 'admin.lifeline@medisync.com';
  let lifeLineAdmin = await User.findOne({ email: lifeLineAdminEmail });
  if (!lifeLineAdmin) {
    const hashed = await bcrypt.hash('LifeLine@123', 12);
    lifeLineAdmin = await User.create({
      name: 'LifeLine Admin',
      email: lifeLineAdminEmail,
      mobile: '9826033333',
      password: hashed,
      role: ROLES.HOSPITAL_ADMIN,
      hospitalId: lifeLine._id,
      status: 'active',
      emailVerified: true,
    });
  }

  try {
    await login({ email: lifeLineAdminEmail, password: 'LifeLine@123' });
    console.error('FAIL: Staff of inactive hospital was able to log in!');
  } catch (err) {
    console.log(`PASS: Inactive hospital staff login blocked with: "${err.message}" (Status ${err.statusCode})`);
  }

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((e) => {
  logger.error(e);
  process.exit(1);
});
