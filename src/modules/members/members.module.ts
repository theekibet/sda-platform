import { Module } from '@nestjs/common';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';
import { FileUploadService } from './file-upload.service'; // ✅ ADD THIS IMPORT
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [MembersController],
  providers: [
    MembersService, 
    FileUploadService, // ✅ ADD THIS PROVIDER
    PrismaService
  ],
  exports: [MembersService, FileUploadService], // ✅ EXPORT if needed by other modules
})
export class MembersModule {}