import { Document, Types } from 'mongoose';

export interface IJob extends Document {
    userId          : Types.ObjectId;
    catalogId?      : Types.ObjectId;
    platform        : string;
    status          : 'queued' | 'processing' | 'completed' | 'failed';
    progress        : number;
    totalProducts   : number;
    processedProducts: number;
    result?         : any;
    error?          : string;
    createdAt       : Date;
    completedAt?    : Date;
}
