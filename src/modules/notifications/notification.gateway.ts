// src/modules/notifications/notification.gateway.ts
import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    ConnectedSocket,
    MessageBody,
  } from '@nestjs/websockets';
  import { Server, Socket } from 'socket.io';
  import { UseGuards } from '@nestjs/common';
  import { WsJwtGuard } from '../../common/guards/ws-jwt.guard';
  
  @WebSocketGateway({
    cors: {
      origin: 'http://localhost:5173',
      credentials: true,
    },
    namespace: 'notifications',
  })
  export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
  
    private userSockets: Map<string, Set<string>> = new Map();
  
    async handleConnection(client: Socket) {
      try {
        // Get user ID from handshake auth
        const userId = client.handshake.auth.userId;
        
        if (!userId) {
          client.disconnect();
          return;
        }
  
        // Store socket connection
        if (!this.userSockets.has(userId)) {
          this.userSockets.set(userId, new Set());
        }
        
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.add(client.id);
        }
        
        client.join(`user:${userId}`);
        console.log(`User ${userId} connected`);
      } catch (error) {
        console.error('Connection error:', error);
        client.disconnect();
      }
    }
  
    handleDisconnect(client: Socket) {
      // Remove socket from userSockets map
      for (const [userId, sockets] of this.userSockets.entries()) {
        if (sockets.has(client.id)) {
          sockets.delete(client.id);
          if (sockets.size === 0) {
            this.userSockets.delete(userId);
          }
          break;
        }
      }
    }
  
    @SubscribeMessage('authenticate')
    async handleAuthenticate(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { token: string; userId: string },
    ) {
      try {
        const { userId } = data;
        
        if (userId) {
          // Update socket mapping
          if (!this.userSockets.has(userId)) {
            this.userSockets.set(userId, new Set());
          }
          
          const userSockets = this.userSockets.get(userId);
          if (userSockets) {
            userSockets.add(client.id);
          }
          
          client.join(`user:${userId}`);
          
          return { event: 'authenticated', data: { success: true } };
        }
        return { event: 'authenticated', data: { success: false, error: 'No userId provided' } };
      } catch (error) {
        return { event: 'authenticated', data: { success: false, error: error.message } };
      }
    }
  
    @SubscribeMessage('markAsRead')
    async handleMarkAsRead(
      @ConnectedSocket() client: Socket,
      @MessageBody() data: { notificationId: string },
    ) {
      client.broadcast.to(client.id).emit('notificationUpdated', { id: data.notificationId });
    }
  
    sendToUser(userId: string, event: string, payload: any) {
      this.server.to(`user:${userId}`).emit(event, payload);
    }
  
    sendToMultipleUsers(userIds: string[], event: string, payload: any) {
      userIds.forEach(userId => {
        this.server.to(`user:${userId}`).emit(event, payload);
      });
    }
  }