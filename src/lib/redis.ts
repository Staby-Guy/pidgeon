import { Redis } from '@upstash/redis';

// Lazy singleton Redis client for Edge Runtime compatibility
let redisInstance: Redis | null = null;

export function getRedis(): Redis {
  if (!redisInstance) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Missing Upstash Redis credentials. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env.local file.');
    }
    redisInstance = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisInstance;
}

// ============================================
// User Operations
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  createdAt: number;
  [key: string]: string | number | undefined;
}

export async function createUser(user: User): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();

  // Store user data as record
  const userData: Record<string, string | number> = {
    id: user.id,
    username: user.username,
    email: user.email,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
  };
  if (user.avatar) userData.avatar = user.avatar;

  pipeline.hset(`user:${user.id}`, userData);

  // Create lookup mappings
  pipeline.set(`user:email:${user.email.toLowerCase()}`, user.id);
  pipeline.set(`user:username:${user.username.toLowerCase()}`, user.id);

  await pipeline.exec();
}

export async function getUserById(id: string): Promise<User | null> {
  const redis = getRedis();
  const user = await redis.hgetall(`user:${id}`);
  if (!user || Object.keys(user).length === 0) return null;
  return user as unknown as User;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const redis = getRedis();
  const userId = await redis.get(`user:email:${email.toLowerCase()}`);
  if (!userId) return null;
  return getUserById(userId as string);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const redis = getRedis();
  const userId = await redis.get(`user:username:${username.toLowerCase()}`);
  if (!userId) return null;
  return getUserById(userId as string);
}

export async function usernameExists(username: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`user:username:${username.toLowerCase()}`);
  return exists === 1;
}

export async function emailExists(email: string): Promise<boolean> {
  const redis = getRedis();
  const exists = await redis.exists(`user:email:${email.toLowerCase()}`);
  return exists === 1;
}

// ============================================
// Contact Operations
// ============================================

export async function addContact(userId: string, contactId: string): Promise<void> {
  const redis = getRedis();
  // Add bidirectional contact relationship
  const pipeline = redis.pipeline();
  pipeline.sadd(`user:${userId}:contacts`, contactId);
  pipeline.sadd(`user:${contactId}:contacts`, userId);
  await pipeline.exec();
}

export async function removeContact(userId: string, contactId: string): Promise<void> {
  const redis = getRedis();
  const pipeline = redis.pipeline();
  pipeline.srem(`user:${userId}:contacts`, contactId);
  pipeline.srem(`user:${contactId}:contacts`, userId);
  await pipeline.exec();
}

export async function getContacts(userId: string): Promise<string[]> {
  const redis = getRedis();
  const contacts = await redis.smembers(`user:${userId}:contacts`);
  return contacts as string[];
}

export async function isContact(userId: string, contactId: string): Promise<boolean> {
  const redis = getRedis();
  const isMember = await redis.sismember(`user:${userId}:contacts`, contactId);
  return isMember === 1;
}

// ============================================
// Message Operations
// ============================================

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
}

// Generate consistent room ID from two user IDs (alphabetically sorted)
export function getRoomId(userId1: string, userId2: string): string {
  return [userId1, userId2].sort().join('_');
}

export async function sendMessage(roomId: string, message: Message): Promise<void> {
  const redis = getRedis();
  // Store message in sorted set with timestamp as score
  await redis.zadd(`chat:${roomId}:messages`, {
    score: message.timestamp,
    member: JSON.stringify(message),
  });
}

