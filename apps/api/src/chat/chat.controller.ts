import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ChatService } from './chat.service';
import { ChatRequest, ChatResponse } from '@goodspeed/types';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  chat(@Body() request: ChatRequest): Promise<ChatResponse> {
    return this.chatService.chat(request);
  }
}
