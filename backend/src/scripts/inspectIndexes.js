import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Booking from '../modules/booking/booking.model.js';
import Visit from '../modules/visit/visit.model.js';

const inspectIndexes = async () => {
  await connectDB();
  console.log('MongoDB Indexes Inspection (Step 3.4.4)');

  // Trigger index creation according to schema definitions
  await Booking.syncIndexes();
  await Visit.syncIndexes();

  const bookingIndexes = await Booking.collection.indexes();
  console.log('--- Bookings Collection Indexes ---');
  bookingIndexes.forEach((idx) => {
    console.log(`- Name: ${idx.name}`);
    console.log(`  Key: ${JSON.stringify(idx.key)}`);
    if (idx.unique) console.log(`  Unique: true`);
    if (idx.partialFilterExpression) console.log(`  PartialFilter: ${JSON.stringify(idx.partialFilterExpression)}`);
  });

  const visitIndexes = await Visit.collection.indexes();
  console.log('\n--- Visits Collection Indexes ---');
  visitIndexes.forEach((idx) => {
    console.log(`- Name: ${idx.name}`);
    console.log(`  Key: ${JSON.stringify(idx.key)}`);
    if (idx.unique) console.log(`  Unique: true`);
  });

  await mongoose.disconnect();
  process.exit(0);
};

inspectIndexes().catch((err) => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
