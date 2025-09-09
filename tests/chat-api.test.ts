import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { DELETE } from '@/app/(chat)/api/chat/route';
import { auth } from '@/lib/auth';
import { getChatById, deleteChatById } from '@/lib/db/queries';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/db/queries');

describe('Chat API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('DELETE /api/chat', () => {
    it('should return 400 if no ID provided', async () => {
      const request = new Request('http://localhost:3000/api/chat', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error.code).toBe('bad_request:api');
    });

    it('should return 401 if user not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/chat?id=123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error.code).toBe('unauthorized:chat');
    });

    it('should return 403 if chat not found', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      });
      (getChatById as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/chat?id=123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('forbidden:chat');
    });

    it('should return 403 if user does not own the chat', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      });
      (getChatById as jest.Mock).mockResolvedValue({
        id: '123',
        userId: 'user-2', // Different user
        title: 'Test Chat',
      });

      const request = new Request('http://localhost:3000/api/chat?id=123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error.code).toBe('forbidden:chat');
    });

    it('should successfully delete chat if user owns it', async () => {
      const mockChat = {
        id: '123',
        userId: 'user-1',
        title: 'Test Chat',
      };

      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      });
      (getChatById as jest.Mock).mockResolvedValue(mockChat);
      (deleteChatById as jest.Mock).mockResolvedValue(mockChat);

      const request = new Request('http://localhost:3000/api/chat?id=123', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockChat);
      expect(deleteChatById).toHaveBeenCalledWith({ id: '123' });
    });

    it('should validate chat ownership with explicit null check', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' }
      });
      
      // Test with null chat
      (getChatById as jest.Mock).mockResolvedValue(null);

      const request = new Request('http://localhost:3000/api/chat?id=nonexistent', {
        method: 'DELETE',
      });

      const response = await DELETE(request);
      
      expect(response.status).toBe(403);
      expect(getChatById).toHaveBeenCalledWith({ id: 'nonexistent' });
      expect(deleteChatById).not.toHaveBeenCalled();
    });
  });
});