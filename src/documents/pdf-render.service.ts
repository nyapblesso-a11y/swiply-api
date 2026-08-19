import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { cloudinary } from '../cv/cloudinary.provider';

@Injectable()
export class PdfRenderService {
  async renderAndUpload(title: string, bodyText: string, publicId: string): Promise<string> {
    const buffer = await this.buildPdfBuffer(title, bodyText);
    return this.uploadBuffer(buffer, publicId);
  }

  private buildPdfBuffer(title: string, bodyText: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(18).font('Helvetica-Bold').text(title, { align: 'left' });
      doc.moveDown(1);
      doc.fontSize(11).font('Helvetica').text(bodyText, { align: 'left', lineGap: 4 });

      doc.end();
    });
  }

  private uploadBuffer(buffer: Buffer, publicId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: 'raw',
          public_id: publicId,
          overwrite: true,
          format: 'pdf',
        },
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result.secure_url);
        },
      );
      stream.end(buffer);
    });
  }
}