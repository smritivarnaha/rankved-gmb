import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const POSTS_FILE = path.join(DATA_DIR, "posts.json");

export interface PostData {
  id: string;
  profileId: string;
  profileName: string;
  clientName: string;
  summary: string;
  topicType: string;
  ctaType: string;
  ctaUrl: string;
  finalUrl: string;
  imageUrl: string | null;
  geoLat: string;
  geoLng: string;
  eventTitle: string;
  eventStart: string;
  eventEnd: string;
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED" | "FAILED";
  scheduledAt: string | null;
  publishedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readPosts(): PostData[] {
  ensureDataDir();
  if (!fs.existsSync(POSTS_FILE)) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify([], null, 2));
    return [];
  }
  return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
}

function writePosts(posts: PostData[]) {
  ensureDataDir();
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

export function getAllPosts(): PostData[] {
  return readPosts().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPostById(id: string): PostData | undefined {
  return readPosts().find((p) => p.id === id);
}

export function getPostsByProfile(profileId: string): PostData[] {
  return readPosts()
    .filter((p) => p.profileId === profileId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function createPost(data: Omit<PostData, "id" | "createdAt" | "updatedAt" | "publishedAt">): PostData {
  const posts = readPosts();
  const newPost: PostData = {
    ...data,
    id: crypto.randomUUID(),
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  posts.push(newPost);
  writePosts(posts);
  return newPost;
}

export function updatePost(id: string, data: Partial<PostData>): PostData | null {
  const posts = readPosts();
  const index = posts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  
  posts[index] = {
    ...posts[index],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  writePosts(posts);
  return posts[index];
}

export function deletePost(id: string): boolean {
  const posts = readPosts();
  const filtered = posts.filter((p) => p.id !== id);
  if (filtered.length === posts.length) return false;
  writePosts(filtered);
  return true;
}
