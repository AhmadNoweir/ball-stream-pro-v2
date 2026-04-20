import { Router } from "express";
import prisma from "./prisma";
import { requireAuth } from "./middleware";
import { onlineUsers } from "./socket";

const router = Router();
router.use(requireAuth);

// GET /api/chat/contacts - returns all other users with last message, online status, and unread count
router.get("/contacts", async (req, res) => {
  const userId = req.userId!;

  const users = await prisma.user.findMany({
    where: { id: { not: userId } },
    select: { id: true, username: true, avatar: true },
  });

  const contacts = await Promise.all(
    users.map(async (u) => {
      const lastMsg = await prisma.message.findFirst({
        where: {
          OR: [
            { senderId: userId, receiverId: u.id },
            { senderId: u.id, receiverId: userId },
          ],
        },
        orderBy: { timestamp: "desc" },
      });

      // Count unread messages FROM this contact TO me
      const unreadCount = await prisma.message.count({
        where: {
          senderId: u.id,
          receiverId: userId,
          isRead: false,
        },
      });

      return {
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        lastMessage: lastMsg?.content || "",
        online: onlineUsers.has(u.id),
        unreadCount,
      };
    })
  );

  res.json(contacts);
});

// GET /api/chat/unread - returns total unread count across all contacts
router.get("/unread", async (req, res) => {
  const userId = req.userId!;

  const count = await prisma.message.count({
    where: {
      receiverId: userId,
      isRead: false,
    },
  });

  res.json({ unreadCount: count });
});

// GET /api/chat/messages/:contactId - returns messages between current user and contact
router.get("/messages/:contactId", async (req, res) => {
  const userId = req.userId!;
  const contactId = req.params.contactId;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: contactId },
        { senderId: contactId, receiverId: userId },
      ],
    },
    orderBy: { timestamp: "asc" },
  });

  const result = messages.map((m) => ({
    id: m.id,
    sender_id: m.senderId,
    receiver_id: m.receiverId,
    content: m.content,
    timestamp: m.timestamp.toISOString(),
  }));

  res.json(result);
});

// POST /api/chat/messages - send a message
router.post("/messages", async (req, res) => {
  const userId = req.userId!;
  const { receiverId, content } = req.body;

  if (!receiverId || !content) {
    return res.status(400).json({ error: "receiverId and content are required" });
  }

  const message = await prisma.message.create({
    data: {
      senderId: userId,
      receiverId,
      content,
    },
  });

  res.json({
    id: message.id,
    sender_id: message.senderId,
    receiver_id: message.receiverId,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
  });
});

// POST /api/chat/read/:contactId - mark all messages from contact as read
router.post("/read/:contactId", async (req, res) => {
  const userId = req.userId!;
  const contactId = req.params.contactId;

  await prisma.message.updateMany({
    where: {
      senderId: contactId,
      receiverId: userId,
      isRead: false,
    },
    data: { isRead: true },
  });

  res.json({ success: true });
});

export default router;
