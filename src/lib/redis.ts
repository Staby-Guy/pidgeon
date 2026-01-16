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
