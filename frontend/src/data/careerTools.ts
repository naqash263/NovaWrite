// Career tools live on their own pages under /resources/{slug}.
// Each page renders its SEO/AEO content (H1, answer, how-to, FAQ, related tools)
// through components/career/CareerToolLayout using the fields below.
export interface CareerFaq {
  question: string;
  answer: string;
}

export interface CareerTool {
  slug: string;
  name: string;
  icon: string;
  /** One line for cards on /resources. */
  summary: string;
  /** Visible H1. */
  h1: string;
  /** <title>, 30–60 characters, unique. */
  seoTitle: string;
  /** Meta description, 110–160 characters, unique. */
  seoDescription: string;
  /** Answer-first intro paragraph (40–70 words) shown under the H1. */
  answer: string;
  /** Short "How to use" steps that match the real UI labels. */
  howTo: string[];
  /** Capabilities the page really has (WebApplication featureList). */
  features: string[];
  /** 3–5 visible FAQs, also emitted as FAQPage JSON-LD. */
  faqs: CareerFaq[];
  /** Slugs of related career tools (3+). */
  related: string[];
  keywords: string[];
  /** 'ai' sends answers to the site's AI service; 'mixed' is local editing plus optional AI features. */
  processing: 'ai' | 'mixed';
  /** Last manual review (YYYY-MM-DD). */
  reviewed: string;
}