export async function updateMessage(
  roomId: string,
  messageId: string,
  timestamp: number,
  newContent: string
): Promise<boolean> {
  const redis = getRedis();
  const key = `chat:${roomId}:messages`;

  console.log('[Redis] updateMessage params:', { key, timestamp, messageId });

  // 1. Get messages at this exact timestamp (should be only one usually, but could be collision)
  const messages = await redis.zrange(key, timestamp, timestamp, { byScore: true });
  console.log('[Redis] updateMessage found:', messages.length, 'messages');

  // 2. Find the specific message by ID
  let targetMessage: Message | null = null;
  let oldMember: string | null = null;

  for (const item of messages) {
    let msg: Message | null = null;
    let memberStr: string = '';

    if (typeof item === 'string') {
      try {
        msg = JSON.parse(item) as Message;
        memberStr = item;
      } catch {
        continue;
      }
    } else if (typeof item === 'object' && item !== null) {
      msg = item as Message;
      memberStr = JSON.stringify(item); // Re-stringify to remove it correctly if needed
      // Note: usage of zrem with string might fail if it was stored as string but returned as object.
      // Usually upstash returns what was stored. If we stored string, we get string. 
      // But let's be safe. If we get an object, it means it was deserialized. 
      // To remove it by member, we might need the original string OR the value.
    }

    if (msg && msg.id === messageId) {
      targetMessage = msg;
      oldMember = (typeof item === 'string') ? item : JSON.stringify(item);
      break;
    }
  }

  if (!targetMessage || !oldMember) return false;

  // 3. Create updated message
  const updatedMessage: Message & { isEdited?: boolean } = {
    ...targetMessage,
    content: newContent,
    isEdited: true,
  };

  // 4. Remove old and add new in a transaction
  const pipeline = redis.pipeline();
  pipeline.zrem(key, oldMember);
  pipeline.zadd(key, {
    score: timestamp, // Keep original timestamp to maintain order
    member: JSON.stringify(updatedMessage),
  });
  await pipeline.exec();

  return true;
}

export async function deleteMessage(
  roomId: string,
  messageId: string,
  timestamp: number
): Promise<boolean> {
  const redis = getRedis();
  const key = `chat:${roomId}:messages`;

  console.log('[Redis] deleteMessage params:', { key, timestamp, messageId });

  // 1. Get messages at this exact timestamp
  const messages = await redis.zrange(key, timestamp, timestamp, { byScore: true });
  console.log('[Redis] deleteMessage found:', messages.length, 'messages');

  // 2. Find the specific message by ID
  let oldMember: string | null = null;

  for (const item of messages) {
    let msg: Message | null = null;

    if (typeof item === 'string') {
      try {
        msg = JSON.parse(item) as Message;
      } catch {
        continue;
      }
    } else if (typeof item === 'object' && item !== null) {
      msg = item as Message;
    }

    if (msg && msg.id === messageId) {
      oldMember = (typeof item === 'string') ? item : JSON.stringify(item);
      break;
    }
  }

  if (!oldMember) return false;

  // 3. Remove it
  await redis.zrem(key, oldMember);
  return true;
}

export async function getMessages(
  roomId: string,
  limit: number = 50,
  _beforeTimestamp?: number
): Promise<Message[]> {
  const redis = getRedis();
  // Get messages in reverse order (newest first), then reverse for chronological
  const messages = await redis.zrange(
    `chat:${roomId}:messages`,
    0,
    limit - 1,
    { rev: true }
  );

  return (messages as unknown[])
    .map((msg) => {
      if (typeof msg === 'string') {
        try {
          return JSON.parse(msg) as Message;
        } catch {
          return null;
        }
      }
      return msg as Message;
    })
    .filter((msg): msg is Message => msg !== null)
    .reverse(); // Return in chronological order
}

export async function getLatestMessage(roomId: string): Promise<Message | null> {
  const redis = getRedis();
  const messages = await redis.zrange(`chat:${roomId}:messages`, -1, -1);
  if (!messages || messages.length === 0) return null;
  // Handle potential auto-deserialization by Upstash SDK
  const messageData = messages[0];
  if (typeof messageData === 'string') {
    try {
      return JSON.parse(messageData) as Message;
    } catch (e) {
      console.error('Failed to parse message JSON:', messageData, e);
      return null;
    }
  }
  return messageData as Message;
}
// ============================================
// Unread Message Operations
// ============================================

export async function incrementUnreadCount(userId: string, roomId: string): Promise<void> {
  const redis = getRedis();
  await redis.hincrby(`user:${userId}:unread`, roomId, 1);
}

export async function resetUnreadCount(userId: string, roomId: string): Promise<void> {
  const redis = getRedis();
  await redis.hdel(`user:${userId}:unread`, roomId);
}

export async function getUnreadCounts(userId: string): Promise<Record<string, number>> {
  const redis = getRedis();
  const unreadCounts = await redis.hgetall(`user:${userId}:unread`);
  if (!unreadCounts) return {};

  // Convert string values to numbers (Redis returns strings for hash values)
  const result: Record<string, number> = {};
  for (const [roomId, count] of Object.entries(unreadCounts)) {
    result[roomId] = Number(count);
  }
  return result;
}
