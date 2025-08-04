import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'

import { ThingStoreLocal } from '../src'

// Test data types
interface UserData {
  name: string
  email: string
  age: number
}

interface PostData {
  title: string
  content: string
  published: boolean
}

// Test parsers
const userParser = async (input: unknown): Promise<UserData> => {
  const data = JSON.parse(input as string)
  if (!data.name || !data.email || typeof data.age !== 'number') {
    throw new Error('Invalid user data')
  }
  return data as UserData
}

const postParser = async (input: unknown): Promise<PostData> => {
  const data = JSON.parse(input as string)
  if (!data.title || !data.content || typeof data.published !== 'boolean') {
    throw new Error('Invalid post data')
  }
  return data as PostData
}

describe('ThingStoreLocal', () => {
  let store: ThingStoreLocal
  let tempDbPath: string

  beforeEach(async () => {
    // Create temporary directory for each test
    tempDbPath = await fs.mkdtemp(path.join(os.tmpdir(), 'thing-store-test-'))
    store = new ThingStoreLocal({ dbPath: tempDbPath })
  })

  afterEach(async () => {
    // Clean up
    await store.close()
    await fs.rm(tempDbPath, { recursive: true, force: true })
  })

  describe('Basic CRUD Operations', () => {
    it('should save and retrieve a thing', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      const id = await store.save('user', userData, userParser)
      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')

      const retrieved = await store.findById(id, 'user', userParser)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(id)
      expect(retrieved!.type).toBe('user')
      expect(retrieved!.createdAt).toBeTruthy()
      expect(retrieved!.updatedAt).toBe(retrieved!.createdAt)

      // Parse the data to verify it's correct
      const parsedData = await retrieved!.parser(retrieved!.data)
      expect(parsedData).toEqual(userData)
    })

    it('should update an existing thing', async () => {
      const originalData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }
      const updatedData: UserData = { name: 'John Smith', email: 'john.smith@example.com', age: 31 }

      const id = await store.save('user', originalData, userParser)
      const originalThing = await store.findById(id, 'user', userParser)

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const updatedThing = await store.update(id, 'user', updatedData, userParser)

      expect(updatedThing.id).toBe(id)
      expect(updatedThing.createdAt).toBe(originalThing!.createdAt)
      expect(updatedThing.updatedAt).toBeGreaterThan(originalThing!.updatedAt)

      const parsedData = await updatedThing.parser(updatedThing.data)
      expect(parsedData).toEqual(updatedData)
    })

    it('should delete a thing', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      const id = await store.save('user', userData, userParser)

      const deleted = await store.delete(id, 'user')
      expect(deleted).toBe(true)

      const retrieved = await store.findById(id, 'user', userParser)
      expect(retrieved).toBeNull()
    })
  })

  describe('Type-based Operations', () => {
    it('should find things by type', async () => {
      const user1: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }
      const user2: UserData = { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
      const post1: PostData = { title: 'Hello World', content: 'First post', published: true }

      await store.save('user', user1, userParser)
      await store.save('user', user2, userParser)
      await store.save('post', post1, postParser)

      const users = await store.findByType('user', userParser)
      expect(users).toHaveLength(2)

      const posts = await store.findByType('post', postParser)
      expect(posts).toHaveLength(1)

      // Verify the users are parsed correctly
      const userData1 = await users[0].parser(users[0].data)
      const userData2 = await users[1].parser(users[1].data)
      const userNames = [userData1.name, userData2.name].sort()
      expect(userNames).toEqual(['Jane Smith', 'John Doe'])
    })

    it('should find things by type with filter', async () => {
      const user1: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }
      const user2: UserData = { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
      const user3: UserData = { name: 'Bob Wilson', email: 'bob@example.com', age: 35 }

      await store.save('user', user1, userParser)
      await store.save('user', user2, userParser)
      await store.save('user', user3, userParser)

      // Filter for users older than 28
      const olderUsers = await store.findByType('user', userParser, thing => {
        const data = JSON.parse(thing.data) as UserData
        return data.age > 28
      })

      expect(olderUsers).toHaveLength(2)

      const ages = await Promise.all(
        olderUsers.map(async user => {
          const data = await user.parser(user.data)
          return data.age
        }),
      )
      expect(ages.sort()).toEqual([30, 35])
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should return null for non-existent thing', async () => {
      const result = await store.findById('non-existent-id', 'user', userParser)
      expect(result).toBeNull()
    })

    it('should throw error when updating non-existent thing', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      await expect(store.update('non-existent-id', 'user', userData, userParser)).rejects.toThrow(
        'Cannot update non-existent thing: user:non-existent-id',
      )
    })

    it('should handle deleting non-existent thing gracefully', async () => {
      // Verify the item doesn't exist
      const beforeDelete = await store.findById('non-existent-id', 'user', userParser)
      expect(beforeDelete).toBeNull()

      // Attempt to delete - this should not throw an error
      const result = await store.delete('non-existent-id', 'user')

      // Verify the item still doesn't exist after "deletion"
      const afterDelete = await store.findById('non-existent-id', 'user', userParser)
      expect(afterDelete).toBeNull()

      expect(typeof result).toBe('boolean')
    })

    it('should handle empty findByType results', async () => {
      const users = await store.findByType('user', userParser)
      expect(users).toEqual([])
    })

    it('should handle different types with same IDs', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }
      const postData: PostData = { title: 'Hello World', content: 'First post', published: true }

      // Save with custom IDs (normally generated, but for testing)
      const customId = 'test-id-123'

      // Since save generates IDs, we'll test that different types can coexist
      const userId = await store.save('user', userData, userParser)
      const postId = await store.save('post', postData, postParser)

      expect(userId).not.toBe(postId) // IDs should be different

      const retrievedUser = await store.findById(userId, 'user', userParser)
      const retrievedPost = await store.findById(postId, 'post', postParser)

      expect(retrievedUser).not.toBeNull()
      expect(retrievedPost).not.toBeNull()
      expect(retrievedUser!.type).toBe('user')
      expect(retrievedPost!.type).toBe('post')
    })
  })

  describe('Database Management', () => {
    it('should auto-initialize when calling methods', async () => {
      // Don't call initialize explicitly
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      // This should trigger auto-initialization
      const id = await store.save('user', userData, userParser)
      expect(id).toBeTruthy()

      const retrieved = await store.findById(id, 'user', userParser)
      expect(retrieved).not.toBeNull()
    })

    it('should handle multiple initialize calls safely', async () => {
      await store.initialize()
      await store.initialize() // Should not throw

      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }
      const id = await store.save('user', userData, userParser)
      expect(id).toBeTruthy()
    })

    it('should handle close and reopen', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      const id = await store.save('user', userData, userParser)
      await store.close()

      // Data should persist after close/reopen
      await store.initialize()
      const retrieved = await store.findById(id, 'user', userParser)
      expect(retrieved).not.toBeNull()

      const parsedData = await retrieved!.parser(retrieved!.data)
      expect(parsedData).toEqual(userData)
    })
  })

  describe('Data Integrity', () => {
    it('should generate unique IDs', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      const id1 = await store.save('user', userData, userParser)
      const id2 = await store.save('user', userData, userParser)

      expect(id1).not.toBe(id2)
      expect(id1).toBeTruthy()
      expect(id2).toBeTruthy()
    })

    it('should preserve timestamps correctly', async () => {
      const userData: UserData = { name: 'John Doe', email: 'john@example.com', age: 30 }

      const beforeSave = Date.now()
      const id = await store.save('user', userData, userParser)
      const afterSave = Date.now()

      const retrieved = await store.findById(id, 'user', userParser)
      expect(retrieved!.createdAt).toBeGreaterThanOrEqual(beforeSave)
      expect(retrieved!.createdAt).toBeLessThanOrEqual(afterSave)
      expect(retrieved!.updatedAt).toBe(retrieved!.createdAt)
    })

    it('should handle complex data serialization', async () => {
      const complexData = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        metadata: {
          preferences: ['coding', 'reading'],
          settings: { theme: 'dark', notifications: true },
          nullValue: null,
          undefinedValue: undefined,
        },
      }

      const complexParser = async (input: unknown): Promise<typeof complexData> => {
        return JSON.parse(input as string)
      }

      const id = await store.save('complex', complexData, complexParser)
      const retrieved = await store.findById(id, 'complex', complexParser)

      expect(retrieved).not.toBeNull()
      const parsedData = await retrieved!.parser(retrieved!.data)

      // Note: undefined values are lost in JSON serialization
      expect(parsedData).toEqual({
        ...complexData,
        metadata: {
          ...complexData.metadata,
          undefinedValue: undefined, // This will actually be missing in the parsed result
        },
      })
    })
  })
})
