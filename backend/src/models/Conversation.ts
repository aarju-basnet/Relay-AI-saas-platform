import { Schema, model, Document } from "mongoose";

/* ===========================================
   Message Metadata
=========================================== */

export interface IMessageMetadata {
  model?: string;
  provider?: string;
  tokens?: number;
  latency?: number;
  fallback?: boolean;
  confidence?: number;
}

/* ===========================================
   Message
=========================================== */

export interface IMessage {
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: Date;
  metadata?: IMessageMetadata;
}

/* ===========================================
   Conversation
=========================================== */

export interface IConversation extends Document {
  orgId: string;
  userId: string;

  createdByName: string;

  assignedTo: string | null;
  assignedToName: string | null;

  title: string;

  messages: IMessage[];

  createdAt: Date;
  updatedAt: Date;
}

/* ===========================================
   Metadata Schema
=========================================== */

const metadataSchema = new Schema<IMessageMetadata>(
  {
    model: {
      type: String,
      default: null,
    },

    provider: {
      type: String,
      default: null,
    },

    tokens: {
      type: Number,
      default: 0,
    },

    latency: {
      type: Number,
      default: 0,
    },

    fallback: {
      type: Boolean,
      default: false,
    },

    confidence: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/* ===========================================
   Message Schema
=========================================== */

const messageSchema = new Schema<IMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },

    content: {
      type: String,
      required: true,
    },

    metadata: {
      type: metadataSchema,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
  }
);

/* ===========================================
   Conversation Schema
=========================================== */

const conversationSchema = new Schema<IConversation>(
  {
    orgId: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
    },

    createdByName: {
      type: String,
      required: true,
    },

    assignedTo: {
      type: String,
      default: null,
      index: true,
    },

    assignedToName: {
      type: String,
      default: null,
    },

    title: {
      type: String,
      default: "New conversation",
    },

    messages: [messageSchema],
  },
  {
    timestamps: true,
  }
);

export const Conversation = model<IConversation>(
  "Conversation",
  conversationSchema
);