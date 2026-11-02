import mongoose from 'mongoose';

const testSchema = new mongoose.Schema(
  {
    visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true, index: true },
    visitDisease: { type: mongoose.Schema.Types.ObjectId, ref: 'VisitDisease', index: true },
    testName: { type: String, required: true, trim: true },
    testDate: { type: Date, required: true },
    reportUrl: { type: String, default: '' },
    reportText: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);



export default mongoose.model('Test', testSchema);