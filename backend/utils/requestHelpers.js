import mongoose from "mongoose";

/** True only for a real 24-hex-character ObjectId string. */
export const isObjectId = (id) =>
  typeof id === "string" && mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;

/** Multipart form fields arrive as strings; accept either JSON text or an already-parsed value. */
export const parseJsonField = (value, fieldName) => {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new BadRequest(`${fieldName} must be valid JSON`);
  }
};

export const isOwnerOrAdmin = (doc, user) =>
  user?.role === "admin" || (doc.createdBy && String(doc.createdBy) === String(user?.id));

export class BadRequest extends Error {}
