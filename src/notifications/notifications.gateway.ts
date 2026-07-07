import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationsService } from './notifications.service';

@WebSocketGateway(4060, {
  cors: {
    origin: true,
    credentials: true,
    allowedHeaders: true,
    methods: ['POST', 'GET'],
  },
})
export class NotificationsGateway {
  constructor(private readonly notificationsService: NotificationsService) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('getNotifications')
  async getNotifications(@MessageBody('user_uuid') user_uuid: string) {
    return await this.notificationsService.getNotifications(user_uuid);
  }

  @SubscribeMessage('sendNotification')
  async sendNotification(@MessageBody() data: any) {
    const createdNotifications =
      await this.notificationsService.sendNotification(
        data.user_uuid,
        data.message,
      );

    this.server.emit('sendNotification', createdNotifications);

    return createdNotifications;
  }
}
