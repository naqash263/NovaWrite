import type { CVData } from './cv-form';

export const templatePreviewData: CVData = {
  fullName: "Naqash Thaheem",
  jobTitle: "Systems Analyst & Automation Specialist",
  email: "naqash263@gmail.com",
  phoneNumber: "+971 50 123 4567",
  address: "Ajman, U.A.E.",
  profilePictureUrl: "",
  professionalSummary: "Experienced Systems Analyst with 5+ years in automation, data analysis, and system optimization. Proven track record in implementing efficient solutions and improving operational workflows.",
  
  workExperience: [
    {
      company: "Tech Solutions Inc.",
      jobTitle: "Senior Systems Analyst",
      startDate: "2022-01",
      endDate: "Present",
      description: "Led automation projects reducing manual work by 40%. Implemented data analysis tools improving decision-making processes."
    },
    {
      company: "Digital Innovations Ltd.",
      jobTitle: "Systems Analyst",
      startDate: "2020-06",
      endDate: "2021-12",
      description: "Developed workflow automation systems. Collaborated with cross-functional teams to optimize business processes."
    }
  ],
  
  education: [
    {
      institution: "University of Technology",
      degree: "Bachelor of Computer Science",
      graduationYear: "2020"
    },
    {
      institution: "Professional Development Institute",
      degree: "Certified Systems Analyst",
      graduationYear: "2021"
    }
  ],
  
  skills: "JavaScript, Python, SQL, Data Analysis, Process Automation, System Design, Project Management, Agile Methodologies, Database Management, API Integration, Cloud Computing, Problem Solving",
  
  projects: [
    {
      name: "Workflow Automation System",
      description: "Designed and implemented automated workflow system reducing processing time by 60%",
      technologies: "Python, JavaScript, SQL Server",
      startDate: "2022-03",
      endDate: "2022-08"
    },
    {
      name: "Data Analytics Dashboard",
      description: "Created interactive dashboard for real-time business metrics and reporting",
      technologies: "React, Node.js, PostgreSQL",
      startDate: "2021-09",
      endDate: "2021-12"
    }
  ],
  
  certificates: [
    {
      name: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      date: "2023-05"
    },
    {
      name: "Certified Data Analyst",
      issuer: "Microsoft",
      date: "2022-11"
    }
  ],
  
  languages: [
    { language: "English", proficiency: "Native" },
    { language: "Arabic", proficiency: "Fluent" },
    { language: "Hindi", proficiency: "Intermediate" },
    { language: "Urdu", proficiency: "Fluent" },
    { language: "French", proficiency: "Beginner" },
    { language: "Spanish", proficiency: "Beginner" }
  ],
  
  achievements: [
    { title: "Process Optimization Award", description: "Reduced processing time by 60% through automation", date: "2022" },
    { title: "Innovation Excellence", description: "Implemented AI-driven analytics solution", date: "2021" }
  ],
  
  interests: [
    { category: "Technology", items: "AI/ML, Blockchain, IoT" },
    { category: "Sports", items: "Football, Cricket, Swimming" },
    { category: "Hobbies", items: "Photography, Reading, Travel" },
    { category: "Volunteering", items: "Community Tech Education" }
  ],
  
  references: [
    {
      name: "Ahmed Al-Rashid",
      position: "IT Director",
      company: "Tech Solutions Inc.",
      email: "ahmed@techsolutions.ae",
      phone: "+971 50 987 6543"
    },
    {
      name: "Sarah Johnson",
      position: "Project Manager",
      company: "Digital Innovations Ltd.",
      email: "sarah.johnson@digitalinnovations.ae",
      phone: "+971 50 456 7890"
    }
  ]
};
