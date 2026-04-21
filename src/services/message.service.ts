import type { Types } from "mongoose";
import Message from "../models/Message.model.js";
import User from "../models/User.model.js";
import ApiError from "../utils/ApiError.js";

export interface CreateMessageInput {
  receiverId: string;
  subject: string;
  content: string;
  senderId: Types.ObjectId;
}

export const createMessageService = async (data: CreateMessageInput) => {
  // Validate receiverId is a valid MongoDB ObjectId
  if (!data.receiverId || typeof data.receiverId !== 'string' || data.receiverId.trim() === '') {
    throw new ApiError(400, "Invalid receiver ID provided.");
  }

  // Check if receiverId looks like a valid ObjectId (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(data.receiverId)) {
    throw new ApiError(400, `Invalid receiver ID format. Received: "${data.receiverId}". Expected a valid MongoDB ObjectId.`);
  }

  if (data.receiverId === data.senderId.toString()) {
    throw new ApiError(400, "Cannot send a message to yourself.");
  }

  const receiver = await User.findById(data.receiverId).select("_id");
  if (!receiver) {
    throw new ApiError(400, "Receiver not found.");
  }

  const message = await Message.create({
    senderId: data.senderId,
    receiverId: data.receiverId,
    subject: data.subject,
    content: data.content,
  });

  return message;
};

export const getInboxService = async (
  userId: string,
  filters: {
    isRead?: boolean;
    page?: number;
    limit?: number;
  },
) => {
  const { isRead, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = { receiverId: userId };
  if (isRead !== undefined) query.isRead = isRead;

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate("senderId", "firstname lastname email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Message.countDocuments(query),
  ]);

  return {
    messages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

export const getSentService = async (
  userId: string,
  filters: {
    page?: number;
    limit?: number;
  },
) => {
  const { page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = { senderId: userId };

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate("receiverId", "firstname lastname email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Message.countDocuments(query),
  ]);

  return {
    messages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

const participantIdString = (ref: unknown): string => {
  if (ref && typeof ref === "object") {
    // Check for 'id' first (from toJSON transform), then '_id'
    if ("id" in ref) {
      return String((ref as { id: string }).id);
    }
    if ("_id" in ref) {
      return String((ref as { _id: { toString: () => string } })._id);
    }
  }
  return String(ref);
};

export const getMessageByIdService = async (id: string, userId: string) => {
  const message = await Message.findById(id)
    .populate("senderId", "firstname lastname email")
    .populate("receiverId", "firstname lastname email");

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const senderStr = participantIdString(message.senderId);
  const receiverStr = participantIdString(message.receiverId);

  if (senderStr !== userId && receiverStr !== userId) {
    throw new ApiError(403, "You are not authorized to view this message");
  }

  return message;
};

export const markAsReadService = async (id: string, userId: string) => {
  const message = await Message.findById(id);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (message.receiverId.toString() !== userId) {
    throw new ApiError(
      403,
      "You are not authorized to mark this message as read",
    );
  }

  message.isRead = true;
  message.readAt = new Date();
  await message.save();

  return message;
};

export const deleteMessageService = async (id: string, userId: string) => {
  const message = await Message.findById(id);

  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  if (
    message.senderId.toString() !== userId &&
    message.receiverId.toString() !== userId
  ) {
    throw new ApiError(403, "You are not authorized to delete this message");
  }

  await Message.findByIdAndDelete(id);
  return message;
};

export const getUnreadCountService = async (userId: string) => {
  const count = await Message.countDocuments({
    receiverId: userId,
    isRead: false,
  });

  return { unreadCount: count };
};


export const getAllMessagesService = async (
  filters: {
    search?: string;
    isRead?: boolean;
    page?: number;
    limit?: number;
  },
) => {
  const { search, isRead, page = 1, limit = 20 } = filters;

  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { subject: { $regex: search, $options: "i" } },
      { "senderId.firstname": { $regex: search, $options: "i" } },
      { "senderId.lastname": { $regex: search, $options: "i" } },
    ];
  }

  if (isRead !== undefined) query.isRead = isRead;

  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate("senderId", "firstname lastname email")
      .populate("receiverId", "firstname lastname email")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Message.countDocuments(query),
  ]);

  return {
    messages,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
