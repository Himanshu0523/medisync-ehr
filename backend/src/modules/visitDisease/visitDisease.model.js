import mongoose from 'mongoose';

const visitDiseaseSchema = new mongoose.Schema(
    {
        visit: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', required: true },
        disease: { type: String, required: true, trim: true },
        prescription: { type: String, required: true },
    },
    { timestamps: true }
);

visitDiseaseSchema.index({ visit: 1 });

export default mongoose.model('VisitDisease', visitDiseaseSchema);