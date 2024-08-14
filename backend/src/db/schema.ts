import {
  pgTable,
  serial,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

export const fileTypeEnum = pgEnum("fileType", ["image", "video"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: serial("sender_id")
    .references(() => users.id)
    .notNull(),
  recipientId: serial("recipient_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  read: boolean("read").default(false).notNull(),
  fileUrl: varchar("fileUrl", { length: 255 }),
  fileType: fileTypeEnum("fileType").nullable(),
});
