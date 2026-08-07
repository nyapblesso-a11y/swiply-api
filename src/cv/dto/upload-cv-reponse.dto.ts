export interface ParsedCvResult {
  skills: string[];
  experience: Array<{ title: string; company: string; duration: string; description: string }>;
  education: Array<{ degree: string; institution: string; year: string }>;
}