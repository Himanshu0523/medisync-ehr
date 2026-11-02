import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
        patient: { type: mongoose.Schema.Types.ObjectId , ref : 'User' , required: true }, 
        mobile: { type: String, required: true },
        date: { type: Date , required: true },
        time: { type: String , required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
        booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true },
        hospital: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Hospital',
            default: null,
        },
    },
    { timestamps: true }
);

visitSchema.index({ patient: 1, date: -1 });
visitSchema.index({ doctor: 1, date: -1 });
visitSchema.index({ hospital: 1, date: -1 });

export default mongoose.model('Visit', visitSchema);