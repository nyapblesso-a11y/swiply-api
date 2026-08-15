import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCvResult } from './dto/upload-cv-reponse.dto';

const pdfParseModule = require('pdf-parse');
const pdfParse = pdfParseModule.default ?? pdfParseModule;

@Injectable()
export class CvParserService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

  async extractText(file: Express.Multer.File): Promise<string> {
    if (file.mimetype === 'application/pdf') {
      const data = await pdfParse(file.buffer);
      return data.text;
    }
    if (
      file.mimetype ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      return result.value;
    }
    throw new BadRequestException(
      'Unsupported file type. Please upload a PDF or DOCX.',
    );
  }

async parseStructuredData(rawText: string, retriesLeft = 2): Promise<ParsedCvResult> {
  const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

  const prompt = `You are a CV parsing assistant. Extract structured data from the CV text below.
Return ONLY valid JSON, no markdown formatting, no explanation, matching exactly this shape:
{
  "skills": ["skill1", "skill2"],
  "experience": [{ "title": "", "company": "", "duration": "", "description": "" }],
  "education": [{ "degree": "", "institution": "", "year": "" }]
}
Only include information explicitly present in the CV text. Do not invent or infer anything not stated.

CV TEXT:
${rawText}`;

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    const cleaned = responseText.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    return JSON.parse(cleaned) as ParsedCvResult;
  } catch (error: any) {
    if (error?.status === 503 && retriesLeft > 0) {
      await new Promise((resolve) => setTimeout(resolve, 2000)); // wait 2s before retrying
      return this.parseStructuredData(rawText, retriesLeft - 1);
    }
    if (error?.status === 429) {
      throw new BadRequestException(
        'Our AI service is briefly at capacity (free-tier rate limit). Please try again in about 30 seconds.',
      );
    }
    if (error?.status === 503) {
      throw new BadRequestException(
        'Google\'s AI service is temporarily overloaded. Please try again in a minute.',
      );
    }
    throw new BadRequestException('Could not parse CV content. Please try a different file.');
  }
}
}
