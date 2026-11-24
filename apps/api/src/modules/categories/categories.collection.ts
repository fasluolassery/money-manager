import { TEXT_LIMITS } from "@money-manager/shared";
import { registerCollection } from "../../db/indexes.js";

export const CATEGORIES_COLLECTION = "categories";

/** How a category is stored (DESIGN 5.3). */
export type CategoryDocument = {
  userId: string;
  name: string;
  nameLower: string;
  emoji: string;
  type: "expense" | "income" | "both";
  builtIn: boolean;
  createdAt: Date;
  updatedAt: Date;
  version: number;
};

const categoriesValidator = {
  bsonType: "object",
  required: [
    "userId",
    "name",
    "nameLower",
    "emoji",
    "type",
    "builtIn",
    "createdAt",
    "updatedAt",
    "version",
  ],
  properties: {
    userId: { bsonType: "string", minLength: 1 },
    name: { bsonType: "string", minLength: 1, maxLength: TEXT_LIMITS.categoryName },
    nameLower: { bsonType: "string", minLength: 1 },
    emoji: { bsonType: "string", minLength: 1 },
    type: { enum: ["expense", "income", "both"] },
    builtIn: { bsonType: "bool" },
    createdAt: { bsonType: "date" },
    updatedAt: { bsonType: "date" },
    version: { bsonType: ["int", "long"], minimum: 1 },
  },
};

// Category names are unique per user, ignoring case (Spec Rule 5, DESIGN 5.4, 5.6).
registerCollection({
  name: CATEGORIES_COLLECTION,
  indexes: [
    { key: { userId: 1, nameLower: 1 }, options: { unique: true, name: "userId_nameLower" } },
  ],
  validator: categoriesValidator,
});
