-- SPSM Database Schema
-- Secure Privacy-focused Social Media Platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE privacy_level AS ENUM ('PUBLIC', 'FRIENDS_ONLY', 'PRIVATE');

CREATE TYPE otp_type AS ENUM ('LOGIN', 'RESET', 'VERIFY');

CREATE TYPE event_type AS ENUM (
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'LOGOUT',
  'REGISTER',
  'PASSWORD_CHANGE',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET',
  'FILE_UPLOAD',
  'FILE_DOWNLOAD',
  'PRIVACY_UPDATE',
  'TWO_FA_ENABLED',
  'TWO_FA_DISABLED',
  'ACCOUNT_LOCKED',
  'ACCOUNT_UNLOCKED',
  'SUSPICIOUS_ACTIVITY',
  'OTP_VERIFIED',
  'MESSAGE_SENT',
  'FILE_SHARE',
  'FILE_RECEIVED'
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  bio TEXT,
  twofa_enabled BOOLEAN DEFAULT FALSE,
  twofa_secret VARCHAR(255),
  email_verified BOOLEAN DEFAULT FALSE,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP,
  last_login_at TIMESTAMP,
  last_login_ip VARCHAR(45),
  last_active_at TIMESTAMP,
  is_online BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================
-- OTP CODES TABLE
-- ============================================

CREATE TABLE otp_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_code VARCHAR(255) NOT NULL,
  type otp_type NOT NULL,
  expiry_time TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_user ON otp_codes(user_id);
CREATE INDEX idx_otp_expiry ON otp_codes(expiry_time);

-- ============================================
-- PRIVACY SETTINGS TABLE
-- ============================================

CREATE TABLE privacy_settings (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  profile_visibility privacy_level DEFAULT 'PUBLIC',
  post_visibility privacy_level DEFAULT 'FRIENDS_ONLY',
  contact_visibility privacy_level DEFAULT 'PRIVATE',
  last_seen_visibility privacy_level DEFAULT 'FRIENDS_ONLY',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- USER ENCRYPTION KEYS TABLE
-- ============================================

CREATE TABLE user_encryption_keys (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  encrypted_private_key TEXT NOT NULL,
  iv VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- MESSAGES TABLE
-- ============================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_message TEXT NOT NULL,
  iv VARCHAR(64) NOT NULL,
  auth_tag VARCHAR(64) NOT NULL,
  status VARCHAR(20) DEFAULT 'sent',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, timestamp);

-- ============================================
-- FILES TABLE
-- ============================================

CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  original_name VARCHAR(255) NOT NULL,
  encrypted_path VARCHAR(500) NOT NULL,
  encryption_key VARCHAR(128) NOT NULL,
  iv VARCHAR(64) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  scan_status VARCHAR(20) DEFAULT 'pending',
  file_hash VARCHAR(128),
  auth_tag VARCHAR(64),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_files_owner ON files(owner_id);

-- ============================================
-- SHARED FILES TABLE
-- ============================================

CREATE TABLE shared_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(file_id, shared_with)
);

CREATE INDEX idx_shared_files_file ON shared_files(file_id);
CREATE INDEX idx_shared_files_with ON shared_files(shared_with);

-- ============================================
-- PASSWORD RESETS TABLE
-- ============================================

CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reset_token VARCHAR(255) NOT NULL,
  expiry_time TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_resets_user ON password_resets(user_id);
CREATE INDEX idx_resets_token ON password_resets(reset_token);

-- ============================================
-- SECURITY LOGS TABLE
-- ============================================

CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type event_type NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_user ON security_logs(user_id);
CREATE INDEX idx_logs_event ON security_logs(event_type);
CREATE INDEX idx_logs_timestamp ON security_logs(timestamp);

-- ============================================
-- FRIENDS TABLE (for privacy enforcement)
-- ============================================

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

CREATE INDEX idx_friends_user ON friendships(user_id);
CREATE INDEX idx_friends_friend ON friendships(friend_id);

-- ============================================
-- POSTS TABLE
-- ============================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_url VARCHAR(500),
  caption TEXT,
  hashtags VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user ON posts(user_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);

-- ============================================
-- POST LIKES TABLE
-- ============================================

CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(post_id, user_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);

-- ============================================
-- POST COMMENTS TABLE
-- ============================================

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id);
