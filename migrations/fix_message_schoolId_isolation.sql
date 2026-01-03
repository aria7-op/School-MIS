-- Migration: Make schoolId required in message system for proper isolation
-- Date: 2025-11-06
-- Description: Update message tables to require schoolId and set defaults for existing records

-- Step 1: Update existing NULL schoolId in conversations
-- Set to the school of the creator user
UPDATE conversations c
LEFT JOIN users u ON c.createdBy = u.id
SET c.schoolId = u.schoolId
WHERE c.schoolId IS NULL AND u.schoolId IS NOT NULL;

-- Set to school 1 for any remaining NULL (fallback)
UPDATE conversations
SET schoolId = 1
WHERE schoolId IS NULL;

-- Step 2: Update existing NULL schoolId in messages
UPDATE messages m
LEFT JOIN users u ON m.senderId = u.id
SET m.schoolId = u.schoolId
WHERE m.schoolId IS NULL AND u.schoolId IS NOT NULL;

UPDATE messages
SET schoolId = 1
WHERE schoolId IS NULL;

-- Step 3: Update existing NULL schoolId in conversation_participants
UPDATE conversation_participants cp
LEFT JOIN users u ON cp.userId = u.id
SET cp.schoolId = u.schoolId
WHERE cp.schoolId IS NULL AND u.schoolId IS NOT NULL;

UPDATE conversation_participants
SET schoolId = 1
WHERE schoolId IS NULL;

-- Step 4: Update existing NULL schoolId in message_threads
UPDATE message_threads mt
LEFT JOIN conversations c ON mt.conversationId = c.id
SET mt.schoolId = c.schoolId
WHERE mt.schoolId IS NULL AND c.schoolId IS NOT NULL;

UPDATE message_threads
SET schoolId = 1
WHERE schoolId IS NULL;

-- Step 5: Make columns NOT NULL
ALTER TABLE conversations 
MODIFY COLUMN schoolId BIGINT NOT NULL;

ALTER TABLE messages 
MODIFY COLUMN schoolId BIGINT NOT NULL;

ALTER TABLE conversation_participants 
MODIFY COLUMN schoolId BIGINT NOT NULL;

ALTER TABLE message_threads 
MODIFY COLUMN schoolId BIGINT NOT NULL;

-- Step 6: Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_schoolId ON conversations(schoolId);
CREATE INDEX IF NOT EXISTS idx_messages_schoolId ON messages(schoolId);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_schoolId ON conversation_participants(schoolId);
CREATE INDEX IF NOT EXISTS idx_message_threads_schoolId ON message_threads(schoolId);

-- Verification
SELECT 'Migration completed successfully' as status;
SELECT 
  (SELECT COUNT(*) FROM conversations WHERE schoolId IS NULL) as null_conversations,
  (SELECT COUNT(*) FROM messages WHERE schoolId IS NULL) as null_messages,
  (SELECT COUNT(*) FROM conversation_participants WHERE schoolId IS NULL) as null_participants,
  (SELECT COUNT(*) FROM message_threads WHERE schoolId IS NULL) as null_threads;






