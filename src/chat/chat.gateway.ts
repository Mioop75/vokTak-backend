import { PrismaService } from '@/prisma.service';
import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { InputMessageDto } from './dtos/input-message.dto';

@WebSocketGateway(4050, {
  cors: {
    origin: true,
    credentials: true,
    allowedHeaders: true,
    methods: ['POST', 'GET'],
  },
})
export class ChatGateway {
  constructor(private readonly prisma: PrismaService) {}
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('get_messages')
  async getMessages(@MessageBody() data: any) {
    const messages = await this.prisma.message.findMany({
      where: { chat_id: data.chat_id },
      include: {
        user: {
          include: {
            avatar: true,
          },
        },
      },
    });

    return messages;
  }

  @SubscribeMessage('create_message')
  async sendMessage(@MessageBody() data: InputMessageDto) {
    const createdMessage = await this.prisma.message.create({
      data: {
        user_uuid: data.user_uuid,
        chat_id: data.chat_id,
        message: data.message,
      },
      include: {
        user: {
          include: {
            avatar: {
              include: {
                photo: true,
              },
            },
          },
        },
      },
    });

    this.server.emit('create_message', createdMessage);

    return createdMessage;
  }
}
