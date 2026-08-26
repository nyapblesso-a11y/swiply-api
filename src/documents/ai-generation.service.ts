import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface GeneratedContent {
  cvText: string;
  coverLetterText: string;
}

@Injectable()
export class AiGenerationService {
  private genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

  async generateTailoredDocuments(
    cvData: { skills: string[]; experience: unknown; education: unknown },
    job: { title: string; company: string; description: string },
    retriesLeft = 2,
  ): Promise<GeneratedContent> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

const systemPrompt = `You are a professional CV and cover letter writer. You will be given a candidate's existing CV data and a job description. Using ONLY the information provided in the candidate's CV, produce a tailored CV and a tailored cover letter for this specific job. Do not invent any experience, skill, employer, or qualification that is not present in the provided CV data. You may reorder, re-emphasize, and rephrase existing content to better match the job description. Write in a professional, first-person tone.

Keep each document concise: aim for approximately 250 words each (CV and cover letter separately). This is a target, not a hard limit — prioritize including the most relevant, job-matching content over hitting an exact count.

For the CV, keep it organized into clear, brief sections (e.g. Profile, Experience, Education, Skills), but keep each section tight — short, high-impact lines rather than long paragraphs.

For the cover letter, keep it to 3-4 short paragraphs: an opening hook, 1-2 paragraphs connecting the candidate's real background to the role, and a brief closing.

Return your response in two clearly labelled sections: '--- CV ---' and '--- COVER LETTER ---'.`;

    const userPrompt = `Candidate CV data: ${JSON.stringify(cvData)}. Job title: ${job.title}. Company: ${job.company}. Job description: ${job.description}. Generate the tailored CV and cover letter as instructed.`;

    try {
      const result = await model.generateContent(`${systemPrompt}\n\n${userPrompt}`);
      const responseText = result.response.text().trim();
      return this.splitSections(responseText);
    } catch (error: any) {
      if (error?.status === 503 && retriesLeft > 0) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return this.generateTailoredDocuments(cvData, job, retriesLeft - 1);
      }
      if (error?.status === 429) {
        throw new BadRequestException(
          'Our AI service is briefly at capacity (free-tier rate limit). Please try again in about 30 seconds.',
        );
      }
      throw new BadRequestException('Could not generate documents. Please try again.');
    }
  }

  private splitSections(text: string): GeneratedContent {
    const cvMarker = '--- CV ---';
    const coverMarker = '--- COVER LETTER ---';

    const cvIndex = text.indexOf(cvMarker);
    const coverIndex = text.indexOf(coverMarker);

    if (cvIndex === -1 || coverIndex === -1) {
      throw new BadRequestException(
        'AI response was not in the expected format. Please try generating again.',
      );
    }

    const cvText = text.slice(cvIndex + cvMarker.length, coverIndex).trim();
    const coverLetterText = text.slice(coverIndex + coverMarker.length).trim();

    if (cvText.length < 30 || coverLetterText.length < 30) {
      throw new BadRequestException(
        'Generated content was too short. Please try generating again.',
      );
    }

    return { cvText, coverLetterText };
  }
}