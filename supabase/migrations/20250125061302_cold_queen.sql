/*
  # User Management System Schema

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `name` (text)
      - `last_login` (timestamp)
      - `last_activity` (timestamp)
      - `status` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for authenticated users
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text NOT NULL,
  name text NOT NULL,
  last_login timestamptz DEFAULT now(),
  last_activity timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on email
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles (email);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update any profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete any profile"
  ON user_profiles
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to update last activity
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for last activity
CREATE TRIGGER update_last_activity_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_activity();

  -- Drop existing policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

-- Create new insert policy with no auth check
CREATE POLICY "Enable insert for users during registration"
ON user_profiles
FOR INSERT
TO public
WITH CHECK (true);

-- First, drop all existing policies
DROP POLICY IF EXISTS "Enable insert for users during registration" ON user_profiles;
DROP POLICY IF EXISTS "Users can read all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update any profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete any profile" ON user_profiles;

-- Disable RLS temporarily
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create new basic policy
CREATE POLICY "Enable all access for public"
ON user_profiles
FOR ALL
TO public
USING (true)
WITH CHECK (true);