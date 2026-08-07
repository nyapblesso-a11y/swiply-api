import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CvParserService } from './cv-parser.service';
import { cloudinary } from './cloudinary.provider';

@Injectable()
export class CvService {
  constructor(
    private prisma: PrismaService,
    private cvParser: CvParserService,
  ) {}

  async uploadAndParse(userId: string, file: Express.Multer.File) {
    const rawText = await this.cvParser.extractText(file);
    const parsed = await this.cvParser.parseStructuredData(rawText);

    const rawFileUrl = await this.uploadToCloudinary(file, userId);

    const cv = await this.prisma.cV.upsert({
      where: { userId },
      update: {
        rawFileUrl,
        parsedSkills: parsed.skills,
        parsedExperience: parsed.experience,
        parsedEducation: parsed.education,
      },
      create: {
        userId,
        rawFileUrl,
        parsedSkills: parsed.skills,
        parsedExperience: parsed.experience,
        parsedEducation: parsed.education,
      },
    });

    return cv;
  }

  private uploadToCloudinary(file: Express.Multer.File, userId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw', // required for non-image files like PDF/DOCX
          public_id: `swiply-cvs/${userId}`,
          overwrite: true, // re-uploads replace the previous file at the same public_id
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      stream.end(file.buffer);
    });
  }

  async getMyCv(userId: string) {
    return this.prisma.cV.findUnique({ where: { userId } });
  }
}