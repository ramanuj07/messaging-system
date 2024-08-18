import { db } from "../db/db";
import { messages, users } from "../db/schema";
import { eq, and, or } from "drizzle-orm";

export async function getMessagesBetweenUsers(
  userId1: number,
  userId2: number
) {
  const result = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      recipientId: messages.recipientId,
      content: messages.content,
      timestamp: messages.timestamp,
      read: messages.read,
      fileUrl: messages.fileUrl,
      fileType: messages.fileType,
      senderUsername: users.username,
    })
    .from(messages)
    .leftJoin(users, eq(messages.senderId, users.id))
    .where(
      and(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.recipientId, userId2)
          ),
          and(eq(messages.senderId, userId2), eq(messages.recipientId, userId1))
        )
      )
    )
    .orderBy(messages.timestamp);

  return result;
}
