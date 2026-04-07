import mongoose, { Schema, model, models } from "mongoose";

const MessageSchema = new Schema(
  {
    roomId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    username: { type: String, required: true },
    text: { type: String, default: "" },
    imageUrl: { type: String, default: null },
    imageMode: { type: String, enum: ["normal", "once"], default: "normal" }, // 👈 mới
    onceViewedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // ai đã xem ảnh once
    deleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true },
);

const Message = models.Message || model("Message", MessageSchema);
export default Message;
