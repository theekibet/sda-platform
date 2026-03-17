// src/modules/groups/groups.controller.ts
import { 
  Controller, Get, Post, Put, Delete, Body, Param, Query, 
  UseGuards, ParseIntPipe, DefaultValuePipe 
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageReactionDto } from './dto/message-reaction.dto';
import { CreateEventDto } from './dto/create-event.dto'; // NEW IMPORT
import { UpdateEventDto } from './dto/update-event.dto'; // NEW IMPORT

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  // ============ GROUP CRUD ============

  @Post()
  @UseGuards(JwtAuthGuard)
  async createGroup(@CurrentUser() user: any, @Body() dto: CreateGroupDto) {
    const group = await this.groupsService.createGroup(user.id, dto);
    return { success: true, data: group };
  }

  @Get('my-groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroups(@CurrentUser() user: any) {
    const groups = await this.groupsService.getUserGroups(user.id);
    return { success: true, data: groups };
  }

  // ============ DISCOVERY ENDPOINTS ============

  @Get('discover/trending')
  @UseGuards(OptionalJwtAuthGuard)
  async getTrendingDiscussions(@CurrentUser() user: any) {
    const discussions = await this.groupsService.getTrendingDiscussions(user?.id);
    return { success: true, data: discussions };
  }

  @Get('discover/my-groups')
  @UseGuards(JwtAuthGuard)
  async getMyGroupsWithStats(@CurrentUser() user: any) {
    const groups = await this.groupsService.getUserGroupsWithStats(user.id);
    return { success: true, data: groups };
  }

  @Get('discover/suggestions')
  @UseGuards(OptionalJwtAuthGuard)
  async getDiscoverGroups(@CurrentUser() user: any) {
    const groups = await this.groupsService.getDiscoverGroups(user?.id);
    return { success: true, data: groups };
  }

  // ============ EVENTS ============

  @Get('events/upcoming')
  @UseGuards(OptionalJwtAuthGuard)
  async getUpcomingEvents(
    @CurrentUser() user: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('radius', ParseIntPipe) radius?: number,
  ) {
    const events = await this.groupsService.getUpcomingEvents(
      user?.id,
      page,
      limit,
      radius,
    );
    
    return {
      success: true,
      data: events,
    };
  }

  // ============ GROUP EVENTS ============

  @Get(':groupId/events')
  @UseGuards(JwtAuthGuard)
  async getGroupEvents(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const events = await this.groupsService.getGroupEvents(
      groupId,
      user.id,
      page,
      limit
    );
    return { success: true, data: events };
  }

  @Post(':groupId/events')
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Body() dto: CreateEventDto,
  ) {
    const event = await this.groupsService.createEvent(
      user.id,
      groupId,
      dto
    );
    return { success: true, data: event };
  }

  @Put('events/:eventId')
  @UseGuards(JwtAuthGuard)
  async updateEvent(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body() dto: UpdateEventDto,
  ) {
    const event = await this.groupsService.updateEvent(
      user.id,
      eventId,
      dto
    );
    return { success: true, data: event };
  }

  @Delete('events/:eventId')
  @UseGuards(JwtAuthGuard)
  async deleteEvent(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
  ) {
    await this.groupsService.deleteEvent(user.id, eventId);
    return { success: true, message: 'Event deleted successfully' };
  }

  @Post('events/:eventId/rsvp')
  @UseGuards(JwtAuthGuard)
  async rsvpToEvent(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
    @Body('status') status: 'going' | 'maybe' | 'not-going',
  ) {
    const rsvp = await this.groupsService.rsvpToEvent(
      user.id,
      eventId,
      status
    );
    return { success: true, data: rsvp };
  }

  @Get('events/:eventId/attendees')
  @UseGuards(JwtAuthGuard)
  async getEventAttendees(
    @CurrentUser() user: any,
    @Param('eventId') eventId: string,
  ) {
    const attendees = await this.groupsService.getEventAttendees(
      eventId,
      user.id
    );
    return { success: true, data: attendees };
  }

  // ============ GROUP DETAILS ============

  @Get(':groupId')
  @UseGuards(OptionalJwtAuthGuard)
  async getGroupById(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
  ) {
    const group = await this.groupsService.getGroupById(groupId, user?.id);
    return { success: true, data: group };
  }

  // ============ MESSAGES ============

  @Get(':groupId/messages')
  @UseGuards(JwtAuthGuard)
  async getGroupMessages(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    const messages = await this.groupsService.getGroupMessages(
      groupId,
      user.id,
      page,
      limit,
    );
    return { success: true, data: messages };
  }

  @Post(':groupId/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Body() dto: SendMessageDto,
  ) {
    const message = await this.groupsService.sendMessage(user.id, groupId, dto);
    return { success: true, data: message };
  }

  @Put('messages/:messageId')
  @UseGuards(JwtAuthGuard)
  async updateMessage(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
    @Body('content') content: string,
  ) {
    const message = await this.groupsService.updateMessage(user.id, messageId, content);
    return { success: true, data: message };
  }

  @Delete('messages/:messageId')
  @UseGuards(JwtAuthGuard)
  async deleteMessage(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
  ) {
    await this.groupsService.deleteMessage(user.id, messageId);
    return { success: true, message: 'Message deleted' };
  }

  // ============ MESSAGE REACTIONS ============

  @Post('messages/react')
  @UseGuards(JwtAuthGuard)
  async addReaction(
    @CurrentUser() user: any,
    @Body() dto: MessageReactionDto,
  ) {
    const reaction = await this.groupsService.addReaction(user.id, dto);
    return { success: true, data: reaction };
  }

  @Delete('messages/:messageId/reactions/:reaction')
  @UseGuards(JwtAuthGuard)
  async removeReaction(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
    @Param('reaction') reaction: string,
  ) {
    await this.groupsService.removeReaction(user.id, messageId, reaction);
    return { success: true, message: 'Reaction removed' };
  }

  // ============ PINNED MESSAGES ============

  @Post('messages/:messageId/pin')
  @UseGuards(JwtAuthGuard)
  async pinMessage(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
  ) {
    const message = await this.groupsService.pinMessage(user.id, messageId);
    return { success: true, data: message };
  }

  @Post('messages/:messageId/unpin')
  @UseGuards(JwtAuthGuard)
  async unpinMessage(
    @CurrentUser() user: any,
    @Param('messageId') messageId: string,
  ) {
    const message = await this.groupsService.unpinMessage(user.id, messageId);
    return { success: true, data: message };
  }

  @Get(':groupId/pinned')
  @UseGuards(JwtAuthGuard)
  async getPinnedMessages(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
  ) {
    const messages = await this.groupsService.getPinnedMessages(groupId, user.id);
    return { success: true, data: messages };
  }

  // ============ READ RECEIPTS ============

  @Post(':groupId/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
  ) {
    const result = await this.groupsService.markMessagesAsRead(user.id, groupId);
    return { success: true, data: result };
  }

  // ============ MAIN GET GROUPS ============

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async getGroups(
    @CurrentUser() user: any,
    @Query('category') category?: string,
    @Query('location') location?: string,
    @Query('meetingType') meetingType?: 'online' | 'in-person' | 'hybrid',
    @Query('search') search?: string,
    @Query('sort') sort?: 'popular' | 'new' | 'active',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const result = await this.groupsService.getGroups({
      category: category as any,
      location,
      meetingType,
      search,
      sort,
      page,
      limit,
      userId: user?.id,
    });
    
    return { 
      success: true, 
      data: result.groups, 
      pagination: {
        page: result.page,
        limit,
        total: result.total,
        totalPages: result.totalPages,
      } 
    };
  }

  // ============ GROUP MANAGEMENT ============

  @Put(':groupId')
  @UseGuards(JwtAuthGuard)
  async updateGroup(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    const group = await this.groupsService.updateGroup(user.id, groupId, dto);
    return { success: true, data: group };
  }

  @Delete(':groupId')
  @UseGuards(JwtAuthGuard)
  async deleteGroup(@CurrentUser() user: any, @Param('groupId') groupId: string) {
    await this.groupsService.deleteGroup(user.id, groupId);
    return { success: true, message: 'Group deleted successfully' };
  }

  // ============ GROUP MEMBERSHIP ============

  @Post(':groupId/join')
  @UseGuards(JwtAuthGuard)
  async joinGroup(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Body('message') message?: string,
  ) {
    const membership = await this.groupsService.requestToJoin(user.id, groupId, message);
    return { success: true, data: membership };
  }

  @Post(':groupId/leave')
  @UseGuards(JwtAuthGuard)
  async leaveGroup(@CurrentUser() user: any, @Param('groupId') groupId: string) {
    await this.groupsService.leaveGroup(user.id, groupId);
    return { success: true, message: 'Left group successfully' };
  }

  @Post(':groupId/approve/:memberId')
  @UseGuards(JwtAuthGuard)
  async approveMember(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.groupsService.approveMember(user.id, groupId, memberId);
    return { success: true, message: 'Member approved' };
  }

  @Post(':groupId/reject/:memberId')
  @UseGuards(JwtAuthGuard)
  async rejectMember(
    @CurrentUser() user: any,
    @Param('groupId') groupId: string,
    @Param('memberId') memberId: string,
  ) {
    await this.groupsService.rejectMember(user.id, groupId, memberId);
    return { success: true, message: 'Member rejected' };
  }
}