import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateGroupDto, GroupCategory } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { CreateDiscussionDto, CreateDiscussionReplyDto } from './dto/group-discussion.dto';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  // ============ GROUP MANAGEMENT ============

  async createGroup(creatorId: string, dto: CreateGroupDto) {
    const { name, description, category, isPrivate, location, rules, requireApproval, imageUrl } = dto;

    // Create the group
    const group = await this.prisma.group.create({
      data: {
        name,
        description,
        category,
        isPrivate: isPrivate || false,
        location,
        rules,
        requireApproval: requireApproval ?? true,
        imageUrl,
        createdById: creatorId,
        memberCount: 1, // Creator is first member
      },
    });

    // Add creator as admin
    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        memberId: creatorId,
        role: 'admin',
        status: 'approved',
      },
    });

    return this.getGroupById(group.id, creatorId);
  }

  async getGroups(filters: {
    category?: GroupCategory;
    location?: string;
    search?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const { category, location, search, page = 1, limit = 20, userId } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (location) {
      where.location = {
        contains: location,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // Don't show private groups in public listings
    if (!userId) {
      where.isPrivate = false;
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          members: userId ? {
            where: {
              memberId: userId,
            },
            select: {
              role: true,
              status: true,
            },
          } : false,
          _count: {
            select: {
              members: true,
              discussions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    // Format response
    const formattedGroups = groups.map(group => {
      const userMembership = userId && group.members?.length > 0 ? group.members[0] : null;
      return {
        ...group,
        members: undefined, // Remove raw members data
        userMembership: userMembership ? {
          role: userMembership.role,
          status: userMembership.status,
        } : null,
        discussionCount: group._count.discussions,
        memberCount: group._count.members,
      };
    });

    return {
      groups: formattedGroups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getGroupById(groupId: string, userId?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        members: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
        _count: {
          select: {
            discussions: true,
            events: true,
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if group is private and user is not a member
    if (group.isPrivate) {
      if (!userId) {
        throw new ForbiddenException('This is a private group');
      }

      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.status !== 'approved') {
        throw new ForbiddenException('You are not a member of this private group');
      }
    }

    // Get user's membership status - FIXED with explicit typing
    let userMembership: any = null;
    
    if (userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId,
            memberId: userId,
          },
        },
      });
      
      if (membership) {
        userMembership = membership;
      }
    }

    return {
      ...group,
      userMembership,
      discussionCount: group._count.discussions,
      eventCount: group._count.events,
    };
  }

  async updateGroup(userId: string, groupId: string, dto: UpdateGroupDto) {
    // Check if user is admin of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can update group settings');
    }

    return this.prisma.group.update({
      where: { id: groupId },
      data: dto,
    });
  }

  async deleteGroup(userId: string, groupId: string) {
    // Check if user is creator or admin
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    if (group.createdById !== userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.role !== 'admin') {
        throw new ForbiddenException('Only the group creator or admin can delete the group');
      }
    }

    await this.prisma.group.delete({
      where: { id: groupId },
    });

    return { message: 'Group deleted successfully' };
  }

  // ============ GROUP MEMBERSHIP ============

  async requestToJoin(userId: string, groupId: string, message?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Check if already a member or has pending request
    const existing = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`You already have a ${existing.status} membership`);
    }

    // Determine initial status
    const status = group.requireApproval ? 'pending' : 'approved';

    const membership = await this.prisma.groupMember.create({
      data: {
        groupId,
        memberId: userId,
        status,
        role: 'member',
      },
    });

    // If auto-approved, increment member count
    if (status === 'approved') {
      await this.prisma.group.update({
        where: { id: groupId },
        data: {
          memberCount: {
            increment: 1,
          },
        },
      });
    }

    return membership;
  }

  async approveMember(adminId: string, groupId: string, memberId: string) {
    // Check if admin has permission
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: adminId,
        },
      },
    });

    if (!adminMembership || (adminMembership.role !== 'admin' && adminMembership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can approve members');
    }

    // Update member status
    const membership = await this.prisma.groupMember.update({
      where: {
        groupId_memberId: {
          groupId,
          memberId,
        },
      },
      data: {
        status: 'approved',
      },
    });

    // Increment member count
    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        memberCount: {
          increment: 1,
        },
      },
    });

    return membership;
  }

  async rejectMember(adminId: string, groupId: string, memberId: string) {
    // Check if admin has permission
    const adminMembership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: adminId,
        },
      },
    });

    if (!adminMembership || (adminMembership.role !== 'admin' && adminMembership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can reject members');
    }

    // Delete the membership request
    await this.prisma.groupMember.delete({
      where: {
        groupId_memberId: {
          groupId,
          memberId,
        },
      },
    });

    return { message: 'Member rejected' };
  }

  async leaveGroup(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership) {
      throw new NotFoundException('You are not a member of this group');
    }

    // Don't allow last admin to leave
    if (membership.role === 'admin') {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: 'admin',
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException('You are the only admin. Transfer admin role before leaving.');
      }
    }

    await this.prisma.groupMember.delete({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    // Decrement member count
    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        memberCount: {
          decrement: 1,
        },
      },
    });

    return { message: 'You have left the group' };
  }

  // ============ GROUP DISCUSSIONS ============

  async createDiscussion(userId: string, dto: CreateDiscussionDto) {
    const { title, content, groupId } = dto;

    // Check if user is a member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be an approved member to post in this group');
    }

    return this.prisma.groupDiscussion.create({
      data: {
        title,
        content,
        groupId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async getGroupDiscussions(groupId: string, userId: string, page = 1, limit = 20) {
    // Check if user can view discussions
    const group = await this.getGroupById(groupId, userId);
    
    const skip = (page - 1) * limit;

    const [discussions, total] = await Promise.all([
      this.prisma.groupDiscussion.findMany({
        where: { groupId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: { replies: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.groupDiscussion.count({ where: { groupId } }),
    ]);

    return {
      discussions: discussions.map(d => ({
        ...d,
        replyCount: d._count.replies,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createDiscussionReply(userId: string, dto: CreateDiscussionReplyDto) {
    const { content, discussionId } = dto;

    // Get discussion to check group membership
    const discussion = await this.prisma.groupDiscussion.findUnique({
      where: { id: discussionId },
      include: {
        group: true,
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Check if user is a member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: discussion.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be an approved member to reply');
    }

    const reply = await this.prisma.groupDiscussionReply.create({
      data: {
        content,
        discussionId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Update reply count
    await this.prisma.groupDiscussion.update({
      where: { id: discussionId },
      data: {
        replyCount: {
          increment: 1,
        },
      },
    });

    return reply;
  }

  async getDiscussionWithReplies(discussionId: string, userId: string) {
    const discussion = await this.prisma.groupDiscussion.findUnique({
      where: { id: discussionId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        group: {
          select: {
            id: true,
            name: true,
            isPrivate: true,
          },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Check if user can view this discussion
    if (discussion.group.isPrivate) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: discussion.group.id,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.status !== 'approved') {
        throw new ForbiddenException('You do not have access to this discussion');
      }
    }

    return discussion;
  }

  // ============ READ RECEIPTS ============
  async markMessagesAsRead(userId: string, discussionId: string, messageIds: string[]) {
    // For now, just return success
    // You can implement actual read receipt logic later if needed
    // This could update a database field on messages to mark them as read
    
    console.log(`User ${userId} marked messages as read in discussion ${discussionId}:`, messageIds);
    
    return { 
      success: true, 
      message: `${messageIds.length} messages marked as read`,
      discussionId,
      userId
    };
  }
}