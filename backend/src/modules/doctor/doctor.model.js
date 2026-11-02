import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    day: { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    slotMinutes: { type: Number, default: 30 },
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    qualifications: { type: String, default: 'MD' },
    experience: { type: String, default: '10+ yrs exp' },
    languages: { type: [String], default: ['English'] },
    hospital: { type: String, default: 'MediSync Main Hospital' },
    nextAvailable: { type: String, default: 'Today, 2:00 PM' },
    rating: { type: Number, default: 4.9 },
    reviewCount: { type: Number, default: 50 },
    image: { type: String, default: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400' },
    department: { type: String, trim: true },
    medicalRegistrationNumber: { type: String, trim: true },
    timing: { type: String }, 
    availability: { type: [availabilitySchema], default: [] },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', sparse: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true, default: null },
    status: { type: String, enum: ['pending', 'active', 'inactive'], default: 'pending' },
    verificationStatus: {
      type: String,
      enum: ['pending_verification', 'under_review', 'verified', 'rejected'],
      default: 'pending_verification',
    },
    isApproved: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: false },
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationReviewedAt: { type: Date },
    verificationRejectionReason: { type: String },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, strict: false }
);

doctorSchema.index({ specialization: 1 });
doctorSchema.index({ deletedAt: 1 });

export default mongoose.model('Doctor', doctorSchema);