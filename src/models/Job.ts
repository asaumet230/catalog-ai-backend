import { Schema, model } from 'mongoose';

import { IJob } from '../interfaces';

const jobSchema = new Schema<IJob>({
    userId: {
        type      : Schema.Types.ObjectId,
        ref       : 'User',
        required  : [true, 'User ID is required'],
        index     : true,
    },
    catalogId: {
        type      : Schema.Types.ObjectId,
        ref       : 'Catalog',
    },
    platform: {
        type      : String,
        required  : [true, 'Platform is required'],
        lowercase : true,
        trim      : true,
    },
    status: {
        type      : String,
        enum      : ['queued', 'processing', 'completed', 'failed'],
        default   : 'queued',
    },
    progress: {
        type      : Number,
        default   : 0,
        min       : [0, 'Progress cannot be negative'],
        max       : [100, 'Progress cannot exceed 100'],
    },
    totalProducts: {
        type      : Number,
        required  : [true, 'Total products is required'],
        min       : [0, 'Total products cannot be negative'],
    },
    processedProducts: {
        type      : Number,
        default   : 0,
        min       : [0, 'Processed products cannot be negative'],
    },
    result: {
        type      : Schema.Types.Mixed,
    },
    error: {
        type      : String,
        trim      : true,
    },
    createdAt: {
        type      : Date,
        default   : Date.now,
    },
    completedAt: {
        type      : Date,
    },
});

jobSchema.methods.toJSON = function() {
    const { __v, ...job } = this.toObject();
    return job;
}

export const Job = model<IJob>('Job', jobSchema);
