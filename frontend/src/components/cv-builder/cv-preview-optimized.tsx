import type { CVData } from "./cv-form";

// Define CVStyle type
export interface CVStyle {
  templateName: 'Classic' | 'Modern' | 'Minimal' | 'Professional' | 'Creative' | 'Elegant' | 'Tech' | 'Corporate' | 'Academic' | 'Startup' | 'ATS Optimized';
  primaryColor: string;
  secondaryColor: string;
  fontSize: number;
  fontFamily: string;
}

type CvPreviewProps = {
  data: CVData;
  style: CVStyle;
};

const SectionTitle = ({ title, style }: { title: string, style: React.CSSProperties}) => (
    <h2 className="text-base font-bold uppercase tracking-wider border-b-2 pb-1" style={style}>{title}</h2>
);

const Section = ({ title, style, children }: { title: string, style: React.CSSProperties, children: React.ReactNode }) => (
    <section className="section">
        <SectionTitle title={title} style={style} />
        <div className="mt-1">{children}</div>
    </section>
);

// Multi-column layout components for compact display
const SkillsMultiColumn = ({ skills }: { skills: string }) => {
    const allSkills = (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            {allSkills.map((skill, i) => (
                <div key={i} className="flex items-center">
                    <span className="mr-2 text-gray-500">•</span>
                    <span>{skill}</span>
                </div>
            ))}
        </div>
    );
};

const LanguagesMultiColumn = ({ languages }: { languages: Array<{language: string, proficiency: string}> }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            {languages.map((lang, i) => (
                <div key={i} className="flex items-baseline">
                    <span className="font-medium">{lang.language}</span>
                    <span className="text-xs text-gray-500 ml-1">({lang.proficiency})</span>
                </div>
            ))}
        </div>
    );
};

const InterestsMultiColumn = ({ interests }: { interests: Array<{category: string, items: string}> }) => {
    return (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-1 text-sm">
            {interests.map((interest, i) => (
                <div key={i}>
                    <span className="font-medium">{interest.category}:</span> <span className="text-gray-600">{interest.items}</span>
                </div>
            ))}
        </div>
    );
};

const CertificationsTwoColumn = ({ certificates }: { certificates: Array<{name: string, issuer: string, date: string}> }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
            {certificates.map((cert, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-3">
                    <div className="font-semibold text-sm">{cert.name}</div>
                    <div className="text-xs text-gray-600">{cert.issuer}</div>
                    <div className="text-xs text-gray-500">{cert.date}</div>
                </div>
            ))}
        </div>
    );
};

const ProjectsTwoColumn = ({ projects }: { projects: Array<{name: string, description: string, technologies: string, startDate: string, endDate?: string}> }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
            {projects.map((project, i) => (
                <div key={i} className="border-l-2 border-gray-200 pl-3">
                    <div className="font-semibold text-sm">{project.name}</div>
                    <div className="text-xs text-gray-600 line-clamp-2">{project.description}</div>
                    <div className="text-xs text-gray-500">{project.technologies}</div>
                </div>
            ))}
        </div>
    );
};

const ReferencesTwoColumn = ({ references }: { references: Array<{name: string, position: string, company: string, email: string, phone?: string}> }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3">
            {references.map((ref, i) => (
                <div key={i} className="text-sm">
                    <div className="font-semibold">{ref.name}</div>
                    <div className="text-xs text-gray-600">{ref.position}, {ref.company}</div>
                    <div className="text-xs text-gray-500">{ref.email} | {ref.phone}</div>
                </div>
            ))}
        </div>
    );
};

