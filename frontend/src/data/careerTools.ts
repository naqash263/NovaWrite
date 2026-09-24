// Career tools live on their own pages under /resources/{slug}.
export interface CareerTool {
  slug: string;
  name: string;
  icon: string;
  summary: string;
}

export const careerTools: CareerTool[] = [
  { slug: 'cv-builder', name: 'CV Builder', icon: '📄', summary: 'Build an ATS-friendly CV from professional templates and download it as PDF or Word.' },
  { slug: 'cover-letter-generator', name: 'Cover Letter Generator', icon: '✉️', summary: 'Draft a tailored cover letter for a specific job in minutes.' },
  { slug: 'linkedin-optimizer', name: 'LinkedIn Optimizer', icon: '💼', summary: 'Improve your LinkedIn headline, summary and skills for recruiter searches.' },
  { slug: 'interview-prep', name: 'Interview Prep', icon: '🎯', summary: 'Practise common and role-specific interview questions with answer frameworks.' },
  { slug: 'salary-negotiation', name: 'Salary Negotiation', icon: '💰', summary: 'Prepare a salary negotiation strategy, scripts and counter-offer plan.' },
  { slug: 'career-path-planner', name: 'Career Path Planner', icon: '🗺️', summary: 'Map the skills, roles and milestones between your current and target job.' },
  { slug: 'job-search-optimizer', name: 'Job Search Optimizer', icon: '🔍', summary: 'Plan and optimise your job search across channels and applications.' },
  { slug: 'skills-assessment', name: 'Skills Assessment', icon: '📊', summary: 'Assess your strengths and skill gaps against your target role.' },
];