export const careerTools: CareerTool[] = [
  {
    slug: 'cv-builder',
    name: 'CV Builder',
    icon: '📄',
    summary: 'Build an ATS-friendly CV step by step with a live preview, check it against a job ad, then download a text PDF, Word, HTML or text file.',
    h1: 'Free CV Builder',
    seoTitle: 'Free CV Builder: ATS-Friendly Templates, PDF & Word',
    seoDescription:
      'Build an ATS-friendly CV online for free. Fill in guided steps, watch the live preview update, pick a template and download as PDF or Word. No signup.',
    answer:
      'A CV builder turns your work history, education and skills into a formatted, recruiter-ready document. This free builder guides you through ten short steps with a live preview, saves progress in your browser, checks your CV against a job description and exports a text-based PDF, Word, HTML or plain-text file. AI upload and tailoring are optional.',
    howTo: [
      'Choose "Create Manually", "Upload Existing CV" or "Tailor to Job".',
      'Fill in personal details (plus optional UAE / Gulf fields), summary, experience and education; the live preview updates as you type.',
      'Use "Bullet ideas" under each job for action verbs and quantified examples; leave optional sections empty.',
      'In step 9 pick a template, accent colour, font and size, and reorder or hide sections.',
      'In step 10 paste a job ad to see your keyword match, then download PDF, Word, HTML or plain text.',
    ],
    features: [
      'Ten guided steps with a live CV preview',
      'Text-based ATS PDF: real, selectable text lines in one column with clean page breaks',
      'Word (.docx), HTML and plain-text exports',
      'In-browser ATS keyword match against a pasted job description',
      'Accent colour, font and size options; reorder or hide sections',
      'Action-verb and quantified-bullet helper that works without AI',
      'Optional UAE / Gulf fields: nationality, visa status, driving licence, notice period',
      'Autosave in your browser plus JSON backup and restore',
      'Optional AI CV upload and job tailoring',
    ],
    faqs: [
      {
        question: 'Is this CV builder really free?',
        answer:
          'Yes. Building, previewing and downloading your CV in every format is free, with no signup, no trial and no watermark. Your CV is saved in your own browser; only the optional AI upload and tailoring features send it to the server.',
      },
      {
        question: 'Is the PDF readable by applicant tracking systems (ATS)?',
        answer:
          'The default "ATS text layout" PDF is built from your entries as real, selectable text lines in one column with standard headings (Experience, Education, Skills), so parsers can read it in order. The "Template design" option keeps a template’s look instead. No builder can promise how a particular employer’s ATS will rank you.',
      },
      {
        question: 'How does the ATS keyword match work?',
        answer:
          'In the export step, paste a job description. The builder picks its most prominent keywords and phrases, shows which ones already appear in your CV and suggests what to add. It runs in your browser and nothing is uploaded. Only add skills you really have.',
      },
      {
        question: 'Should my CV include nationality, visa status or a photo?',
        answer:
          'For jobs in the UAE and the wider Gulf, recruiters often expect nationality, visa status, driving licence and notice period, and a professional photo is common. The builder has optional fields for these that appear only when filled. For UK or US applications, leave the photo and personal details out.',
      },
      {
        question: 'What is the difference between a CV and a resume?',
        answer:
          'In the UK, Europe, the Middle East and academia a CV is the standard job application document; in the US and Canada the same one-to-two page document is usually called a resume. This builder works for both.',
      },
    ],
    related: ['cover-letter-generator', 'linkedin-optimizer', 'interview-prep', 'skills-assessment'],
    keywords: ['cv builder', 'free cv builder', 'resume builder', 'ats friendly cv', 'cv maker online', 'cv template download word', 'uae cv format', 'cv keyword match'],
    processing: 'mixed',
    reviewed: '2026-09-25',
  },
  {
    slug: 'cover-letter-generator',
    name: 'Cover Letter Generator',
    icon: '✉️',
    summary: 'Draft a tailored cover letter from the job description and your experience, then copy or download it.',
    h1: 'AI Cover Letter Generator',
    seoTitle: 'AI Cover Letter Generator: Free, Tailored to the Job',
    seoDescription:
      'Generate a tailored cover letter from a job description, your skills and experience. Pick a tone and length, then copy or download it as a text file.',
    answer:
      'A cover letter generator drafts a one-page letter that connects your experience to a specific job. Paste the job description, add your current role, key skills and one or two achievements, choose a tone and length, and this free tool writes a tailored first draft with keyword suggestions that you can edit, copy or download.',
    howTo: [
      'Enter the job title, company name and paste the job description.',
      'Click Next and add your current position, years of experience, key skills and relevant experience.',
      'Choose a tone and length, then click "Generate Cover Letter".',
      'Edit the draft if needed, then copy it or download it as a .txt file.',
    ],
    features: [
      'Tailors the letter to a pasted job description',
      'Tone and length options',
      'Keyword and improvement suggestions',
      'Copy to clipboard and .txt download',
    ],
    faqs: [
      {
        question: 'How long should a cover letter be?',
        answer: 'Most recruiters expect three to five short paragraphs that fit on one page, roughly 250 to 400 words.',
      },
      {
        question: 'Can I use the generated cover letter as it is?',
        answer:
          'Treat it as a first draft. Check every fact, add a specific example or number from your own work, and address the hiring manager by name when you know it.',
      },
      {
        question: 'Does the generator store my job description?',
        answer:
          'Your inputs are sent to the site’s AI service only to generate the letter. Avoid pasting sensitive personal data such as your home address or ID numbers.',
      },
      {
        question: 'Why is the job description limited to 2,000 characters?',
        answer:
          'The AI service accepts up to 2,000 characters. Paste the responsibilities and requirements sections, which contain the keywords that matter most.',
      },
    ],
    related: ['cv-builder', 'linkedin-optimizer', 'job-search-optimizer', 'interview-prep'],
    keywords: ['cover letter generator', 'ai cover letter generator', 'free cover letter generator', 'cover letter for job application', 'cover letter maker'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
  {
    slug: 'linkedin-optimizer',
    name: 'LinkedIn Optimizer',
    icon: '💼',
    summary: 'Score your LinkedIn headline, About section and skills and get keyword recommendations for recruiter searches.',
    h1: 'LinkedIn Profile Optimizer',
    seoTitle: 'LinkedIn Profile Optimizer: Headline, About & Skills',
    seoDescription:
      'Paste your LinkedIn headline, About section and skills to get scores, keyword suggestions and a prioritised action plan to rank higher in recruiter searches.',
    answer:
      'A LinkedIn profile optimizer reviews the parts of your profile that recruiters search and read first: the headline, the About section and your skills. Paste them into this free tool to get a score for each, prioritised recommendations with examples, and keyword suggestions you can add to your skills list with one click.',
    howTo: [
      'Paste your current headline (up to 220 characters).',
      'Paste your About section and list your skills separated by commas.',
      'Click "Analyze My Profile".',
      'Review the scores and recommendations, add suggested keywords, then copy the results.',
    ],
    features: [
      'Headline, summary and skills scores',
      'Prioritised recommendations with examples',
      'One-click keyword suggestions',
      'Live headline character counter',
    ],
    faqs: [
      {
        question: 'How long can a LinkedIn headline be?',
        answer: 'LinkedIn allows up to 220 characters. Put your role and main keywords in the first 60 or so characters, because search results and mobile views truncate the rest.',
      },
      {
        question: 'How many skills should I add to LinkedIn?',
        answer: 'LinkedIn lets you list up to 100 skills. Keep the most relevant ones for your target role at the top, since recruiters filter by skills.',
      },
      {
        question: 'Do I need to connect my LinkedIn account?',
        answer: 'No. You paste the text yourself, so the tool never logs in to LinkedIn or reads your profile.',
      },
    ],
    related: ['cv-builder', 'job-search-optimizer', 'skills-assessment', 'cover-letter-generator'],
    keywords: ['linkedin profile optimizer', 'linkedin headline generator', 'linkedin profile review', 'optimize linkedin profile', 'linkedin keywords'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
  {
    slug: 'interview-prep',
    name: 'Interview Prep',
    icon: '🎯',
    summary: 'Get role-specific practice questions, sample answers, STAR guidance and questions to ask the interviewer.',
    h1: 'Interview Prep Tool',
    seoTitle: 'Interview Prep Tool: Practice Questions & STAR Answers',
    seoDescription:
      'Prepare for your next interview with role-specific practice questions, sample answers, STAR method guidance, company research prompts and questions to ask.',
    answer:
      'An interview prep tool generates the questions you are likely to face for a specific role and shows how to answer them. Enter the job title, company, industry, interview format and your skills, and this free tool builds practice questions with tips and sample answers, a STAR answer framework, company research points and smart questions to ask the interviewer.',
    howTo: [
      'Enter the job title, company name and industry, then click Continue.',
      'Choose the interview type: phone, video, in-person or panel.',
      'Select your experience level and list your technical and soft skills.',
      'Click "Generate Prep Plan", then open each question to see tips and a sample answer.',
    ],
    features: [
      'Role-specific practice questions with sample answers',
      'STAR method framework with an example',
      'Company research and questions to ask',
      'Copy the full prep plan as text',
    ],
    faqs: [
      {
        question: 'What is the STAR method?',
        answer:
          'STAR stands for Situation, Task, Action and Result. It structures behavioural answers so you describe the context, your responsibility, what you did and the measurable outcome.',
      },
      {
        question: 'How many practice questions should I prepare?',
        answer: 'Prepare five to eight stories that you can adapt to different behavioural questions, plus answers to common openers such as "Tell me about yourself".',
      },
      {
        question: 'Are the sample answers meant to be memorised?',
        answer: 'No. Use them as structure and replace every detail with your own real examples; interviewers notice scripted answers.',
      },
    ],
    related: ['salary-negotiation', 'cover-letter-generator', 'skills-assessment', 'job-search-optimizer'],
    keywords: ['interview preparation', 'interview practice questions', 'star method interview', 'mock interview questions', 'interview prep tool'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
  {
    slug: 'salary-negotiation',
    name: 'Salary Negotiation',
    icon: '💰',
    summary: 'Plan a salary negotiation with a target range, anchor and walk-away point, scripts and benefit alternatives.',
    h1: 'Salary Negotiation Planner',
    seoTitle: 'Salary Negotiation Planner: Scripts & Target Range',
    seoDescription:
      'Plan your salary negotiation: compare current and desired pay, get a target range, anchor and walk-away point, ready-to-use scripts and benefits to ask for.',
    answer:
      'A salary negotiation planner helps you decide what to ask for and how to say it before you discuss an offer. Enter your current and desired salary, role, location, experience and company size, and this free tool calculates your requested raise and generates a target range, negotiation scripts and non-salary benefits you can negotiate if the base pay is fixed.',
    howTo: [
      'Enter your current and desired annual salary and choose a currency.',
      'Add the job title, location, years of experience, education level and key skills.',
      'Choose the company size and industry, then click "Generate Negotiation Plan".',
      'Review the range, scripts and alternatives, then copy the plan.',
    ],
    features: [
      'Instant raise calculation (amount and percentage)',
      'Target, anchor and walk-away figures',
      'Negotiation scripts for common situations',
      'Benefits and fallback options to negotiate',
    ],
    faqs: [
      {
        question: 'Should I give a number first in a salary negotiation?',
        answer:
          'If you have researched the market, anchoring first with a figure near the top of a realistic range can work in your favour. If you have not, ask for the budgeted range before naming a number.',
      },
      {
        question: 'Where does the market range come from?',
        answer:
          'The range is an AI estimate based on the role, location and experience you enter. Check it against salary surveys or sites such as Glassdoor, Levels.fyi or PayScale before you negotiate.',
      },
      {
        question: 'What can I negotiate besides salary?',
        answer: 'Common options are a signing bonus, extra annual leave, remote or flexible work, a training budget, an earlier salary review and job title.',
      },
    ],
    related: ['interview-prep', 'job-search-optimizer', 'career-path-planner', 'skills-assessment'],
    keywords: ['salary negotiation', 'how to negotiate salary', 'salary negotiation script', 'counter offer calculator', 'salary increase percentage'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
  {
    slug: 'career-path-planner',
    name: 'Career Path Planner',
    icon: '🗺️',
    summary: 'Map possible career paths, skill gaps, courses and milestones from your current role to your goal.',
    h1: 'Career Path Planner',
    seoTitle: 'Career Path Planner: Roles, Skill Gaps & Next Steps',
    seoDescription:
      'Plan your next career move. Enter your role, skills, interests and goals to get suggested career paths, skill gaps, learning options and milestones.',
    answer:
      'A career path planner compares where you are now with where you want to be and suggests realistic routes between the two. Enter your current role, industry, experience, skills, interests and goals, and this free tool proposes career paths with timelines, the skill gaps to close, education or certification options, networking actions and milestones.',
    howTo: [
      'Enter your current job title, industry and years of experience.',
      'List your current skills and career interests, separated by commas.',
      'Describe your career goals and preferred location.',
      'Tick your work preferences, choose your education level and click "Generate Career Plan".',
    ],
    features: [
      'Suggested career paths with timelines',
      'Skill gaps with priorities and actions',
      'Education, networking and milestone plan',
      'Copy the plan as text',
    ],
    faqs: [
      {
        question: 'How far ahead should a career plan look?',
        answer: 'Plan concrete actions for the next 6 to 12 months and keep a looser three-to-five-year direction that you review at least once a year.',
      },
      {
        question: 'What if I want to change careers completely?',
        answer:
          'Describe the target field in your goals and interests. The plan will focus on transferable skills, the gaps to close and entry-level routes into the new field.',
      },
      {
        question: 'Are the salary figures guaranteed?',
        answer: 'No. Salary numbers are AI estimates for orientation only; verify them with local salary surveys before making decisions.',
      },
    ],
    related: ['skills-assessment', 'job-search-optimizer', 'salary-negotiation', 'linkedin-optimizer'],
    keywords: ['career path planner', 'career planning tool', 'career development plan', 'career change plan', 'career roadmap'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
  {
    slug: 'job-search-optimizer',
    name: 'Job Search Optimizer',
    icon: '🔍',
    summary: 'Get search keywords, job boards, application tips and a networking plan for your target role.',
    h1: 'Job Search Optimizer',
    seoTitle: 'Job Search Strategy Generator: Keywords & Job Boards',
    seoDescription:
      'Build a job search strategy for your target role: search keywords, job boards, application and CV tips, networking ideas and common interview questions.',
    answer:
      'A job search optimizer turns a target role into a focused search plan. Enter the job title, location, experience, skills, job type and salary expectation, and this free tool suggests search keywords, job boards, example matching roles, CV and cover letter tips, online and offline networking actions and interview questions to prepare for.',
    howTo: [
      'Enter the desired job title, preferred location, years of experience and industry.',
      'List your skills and tick your work preferences.',
      'Choose the job type and company size, and enter your expected annual salary.',
      'Click "Generate Search Strategy" and work through the Jobs, Applications and Networking tabs.',
    ],
    features: [
      'Search keywords and job boards for your role',
      'Example matching roles with application tips',
      'CV, cover letter and portfolio tips',
      'Networking and interview question plan',
    ],
    faqs: [
      {
        question: 'Are the job recommendations real vacancies?',
        answer:
          'No. They are example roles that match your profile, generated to show which titles and companies to search for. Use the suggested keywords on job boards to find live vacancies.',
      },
      {
        question: 'How many applications should I send each week?',
        answer: 'Quality matters more than volume. A handful of well-tailored applications, each with a matching CV and cover letter, usually beats dozens of generic ones.',
      },
      {
        question: 'Which job boards should I use?',
        answer:
          'Combine one general board such as LinkedIn or Indeed with niche boards for your industry and the careers pages of companies you want to work for.',
      },
    ],
    related: ['linkedin-optimizer', 'cv-builder', 'cover-letter-generator', 'interview-prep'],
    keywords: ['job search strategy', 'job search tips', 'job search keywords', 'how to find a job', 'job search plan'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
  {
    slug: 'skills-assessment',
    name: 'Skills Assessment',
    icon: '📊',
    summary: 'Rate your skills, then see strengths, skill gaps, recommended roles and a learning path.',
    h1: 'Skills Assessment',
    seoTitle: 'Free Skills Assessment: Find Strengths & Skill Gaps',
    seoDescription:
      'Rate your skills across technical, soft and industry categories to see strengths, skill gaps, matching roles and a phased learning path for your career goal.',
    answer:
      'A skills assessment compares the skills you have with the skills your target role needs. Choose your experience level and industry, pick or type your skills, rate each one from Beginner to Expert and describe your goal. This free tool then scores each category, highlights strengths and gaps, suggests matching roles and builds a phased learning path.',
    howTo: [
      'Enter your years of experience, industry, current role and career goal.',
      'Pick skills from the categories or type your own, then click "Next: Rate Skills".',
      'Rate each skill from Beginner to Expert and set its importance.',
      'Click "Complete Assessment" to see scores, recommendations and a learning path.',
    ],
    features: [
      'Skill picker across 12 industries plus custom skills',
      'Proficiency and importance rating for each skill',
      'Category scores, strengths and gaps',
      'Recommended roles and phased learning path',
    ],
    faqs: [
      {
        question: 'How should I rate my skill level?',
        answer:
          'Beginner means you need guidance, Intermediate means you work independently, Advanced means you handle complex cases and Expert means others come to you for help or you teach the skill.',
      },
      {
        question: 'Does it work for non-technical careers?',
        answer: 'Yes. It includes healthcare, education, finance, marketing, sales, operations, HR and legal skills, and you can add any skill that is not listed.',
      },
      {
        question: 'What should I do with my skill gaps?',
        answer: 'Pick the one or two high-priority gaps for your target role and follow the learning path phases, rather than trying to close every gap at once.',
      },
    ],
    related: ['career-path-planner', 'cv-builder', 'linkedin-optimizer', 'interview-prep'],
    keywords: ['skills assessment', 'skills gap analysis', 'career skills test', 'self assessment of skills', 'skills audit'],
    processing: 'ai',
    reviewed: '2026-09-24',
  },
];

export const getCareerTool = (slug: string): CareerTool => {
  const tool = careerTools.find((t) => t.slug === slug);
  if (!tool) throw new Error(`Unknown career tool: ${slug}`);
  return tool;
};