const ClassicTemplate = ({ data, style }: CvPreviewProps) => {
    const {
        fullName = '', email = '', phoneNumber = '', address = '', professionalSummary = '',
        workExperience = [], education = [], skills = '', jobTitle = '', projects = [], certificates = [], languages = [], achievements = [], references = [], interests = [],
    } = data;
    
      // const headerStyle = { backgroundColor: style.primaryColor, color: style.secondaryColor };
      const sectionTitleStyle = { color: style.primaryColor, borderColor: style.primaryColor, fontSize: style.fontSize * 1.1 + 'px' };

    return (
        <div className="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style={{ fontFamily: style.fontFamily }} data-cv-preview>
            <header className="text-center">
                <h1 className="text-3xl font-bold" style={{color: style.primaryColor, fontSize: style.fontSize * 2 + 'px'}}>{fullName || "Your Name"}</h1>
                <p className="text-lg mt-1" style={{color: style.primaryColor, fontSize: style.fontSize * 1.1 + 'px'}}>{jobTitle}</p>
            </header>
            
            <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-2 text-xs">
                {email && <span>{email}</span>}
                {phoneNumber && <span>{phoneNumber}</span>}
                {address && <span>{address}</span>}
            </div>

            {professionalSummary && <Section title="Summary" style={sectionTitleStyle}><p className="text-gray-700 text-sm leading-tight">{professionalSummary}</p></Section>}
            
            {workExperience && workExperience.length > 0 && <Section title="Experience" style={sectionTitleStyle}>{(workExperience || []).map((exp: any, index: number) => (
                <div key={index} className="experience-item mt-2">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-sm" style={{fontSize: style.fontSize * 1.05 + 'px'}}>{exp.jobTitle}</h3>
                        <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                    </div>
                    <p className="text-xs italic text-gray-600">{exp.company}</p>
                    <ul className="mt-1 list-disc pl-5 text-gray-700 text-xs whitespace-pre-wrap">
                        {(exp.description || '').split('\n').map((line: string, i: number) => line.trim() && <li key={i}>{line.replace(/^- /, '')}</li>)}
                    </ul>
                </div>
            ))}</Section>}
            
            {education && education.length > 0 && <Section title="Education" style={sectionTitleStyle}><div className="space-y-2">{(education || []).map((edu: any, index: number) => (
                <div key={index} className="education-item flex justify-between">
                    <div>
                        <h3 className="font-semibold text-sm" style={{fontSize: style.fontSize * 1.05 + 'px'}}>{edu.degree}</h3>
                        <p className="text-xs italic text-gray-600">{edu.institution}</p>
                    </div>
                    <p className="text-xs text-gray-500">{edu.graduationYear}</p>
                </div>
            ))}</div></Section>}
            
            {skills && <Section title="Skills" style={sectionTitleStyle}><SkillsMultiColumn skills={skills} /></Section>}
            
            {projects && projects.length > 0 && projects[0].name && <Section title="Projects" style={sectionTitleStyle}>
                <ProjectsTwoColumn projects={projects} />
            </Section>}
            
            {certificates && certificates.length > 0 && certificates[0].name && <Section title="Certifications" style={sectionTitleStyle}>
                <CertificationsTwoColumn certificates={certificates} />
            </Section>}
            
            {languages && languages.length > 0 && languages[0].language && <Section title="Languages" style={sectionTitleStyle}>
                <LanguagesMultiColumn languages={languages} />
            </Section>}
            
            {achievements && achievements.length > 0 && achievements[0].title && <Section title="Achievements" style={sectionTitleStyle}>
                <div className="space-y-2">
                    {achievements.map((achievement, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-sm text-gray-900">{achievement.title}</h3>
                            <p className="text-xs text-gray-700">{achievement.description}</p>
                            {achievement.date && (
                                <p className="text-xs text-gray-500">{achievement.date}</p>
                            )}
                        </div>
                    ))}
                </div>
            </Section>}
            
            {references && references.length > 0 && references[0].name && <Section title="References" style={sectionTitleStyle}>
                <ReferencesTwoColumn references={references} />
            </Section>}
            
            {interests && interests.length > 0 && interests[0].category && <Section title="Interests" style={sectionTitleStyle}>
                <InterestsMultiColumn interests={interests} />
            </Section>}
        </div>
    )
};

