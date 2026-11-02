import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
        date: { type: Date, required: true },
        time: { type: String, required: true }, 
        hospital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

bookingSchema.index(
    { doctor: 1, date: 1, time: 1 },
    { unique: true, partialFilterExpression: { status: { $in: ['pending', 'confirmed'] } } }
);

bookingSchema.index({ patient: 1, date: -1 });
bookingSchema.index({ hospital: 1, date: -1 });
bookingSchema.index({ hospital: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);