/*
  # Initial Database Schema for PKCM Learning Management System

  This migration creates the complete database schema for the Promise Kingdom Community Ministries 
  Learning Management System, including all tables for user management, courses, lessons, events, 
  live classes, and administrative functions.

  ## New Tables

  ### Core User & Authentication
  - `sessions` - Session storage for authentication
  - `users` - User accounts with roles (admin, instructor, student)

  ### Course Management  
  - `courses` - Course catalog with metadata
  - `modules` - Course modules for organizing lessons
  - `lessons` - Individual lesson content
  - `enrollments` - Student course enrollments
  - `lesson_progress` - Student progress tracking

  ### Communication & Discussion
  - `discussions` - Lesson discussions and replies
  - `announcements` - System and course announcements
  - `notifications` - User notifications

  ### Assessment & Certification
  - `quizzes` - Lesson quizzes
  - `quiz_attempts` - Student quiz attempts and scores
  - `certificates` - Course completion certificates

  ### Live Classes & Events
  - `live_classes` - Scheduled live class sessions
  - `live_class_attendees` - Attendance tracking
  - `live_class_resources` - Class materials
  - `video_meetings` - Video meeting sessions
  - `video_meeting_participants` - Meeting attendance
  - `church_events` - Church events calendar
  - `event_registrations` - Event registration tracking
  - `event_reminders` - Event reminder notifications

  ### Groups & Community
  - `church_groups` - Community groups
  - `group_members` - Group membership

  ### Administrative
  - `payments` - Payment transactions
  - `course_reviews` - Course ratings and reviews
  - `instructor_assignments` - Instructor course assignments
  - `content_library` - Media library
  - `audit_logs` - System audit trail
  - `admin_activities` - Admin activity tracking
  - `admin_onboarding` - Admin onboarding progress
  - `system_settings` - System configuration

  ## Security
  - All tables use appropriate indexes for performance
  - Foreign key constraints maintain referential integrity
  - Timestamps for audit trails
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS IDX_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR UNIQUE,
  username VARCHAR UNIQUE,
  password VARCHAR NOT NULL,
  first_name VARCHAR,
  last_name VARCHAR,
  phone_number VARCHAR,
  profile_image_url VARCHAR,
  role VARCHAR DEFAULT 'student',
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMP,
  reset_token VARCHAR,
  reset_token_expires TIMESTAMP,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor_id VARCHAR NOT NULL REFERENCES users(id),
  image_url VARCHAR,
  price INTEGER,
  is_published BOOLEAN DEFAULT false,
  prerequisites TEXT[],
  tags TEXT[],
  difficulty VARCHAR,
  estimated_hours INTEGER,
  drip_content BOOLEAN DEFAULT false,
  release_schedule JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url VARCHAR,
  duration INTEGER,
  order_index INTEGER NOT NULL,
  content TEXT,
  resources_url VARCHAR,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  is_completed BOOLEAN DEFAULT false,
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Discussions table
CREATE TABLE IF NOT EXISTS discussions (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  parent_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id SERIAL PRIMARY KEY,
  lesson_id INTEGER NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  questions JSONB NOT NULL,
  passing_score INTEGER DEFAULT 70,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  quiz_id INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP DEFAULT NOW()
);

-- Certificates table
CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  certificate_url VARCHAR,
  template_id INTEGER,
  issued_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id),
  amount INTEGER NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  status VARCHAR NOT NULL,
  payment_method VARCHAR,
  transaction_id VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id VARCHAR NOT NULL REFERENCES users(id),
  target_audience VARCHAR DEFAULT 'all',
  course_id INTEGER REFERENCES courses(id),
  is_published BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR NOT NULL,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Content library table
CREATE TABLE IF NOT EXISTS content_library (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url VARCHAR NOT NULL,
  file_type VARCHAR NOT NULL,
  file_size INTEGER,
  tags TEXT[],
  uploaded_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  action VARCHAR NOT NULL,
  resource_type VARCHAR NOT NULL,
  resource_id VARCHAR,
  details JSONB,
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Course reviews table
CREATE TABLE IF NOT EXISTS course_reviews (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  comment TEXT,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Instructor assignments table
CREATE TABLE IF NOT EXISTS instructor_assignments (
  id SERIAL PRIMARY KEY,
  instructor_id VARCHAR NOT NULL REFERENCES users(id),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  assigned_by VARCHAR NOT NULL REFERENCES users(id),
  permissions TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  category VARCHAR,
  updated_by VARCHAR REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video meetings table
CREATE TABLE IF NOT EXISTS video_meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  provider VARCHAR(50) NOT NULL,
  meeting_id VARCHAR(255),
  meeting_url TEXT,
  meeting_password VARCHAR(100),
  scheduled_date_time TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL DEFAULT 60,
  max_participants INTEGER DEFAULT 100,
  course_id INTEGER REFERENCES courses(id),
  instructor_id VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled',
  is_recorded BOOLEAN DEFAULT false,
  recording_url TEXT,
  require_password BOOLEAN DEFAULT true,
  enable_waiting_room BOOLEAN DEFAULT true,
  enable_chat BOOLEAN DEFAULT true,
  enable_screen_share BOOLEAN DEFAULT true,
  allow_early_entry BOOLEAN DEFAULT false,
  settings JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Video meeting participants table
CREATE TABLE IF NOT EXISTS video_meeting_participants (
  id SERIAL PRIMARY KEY,
  meeting_id INTEGER NOT NULL REFERENCES video_meetings(id),
  user_id VARCHAR(255) NOT NULL,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  duration_minutes INTEGER,
  role VARCHAR(20) DEFAULT 'attendee',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Live classes table
CREATE TABLE IF NOT EXISTS live_classes (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  instructor_id VARCHAR(255) NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL,
  platform VARCHAR(50) NOT NULL,
  meeting_id VARCHAR(255),
  meeting_url TEXT,
  meeting_password VARCHAR(100),
  status VARCHAR(50) DEFAULT 'scheduled' NOT NULL,
  max_attendees INTEGER DEFAULT 100,
  recording_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Live class attendees table
CREATE TABLE IF NOT EXISTS live_class_attendees (
  id SERIAL PRIMARY KEY,
  live_class_id INTEGER NOT NULL REFERENCES live_classes(id),
  user_id VARCHAR(255) NOT NULL REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'registered' NOT NULL,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  attendance_duration INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Live class resources table
CREATE TABLE IF NOT EXISTS live_class_resources (
  id SERIAL PRIMARY KEY,
  live_class_id INTEGER NOT NULL REFERENCES live_classes(id),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  uploaded_by VARCHAR(255) NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin activities table
CREATE TABLE IF NOT EXISTS admin_activities (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  action VARCHAR NOT NULL,
  entity_type VARCHAR NOT NULL,
  entity_id VARCHAR,
  details JSONB,
  ip_address VARCHAR,
  user_agent VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Admin onboarding table
CREATE TABLE IF NOT EXISTS admin_onboarding (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  step VARCHAR NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Church events table
CREATE TABLE IF NOT EXISTS church_events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  image_url VARCHAR(500),
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  event_type VARCHAR(100) DEFAULT 'general',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern JSONB,
  max_attendees INTEGER,
  registration_required BOOLEAN DEFAULT false,
  registration_deadline TIMESTAMP,
  contact_person VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  is_published BOOLEAN DEFAULT true,
  created_by VARCHAR NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Event registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES church_events(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  registered_at TIMESTAMP DEFAULT NOW(),
  attendance_status VARCHAR(50) DEFAULT 'registered',
  notes TEXT
);

-- Church groups table
CREATE TABLE IF NOT EXISTS church_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  leader_id VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Group members table
CREATE TABLE IF NOT EXISTS group_members (
  group_id INTEGER NOT NULL REFERENCES church_groups(id) ON DELETE CASCADE,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  PRIMARY KEY (group_id, user_id)
);

-- Event reminders table
CREATE TABLE IF NOT EXISTS event_reminders (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES church_events(id) ON DELETE CASCADE,
  send_at TIMESTAMP NOT NULL,
  message TEXT NOT NULL,
  sent BOOLEAN DEFAULT false
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_discussions_lesson ON discussions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_course ON live_classes(course_id);
CREATE INDEX IF NOT EXISTS idx_live_classes_instructor ON live_classes(instructor_id);
CREATE INDEX IF NOT EXISTS idx_church_events_start_date ON church_events(start_date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