const ModernTemplate = ({ data, style }: CvPreviewProps) => {
    const {
        fullName = '', email = '', phoneNumber = '', address = '', professionalSummary = '',
        workExperience = [], education = [], skills = '', jobTitle = '', profilePictureUrl = '', projects = [], certificates = [], languages = [], achievements = [], references = [], interests = []
    } = data;
    
    const headerStyle = { backgroundColor: style.primaryColor, color: style.secondaryColor };
    const sectionTitleStyle = { color: style.primaryColor, borderColor: style.primaryColor, fontSize: style.fontSize * 1.1 + 'px' };
    
    return (
        <div className="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style={{ fontFamily: style.fontFamily }} data-cv-preview>
            <header className="flex items-center space-x-4" style={headerStyle}>
                {profilePictureUrl && (
                    <img 
                        src={profilePictureUrl} 
                        alt="Profile" 
                        className="w-16 h-16 rounded-full object-cover border-2 border-white"
                    />
                )}
                <div className="flex-1">
                    <h1 className="text-3xl font-bold" style={{color: style.secondaryColor, fontSize: style.fontSize * 2 + 'px'}}>{fullName || "Your Name"}</h1>
                    <p className="text-lg mt-1" style={{color: style.secondaryColor, fontSize: style.fontSize * 1.1 + 'px'}}>{jobTitle}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
                        {email && <span>{email}</span>}
                        {phoneNumber && <span>{phoneNumber}</span>}
                        {address && <span>{address}</span>}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-3">
                    {professionalSummary && <Section title="Professional Summary" style={sectionTitleStyle}><p className="text-gray-700 text-sm leading-tight">{professionalSummary}</p></Section>}
                    
                    {workExperience && workExperience.length > 0 && <Section title="Work Experience" style={sectionTitleStyle}>{(workExperience || []).map((exp, index) => (
                        <div key={index} className="experience-item mt-2">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold text-sm" style={{fontSize: style.fontSize * 1.05 + 'px'}}>{exp.jobTitle}</h3>
                                <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                            </div>
                            <p className="text-xs italic text-gray-600">{exp.company}</p>
                            <ul className="mt-1 list-disc pl-5 text-gray-700 text-xs whitespace-pre-wrap">
                                {(exp.description || '').split('\n').map((line: string, i: number) => line.trim() && <li key={i}>{line.replace(/^- /, '')}</li>)}
                            </ul>
                        </div>
                    ))}</Section>}
                </div>

                <div className="space-y-3">
                    {education && education.length > 0 && <Section title="Education" style={sectionTitleStyle}><div className="space-y-2">{(education || []).map((edu, index) => (
                        <div key={index} className="education-item">
                                <h3 className="font-semibold text-sm" style={{fontSize: style.fontSize * 1.05 + 'px'}}>{edu.degree}</h3>
                                <p className="text-xs italic text-gray-600">{edu.institution}</p>
                            <p className="text-xs text-gray-500">{edu.graduationYear}</p>
                        </div>
                    ))}</div></Section>}
                    
                    {skills && <Section title="Skills" style={sectionTitleStyle}><div className="space-y-1">{(skills || '').split(',').map((skill: string, i: number) => (
                        <div key={i} className="text-xs">
                          <span>{skill.trim()}</span>
                        </div>
                        ))}</div></Section>}
                    
                    {projects && projects.length > 0 && projects[0].name && <Section title="Projects" style={sectionTitleStyle}>
                        <ProjectsTwoColumn projects={projects} />
                    </Section>}
                    
                    {certificates && certificates.length > 0 && certificates[0].name && <Section title="Certifications" style={sectionTitleStyle}>
                        <CertificationsTwoColumn certificates={certificates} />
                    </Section>}
                    
                    {languages && languages.length > 0 && languages[0].language && <Section title="Languages" style={sectionTitleStyle}>
                        <LanguagesMultiColumn languages={languages} />
                    </Section>}
                    
                    {achievements && achievements.length > 0 && achievements[0].title && <Section title="Achievements" style={sectionTitleStyle}>
                        <div className="space-y-2">
                            {achievements.map((achievement, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-sm text-gray-900">{achievement.title}</h3>
                                    <p className="text-xs text-gray-700">{achievement.description}</p>
                                    {achievement.date && (
                                        <p className="text-xs text-gray-500">{achievement.date}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>}
                    
                    {references && references.length > 0 && references[0].name && <Section title="References" style={sectionTitleStyle}>
                        <ReferencesTwoColumn references={references} />
                    </Section>}
                    
                    {interests && interests.length > 0 && interests[0].category && <Section title="Interests" style={sectionTitleStyle}>
                        <InterestsMultiColumn interests={interests} />
                    </Section>}
                </div>
            </div>
        </div>
    )
};

const MinimalTemplate = ({ data, style }: CvPreviewProps) => {
    const {
        fullName = '', email = '', phoneNumber = '', address = '', professionalSummary = '',
        workExperience = [], education = [], skills = '', jobTitle = ''
    } = data;
    
    const sectionTitleStyle = { color: style.primaryColor, borderColor: style.primaryColor, fontSize: style.fontSize * 1.1 + 'px' };
    
    return (
        <div className="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style={{ fontFamily: style.fontFamily }} data-cv-preview>
            <header className="text-center border-b border-gray-300 pb-4">
                <h1 className="text-3xl font-bold" style={{color: style.primaryColor, fontSize: style.fontSize * 2 + 'px'}}>{fullName || "Your Name"}</h1>
                <p className="text-lg mt-1" style={{color: style.primaryColor, fontSize: style.fontSize * 1.1 + 'px'}}>{jobTitle}</p>
                <div className="flex justify-center flex-wrap items-center gap-x-4 gap-y-1 text-xs mt-2">
                    {email && <span>{email}</span>}
                    {phoneNumber && <span>{phoneNumber}</span>}
                    {address && <span>{address}</span>}
                </div>
            </header>
            
            {professionalSummary && <Section title="Summary" style={sectionTitleStyle}><p className="text-gray-700 text-sm leading-tight">{professionalSummary}</p></Section>}
            
            {workExperience && workExperience.length > 0 && <Section title="Experience" style={sectionTitleStyle}>{(workExperience || []).map((exp: any, index: number) => (
                <div key={index} className="experience-item mt-2">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold text-sm" style={{fontSize: style.fontSize * 1.05 + 'px'}}>{exp.jobTitle}</h3>
                        <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                    </div>
                    <p className="text-xs italic text-gray-600">{exp.company}</p>
                    <p className="text-gray-700 text-xs whitespace-pre-wrap">{exp.description}</p>
                </div>
            ))}</Section>}
            
            {education && education.length > 0 && <Section title="Education" style={sectionTitleStyle}><div className="space-y-2">{(education || []).map((edu: any, index: number) => (
                <div key={index} className="education-item flex justify-between">
                    <div>
                        <h3 className="font-semibold text-sm" style={{fontSize: style.fontSize * 1.05 + 'px'}}>{edu.degree}</h3>
                        <p className="text-xs italic text-gray-600">{edu.institution}</p>
                    </div>
                        <p className="text-xs text-gray-500">{edu.graduationYear}</p>
                    </div>
                ))}</div></Section>}
                
            {skills && <Section title="Skills" style={sectionTitleStyle}><SkillsMultiColumn skills={skills} /></Section>}
        </div>
    )
};

// ATS-Optimized Template - Maximum compatibility with Applicant Tracking Systems
const ATSOptimizedTemplate = ({ data }: CvPreviewProps) => {
    const {
        fullName = '', email = '', phoneNumber = '', address = '', professionalSummary = '',
        workExperience = [], education = [], skills = '', jobTitle = ''
    } = data;

    return (
        <div className="max-w-[210mm] min-h-[297mm] max-h-[594mm] p-6 space-y-3" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.15' }} data-cv-preview>
            {/* Header - Simple, clean format */}
            <header className="text-center border-b-2 border-black pb-3">
                <h1 className="text-2xl font-bold uppercase mb-1">{fullName || "Your Name"}</h1>
                <p className="text-lg font-semibold mb-2">{jobTitle}</p>
                <div className="text-xs">
                    {email && <span>{email} | </span>}
                    {phoneNumber && <span>{phoneNumber} | </span>}
                    {address && <span>{address}</span>}
                </div>
            </header>
            
            {/* Professional Summary */}
            {professionalSummary && (
                <section className="mt-3">
                    <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">PROFESSIONAL SUMMARY</h2>
                    <p className="text-xs">{professionalSummary}</p>
                </section>
            )}
            
            {/* Work Experience */}
            {workExperience && workExperience.length > 0 && (
                <section className="mt-3">
                    <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">WORK EXPERIENCE</h2>
                    {(workExperience || []).map((exp: any, index: number) => (
                        <div key={index} className="mb-2">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-xs">{exp.jobTitle}</h3>
                                <span className="text-xs">{exp.startDate} - {exp.endDate || 'Present'}</span>
                            </div>
                            <p className="text-xs font-semibold italic">{exp.company}</p>
                            <div className="text-xs mt-1">
                                {(exp.description || '').split('\n').map((line: string, i: number) => 
                                    line.trim() && <p key={i} className="mb-1">{line.replace(/^- /, '• ')}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </section>
            )}
            
            {/* Education */}
            {education && education.length > 0 && (
                <section className="mt-3">
                    <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">EDUCATION</h2>
                    {(education || []).map((edu: any, index: number) => (
                        <div key={index} className="mb-2">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-xs">{edu.degree}</h3>
                                <span className="text-xs">{edu.graduationYear}</span>
                </div>
                            <p className="text-xs italic">{edu.institution}</p>
                        </div>
                    ))}
                </section>
            )}
            
            {/* Skills */}
            {skills && (
                <section className="mt-3">
                    <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">SKILLS</h2>
                    <SkillsMultiColumn skills={skills} />
                </section>
            )}
        </div>
    )
};
  
export const CvPreview = ({ data, style }: CvPreviewProps) => {
    const template = style.templateName || 'Classic';
    
    switch (template) {
        case 'ATS Optimized':
            return <ATSOptimizedTemplate data={data} style={style} />;
        case 'Modern':
            return <ModernTemplate data={data} style={style} />;
        case 'Minimal':
            return <MinimalTemplate data={data} style={style} />;
        case 'Professional':
        case 'Corporate':
        case 'Academic':
            return <ClassicTemplate data={data} style={style} />;
        case 'Creative':
        case 'Elegant':
        case 'Startup':
            return <ModernTemplate data={data} style={style} />;
        case 'Tech':
            return <MinimalTemplate data={data} style={style} />;
        case 'Classic':
        default:
            return <ClassicTemplate data={data} style={style} />;
    }
};
