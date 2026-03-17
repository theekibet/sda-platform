// src/modules/groups/groups.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateGroupDto, GroupCategory } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { SendMessageDto, MessageType } from './dto/send-message.dto';
import { MessageReactionDto, ReactionType } from './dto/message-reaction.dto';
import { CreateEventDto } from './dto/create-event.dto'; // NEW IMPORT
import { UpdateEventDto } from './dto/update-event.dto'; // NEW IMPORT
import { GroupEventAttendee } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper method for distance calculation (Haversine formula)
   * KEPT: Still useful for events that ARE location-specific
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number | null {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10; // Round to 1 decimal
  }

  // ============ GROUP MANAGEMENT ============

  async createGroup(creatorId: string, dto: CreateGroupDto) {
    const { 
      name, 
      description, 
      category, 
      isPrivate, 
      location, 
      rules, 
      requireApproval, 
      imageUrl,
      isLocationBased,
      meetingType,
    } = dto;

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
        isLocationBased: isLocationBased || false,
        meetingType: meetingType || 'online',
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

  async getGroupById(groupId: string, userId?: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        members: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            joinedAt: 'desc',
          },
        },
        _count: {
          select: {
            messages: true,
            events: true,
            members: true,
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

    // Get user's membership status and unread count
    let userMembership: any = null;
    let unreadCount = 0;
    
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
        
        // Calculate unread count
        if (membership.lastReadAt) {
          unreadCount = await this.prisma.groupMessage.count({
            where: {
              groupId,
              createdAt: {
                gt: membership.lastReadAt,
              },
            },
          });
        } else {
          unreadCount = await this.prisma.groupMessage.count({
            where: { groupId },
          });
        }
      }
    }

    // Get pinned messages
    const pinnedMessages = await this.prisma.groupMessage.findMany({
      where: {
        groupId,
        isPinned: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    return {
      ...group,
      userMembership,
      messageCount: group._count.messages,
      eventCount: group._count.events,
      memberCount: group._count.members,
      unreadCount,
      pinnedMessages,
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

    // Check if user is the last admin
    if (membership.role === 'admin') {
      const adminCount = await this.prisma.groupMember.count({
        where: {
          groupId,
          role: 'admin',
          status: 'approved',
        },
      });

      if (adminCount === 1) {
        throw new BadRequestException('You are the last admin. Please promote another member or delete the group.');
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

    // Decrement member count if was approved
    if (membership.status === 'approved') {
      await this.prisma.group.update({
        where: { id: groupId },
        data: {
          memberCount: {
            decrement: 1,
          },
        },
      });
    }

    return { message: 'Left group successfully' };
  }

  // ============ MESSAGES ============

  async sendMessage(userId: string, groupId: string, dto: SendMessageDto) {
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
      throw new ForbiddenException('You must be a member of the group to send messages');
    }

    const message = await this.prisma.groupMessage.create({
      data: {
        content: dto.content,
        messageType: dto.messageType || MessageType.TEXT,
        fileUrl: dto.fileUrl,
        fileName: dto.fileName,
        isAnonymous: dto.isAnonymous || false,
        replyToId: dto.replyToId,
        groupId,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Update group's lastMessageAt and increment messageCount
    await this.prisma.group.update({
      where: { id: groupId },
      data: {
        lastMessageAt: new Date(),
        messageCount: {
          increment: 1,
        },
      },
    });

    // Create notification for other group members
    await this.createMessageNotifications(groupId, userId, message.id);

    return message;
  }

  async getGroupMessages(groupId: string, userId: string, page: number = 1, limit: number = 50) {
    // Check if user is a member
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be a member to view messages');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.groupMessage.findMany({
        where: { groupId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          replyTo: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          reactions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              replies: true,
              reactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.groupMessage.count({ where: { groupId } }),
    ]);

    // Update user's last read timestamp
    await this.prisma.groupMember.update({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return {
      messages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount: await this.getUnreadCount(groupId, userId),
    };
  }

  async updateMessage(userId: string, messageId: string, content: string) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: { group: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the author
    if (message.authorId !== userId) {
      // Check if user is admin
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: message.groupId,
            memberId: userId,
          },
        },
      });

      if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
        throw new ForbiddenException('You can only edit your own messages');
      }
    }

    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is the author or admin
    if (message.authorId !== userId) {
      const membership = await this.prisma.groupMember.findUnique({
        where: {
          groupId_memberId: {
            groupId: message.groupId,
            memberId: userId,
          },
        },
      });

      if (!membership || membership.role !== 'admin') {
        throw new ForbiddenException('Only admins can delete other messages');
      }
    }

    await this.prisma.groupMessage.delete({
      where: { id: messageId },
    });

    // Decrement message count
    await this.prisma.group.update({
      where: { id: message.groupId },
      data: {
        messageCount: {
          decrement: 1,
        },
      },
    });

    return { success: true };
  }

  // ============ REACTIONS ============

  async addReaction(userId: string, dto: MessageReactionDto) {
    const { messageId, reaction } = dto;

    // Check if message exists and user is in group
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: { group: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is in group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: message.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be a member to react');
    }

    // Create or update reaction
    const reaction_record = await this.prisma.messageReaction.upsert({
      where: {
        messageId_userId_reaction: {
          messageId,
          userId,
          reaction,
        },
      },
      update: {}, // If exists, do nothing
      create: {
        messageId,
        userId,
        reaction,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return reaction_record;
  }

  async removeReaction(userId: string, messageId: string, reaction: string) {
    await this.prisma.messageReaction.delete({
      where: {
        messageId_userId_reaction: {
          messageId,
          userId,
          reaction,
        },
      },
    });

    return { success: true };
  }

  // ============ PINNED MESSAGES ============

  async pinMessage(userId: string, messageId: string) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
      include: { group: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is admin
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: message.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can pin messages');
    }

    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { isPinned: true },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async unpinMessage(userId: string, messageId: string) {
    const message = await this.prisma.groupMessage.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Check if user is admin
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: message.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins can unpin messages');
    }

    return this.prisma.groupMessage.update({
      where: { id: messageId },
      data: { isPinned: false },
    });
  }

  async getPinnedMessages(groupId: string, userId: string) {
    // Check if user is in group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be a member to view pinned messages');
    }

    return this.prisma.groupMessage.findMany({
      where: {
        groupId,
        isPinned: true,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // ============ READ RECEIPTS ============

  async markMessagesAsRead(userId: string, groupId: string) {
    const membership = await this.prisma.groupMember.update({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return { success: true, lastReadAt: membership.lastReadAt };
  }

  async getUnreadCount(groupId: string, userId: string): Promise<number> {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
      select: { lastReadAt: true },
    });

    if (!membership || !membership.lastReadAt) {
      // If never read, count all messages
      return this.prisma.groupMessage.count({
        where: { groupId },
      });
    }

    // Count messages after last read
    return this.prisma.groupMessage.count({
      where: {
        groupId,
        createdAt: {
          gt: membership.lastReadAt,
        },
      },
    });
  }

  // ============ NOTIFICATIONS ============

  private async createMessageNotifications(groupId: string, senderId: string, messageId: string) {
    // Get all group members except the sender
    const members = await this.prisma.groupMember.findMany({
      where: {
        groupId,
        memberId: { not: senderId },
        status: 'approved',
        isMuted: false,
      },
      select: { memberId: true },
    });

    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    });

    // Add null check here!
    if (!group) {
      return; // Exit if group doesn't exist
    }

    // Create notifications for each member
    const notifications = members.map(m => ({
      type: 'group_message',
      title: `New message in ${group.name}`,
      message: 'Someone sent a message',
      userId: m.memberId,
      data: JSON.stringify({ groupId, messageId }),
    }));

    if (notifications.length > 0) {
      await this.prisma.notification.createMany({
        data: notifications,
      });
    }
  }

  // ============ USER GROUPS ============

  async getUserGroups(userId: string) {
    const memberships = await this.prisma.groupMember.findMany({
      where: {
        memberId: userId,
        status: 'approved',
      },
      include: {
        group: {
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                members: true,
                messages: true,
              },
            },
          },
        },
      },
      orderBy: {
        joinedAt: 'desc',
      },
    });

    // Get last message and unread count for each group
    const groupsWithDetails = await Promise.all(
      memberships.map(async (m) => {
        const lastMessage = await this.prisma.groupMessage.findFirst({
          where: { groupId: m.group.id },
          orderBy: { createdAt: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        });

        const unreadCount = await this.getUnreadCount(m.group.id, userId);

        return {
          ...m.group,
          memberCount: m.group._count.members,
          messageCount: m.group._count.messages,
          userRole: m.role,
          lastMessage,
          unreadCount,
          lastReadAt: m.lastReadAt,
        };
      })
    );

    return groupsWithDetails;
  }

  async getUserGroupsWithStats(userId: string) {
    const groups = await this.getUserGroups(userId);
    
    // Get additional stats for each group
    const groupsWithStats = await Promise.all(
      groups.map(async (group) => {
        const messagesLastWeek = await this.prisma.groupMessage.count({
          where: {
            groupId: group.id,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        });

        return {
          ...group,
          messagesLastWeek,
          isActive: messagesLastWeek > 10,
        };
      })
    );

    return groupsWithStats;
  }

  // ============ DISCOVERY ============
  
  async getDiscoverGroups(userId?: string) {
    let userCategories: string[] = [];
    let userCountry: string | null = null;

    // If user is logged in, get their interests
    if (userId) {
      // Get categories of groups user has joined
      const userMemberships = await this.prisma.groupMember.findMany({
        where: {
          memberId: userId,
          status: 'approved',
        },
        include: {
          group: {
            select: { category: true },
          },
        },
      });

      userCategories = [...new Set(userMemberships.map(m => m.group.category))];

      // Get user's country for "Popular in Kenya" section
      const user = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { locationName: true },
      });

      if (user?.locationName) {
        const parts = user.locationName.split(',');
        userCountry = parts[parts.length - 1].trim();
      }
    }

    // Build recommendation sections
    const recommendations: any = {
      forYou: [],
      popularInYourCountry: [],
      trending: [],
      newGroups: [],
    };

    // 1. FOR YOU - Based on user's interests
    if (userCategories.length > 0) {
      recommendations.forYou = await this.prisma.group.findMany({
        where: {
          category: { in: userCategories },
          isPrivate: false,
          ...(userId ? {
            members: {
              none: {
                memberId: userId,
                status: 'approved',
              },
            },
          } : {}),
        },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { members: true, messages: true },
          },
        },
        orderBy: { memberCount: 'desc' },
        take: 5,
      });
    }

    // 2. POPULAR IN YOUR COUNTRY
    if (userCountry) {
      recommendations.popularInYourCountry = await this.prisma.group.findMany({
        where: {
          isPrivate: false,
          location: { contains: userCountry },
          ...(userId ? {
            members: {
              none: {
                memberId: userId,
                status: 'approved',
              },
            },
          } : {}),
        },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { members: true, messages: true },
          },
        },
        orderBy: { memberCount: 'desc' },
        take: 5,
      });
    }

    // 3. TRENDING - Most active groups (recent messages)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingGroups = await this.prisma.groupMessage.groupBy({
      by: ['groupId'],
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    if (trendingGroups.length > 0) {
      recommendations.trending = await this.prisma.group.findMany({
        where: {
          id: { in: trendingGroups.map(g => g.groupId) },
          isPrivate: false,
          ...(userId ? {
            members: {
              none: {
                memberId: userId,
                status: 'approved',
              },
            },
          } : {}),
        },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
          _count: {
            select: { members: true, messages: true },
          },
        },
      });
    }

    // 4. NEW GROUPS - Recently created
    recommendations.newGroups = await this.prisma.group.findMany({
      where: {
        isPrivate: false,
        memberCount: { lt: 50 },
        ...(userId ? {
          members: {
            none: {
              memberId: userId,
              status: 'approved',
            },
          },
        } : {}),
      },
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: { members: true, messages: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Format all sections
    const formatGroups = (groups: any[]) => groups.map(g => ({
      ...g,
      memberCount: g._count?.members || g.memberCount,
      messageCount: g._count?.messages || 0,
      isOnline: g.meetingType === 'online' || g.location?.toLowerCase().includes('online'),
    }));

    return {
      forYou: formatGroups(recommendations.forYou),
      popularInYourCountry: formatGroups(recommendations.popularInYourCountry),
      trending: formatGroups(recommendations.trending),
      newGroups: formatGroups(recommendations.newGroups),
    };
  }

  async getTrendingDiscussions(userId?: string) {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const messages = await this.prisma.groupMessage.findMany({
      where: {
        createdAt: { gte: threeDaysAgo },
        group: { isPrivate: false },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        group: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        _count: {
          select: {
            reactions: true,
            replies: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return messages;
  }

  // ============ EVENTS ============

  async getUpcomingEvents(
    userId?: string, 
    page: number = 1, 
    limit: number = 20,
    radius?: number
  ) {
    const skip = (page - 1) * limit;
    const now = new Date();

    const where: any = {
      date: { gte: now },
    };

    // Get user's location if they want local filtering
    let userLocation: { latitude: number; longitude: number } | null = null;
    if (userId && radius) {
      const user = await this.prisma.member.findUnique({
        where: { id: userId },
        select: { latitude: true, longitude: true },
      });
      if (user?.latitude && user?.longitude) {
        userLocation = { latitude: user.latitude, longitude: user.longitude };
      }
    }

    const [events, total] = await Promise.all([
      this.prisma.groupEvent.findMany({
        where,
        include: {
          group: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.groupEvent.count({ where }),
    ]);

    // Check attendance and add distance for each event
    const eventsWithDetails = await Promise.all(
      events.map(async (event) => {
        let userAttendance: GroupEventAttendee | null = null;
        let distance: number | null = null;
        
        if (userId) {
          userAttendance = await this.prisma.groupEventAttendee.findUnique({
            where: {
              eventId_memberId: {
                eventId: event.id,
                memberId: userId,
              },
            },
          });

          // Calculate distance if both user and event have coordinates
          // This would require adding lat/lng to GroupEvent
        }

        return {
          ...event,
          attendeeCount: event._count.attendees,
          isUserAttending: !!userAttendance,
          userAttendanceStatus: userAttendance?.status,
          distance,
        };
      })
    );

    return {
      events: eventsWithDetails,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ NEW: GROUP EVENTS METHODS ============

  async getGroupEvents(groupId: string, userId: string, page: number = 1, limit: number = 20) {
    // Check if user is a member
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be a member to view events');
    }

    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.groupEvent.findMany({
        where: { groupId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          attendees: {
            include: {
              member: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
            },
          },
          _count: {
            select: {
              attendees: true,
            },
          },
        },
        orderBy: {
          date: 'asc',
        },
        skip,
        take: limit,
      }),
      this.prisma.groupEvent.count({ where: { groupId } }),
    ]);

    return {
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async createEvent(userId: string, groupId: string, dto: CreateEventDto) {
    // Check if user is admin or moderator
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });
  
    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins and moderators can create events');
    }
  
    const event = await this.prisma.groupEvent.create({
      data: {
        title: dto.title,
        description: dto.description,
        date: new Date(dto.date),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        // Smart location handling:
        // - If online event: set location to "Online"
        // - If in-person with location: use provided location
        // - If in-person without location: default to "TBD"
        location: dto.isOnline 
          ? 'Online' 
          : (dto.location || 'TBD'),
        isOnline: dto.isOnline || false,
        meetingLink: dto.meetingLink,
        groupId,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  
    return event;
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const event = await this.prisma.groupEvent.findUnique({
      where: { id: eventId },
      include: { group: true },
    });
  
    if (!event) {
      throw new NotFoundException('Event not found');
    }
  
    // Check if user is admin or moderator
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: event.groupId,
          memberId: userId,
        },
      },
    });
  
    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator')) {
      throw new ForbiddenException('Only admins and moderators can update events');
    }
  
    // Prepare update data
    const updateData: any = {
      title: dto.title,
      description: dto.description,
      date: dto.date ? new Date(dto.date) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      isOnline: dto.isOnline,
      meetingLink: dto.meetingLink,
    };
  
    // Handle location based on online status
    if (dto.isOnline !== undefined) {
      // If isOnline is being updated
      if (dto.isOnline) {
        updateData.location = 'Online';
      } else {
        // Switching to in-person, use provided location or default
        updateData.location = dto.location || 'TBD';
      }
    } else if (dto.location !== undefined) {
      // Only location is being updated
      updateData.location = dto.location || 'TBD';
    }
  
    return this.prisma.groupEvent.update({
      where: { id: eventId },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    const event = await this.prisma.groupEvent.findUnique({
      where: { id: eventId },
      include: { group: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is admin or the creator
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: event.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || (membership.role !== 'admin' && membership.role !== 'moderator' && event.createdById !== userId)) {
      throw new ForbiddenException('You do not have permission to delete this event');
    }

    await this.prisma.groupEvent.delete({
      where: { id: eventId },
    });

    return { success: true };
  }

  async rsvpToEvent(userId: string, eventId: string, status: 'going' | 'maybe' | 'not-going') {
    const event = await this.prisma.groupEvent.findUnique({
      where: { id: eventId },
      include: { group: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is a member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: event.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be a member to RSVP');
    }

    // Upsert the RSVP
    const rsvp = await this.prisma.groupEventAttendee.upsert({
      where: {
        eventId_memberId: {
          eventId,
          memberId: userId,
        },
      },
      update: {
        status,
      },
      create: {
        eventId,
        memberId: userId,
        status,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return rsvp;
  }

  async getEventAttendees(eventId: string, userId: string) {
    const event = await this.prisma.groupEvent.findUnique({
      where: { id: eventId },
      include: { group: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    // Check if user is a member of the group
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId: event.groupId,
          memberId: userId,
        },
      },
    });

    if (!membership || membership.status !== 'approved') {
      throw new ForbiddenException('You must be a member to view attendees');
    }

    const attendees = await this.prisma.groupEventAttendee.findMany({
      where: { eventId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    return attendees;
  }

  // ============ MAIN GET GROUPS ============

  async getGroups(filters: {
    category?: any;
    location?: string;
    search?: string;
    meetingType?: 'online' | 'in-person' | 'hybrid';
    sort?: 'popular' | 'new' | 'active';
    page?: number;
    limit?: number;
    userId?: string;
  }) {
    const { 
      category, 
      location, 
      search,
      meetingType,
      sort = 'popular',
      page = 1, 
      limit = 20, 
      userId,
    } = filters;
    
    const skip = (page - 1) * limit;

    const where: any = {};

    // Category filter
    if (category) {
      where.category = category;
    }

    // Location filter (optional - user-initiated)
    if (location) {
      where.location = {
        contains: location,
      };
    }

    // Meeting type filter
    if (meetingType) {
      where.meetingType = meetingType;
    }

    // Search
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

    // Determine sorting
    let orderBy: any = { memberCount: 'desc' }; // Default: popular
    if (sort === 'new') {
      orderBy = { createdAt: 'desc' };
    } else if (sort === 'active') {
      orderBy = { lastMessageAt: 'desc' };
    }

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          members: userId ? {
            where: {
              memberId: userId,
            },
            select: {
              role: true,
              status: true,
              lastReadAt: true,
            },
          } : false,
          _count: {
            select: {
              members: true,
              messages: true,
              events: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.group.count({ where }),
    ]);

    // Format groups with unread counts
    const formattedGroups = await Promise.all(groups.map(async group => {
      const userMembership = userId && group.members?.length > 0 ? group.members[0] : null;
      
      let unreadCount = 0;
      if (userId && userMembership?.lastReadAt) {
        unreadCount = await this.prisma.groupMessage.count({
          where: {
            groupId: group.id,
            createdAt: {
              gt: userMembership.lastReadAt,
            },
          },
        });
      }
      
      return {
        ...group,
        members: undefined,
        userMembership: userMembership ? {
          role: userMembership.role,
          status: userMembership.status,
        } : null,
        messageCount: group._count.messages,
        eventCount: group._count.events,
        memberCount: group._count.members,
        isOnline: group.meetingType === 'online',
        unreadCount,
        lastMessageAt: group.lastMessageAt,
      };
    }));

    return {
      groups: formattedGroups,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ============ HELPER METHODS ============

  private async isUserInGroup(userId: string, groupId: string): Promise<boolean> {
    const membership = await this.prisma.groupMember.findUnique({
      where: {
        groupId_memberId: {
          groupId,
          memberId: userId,
        },
      },
    });
    return !!(membership && membership.status === 'approved');
  }
}