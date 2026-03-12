import { 
    Controller, Get, Post, Put, Delete, Body, Param, Query, 
    UseGuards, ParseIntPipe, DefaultValuePipe, HttpCode, HttpStatus
  } from '@nestjs/common';
  import { GroupsService } from './groups.service';
  import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
  import { CurrentUser } from '../../common/decorators/current-user.decorator';
  import { CreateGroupDto, GroupCategory } from './dto/create-group.dto';
  import { UpdateGroupDto } from './dto/update-group.dto';
  import { CreateDiscussionDto, CreateDiscussionReplyDto } from './dto/group-discussion.dto';
  
  @Controller('groups')
  @UseGuards(JwtAuthGuard)
  export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {}
  
    // ============ GROUP MANAGEMENT ============
  
    @Post()
    createGroup(
      @CurrentUser() user: any,
      @Body() createGroupDto: CreateGroupDto,
    ) {
      return this.groupsService.createGroup(user.id, createGroupDto);
    }
  
    @Get()
    getGroups(
      @CurrentUser() user: any,
      @Query('category') category?: string,
      @Query('location') location?: string,
      @Query('search') search?: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
      // Convert string category to enum if it exists and is valid
      let categoryEnum: GroupCategory | undefined;
      if (category && Object.values(GroupCategory).includes(category as GroupCategory)) {
        categoryEnum = category as GroupCategory;
      }
  
      return this.groupsService.getGroups({
        category: categoryEnum,
        location,
        search,
        page,
        limit,
        userId: user?.id,
      });
    }
  
    @Get('my-groups')
    getMyGroups(
      @CurrentUser() user: any,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
      return this.groupsService.getGroups({
        userId: user.id,
        page,
        limit,
      });
    }
  
    @Get(':groupId')
    getGroupById(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
    ) {
      return this.groupsService.getGroupById(groupId, user?.id);
    }
  
    @Put(':groupId')
    updateGroup(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
      @Body() updateGroupDto: UpdateGroupDto,
    ) {
      return this.groupsService.updateGroup(user.id, groupId, updateGroupDto);
    }
  
    @Delete(':groupId')
    deleteGroup(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
    ) {
      return this.groupsService.deleteGroup(user.id, groupId);
    }
  
    // ============ GROUP MEMBERSHIP ============
  
    @Post(':groupId/join')
    requestToJoin(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
      @Body('message') message?: string,
    ) {
      return this.groupsService.requestToJoin(user.id, groupId, message);
    }
  
    @Post(':groupId/leave')
    leaveGroup(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
    ) {
      return this.groupsService.leaveGroup(user.id, groupId);
    }
  
    @Post(':groupId/approve/:memberId')
    approveMember(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
      @Param('memberId') memberId: string,
    ) {
      return this.groupsService.approveMember(user.id, groupId, memberId);
    }
  
    @Post(':groupId/reject/:memberId')
    rejectMember(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
      @Param('memberId') memberId: string,
    ) {
      return this.groupsService.rejectMember(user.id, groupId, memberId);
    }
  
    // ============ GROUP DISCUSSIONS ============
  
    @Post('discussions')
    createDiscussion(
      @CurrentUser() user: any,
      @Body() createDiscussionDto: CreateDiscussionDto,
    ) {
      return this.groupsService.createDiscussion(user.id, createDiscussionDto);
    }
  
    @Get(':groupId/discussions')
    getGroupDiscussions(
      @CurrentUser() user: any,
      @Param('groupId') groupId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    ) {
      return this.groupsService.getGroupDiscussions(groupId, user.id, page, limit);
    }
  
    @Post('discussions/reply')
    createDiscussionReply(
      @CurrentUser() user: any,
      @Body() createReplyDto: CreateDiscussionReplyDto,
    ) {
      return this.groupsService.createDiscussionReply(user.id, createReplyDto);
    }
  
    @Get('discussions/:discussionId')
    getDiscussionWithReplies(
      @CurrentUser() user: any,
      @Param('discussionId') discussionId: string,
      @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
      @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
      @Query('after') after?: string,
    ) {
      // Only pass the required arguments (discussionId and userId)
      // The page, limit, and after parameters are accepted but not used yet
      return this.groupsService.getDiscussionWithReplies(
        discussionId, 
        user.id
      );
    }
  
    // ============ READ RECEIPTS ============
    @Post('discussions/:discussionId/read')
    markMessagesAsRead(
      @CurrentUser() user: any,
      @Param('discussionId') discussionId: string,
      @Body('messageIds') messageIds: string[],
    ) {
      return this.groupsService.markMessagesAsRead(user.id, discussionId, messageIds);
    }
  }