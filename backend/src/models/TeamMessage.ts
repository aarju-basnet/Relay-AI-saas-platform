import mongoose, { Schema, Document } from "mongoose";

export interface ITeamMessage extends Document {
  orgId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: Date;
}

const TeamMessageSchema = new Schema<ITeamMessage>({
  orgId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export const TeamMessage = mongoose.model<ITeamMessage>(
  "TeamMessage",
  TeamMessageSchema
);