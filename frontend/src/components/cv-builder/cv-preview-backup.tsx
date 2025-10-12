import type { CVData } from "./cv-form";
// import type { TemplateName } from "./template-customizer";

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
    <h2 className="text-xl font-bold uppercase tracking-wider border-b-2 pb-1" style={style}>{title}</h2>
);

const Section = ({ title, style, children }: { title: string, style: React.CSSProperties, children: React.ReactNode }) => (
    <section className="section">
        <SectionTitle title={title} style={style} />
        <div className="mt-2">{children}</div>
    </section>
);

const SkillsTwoColumn = ({ skills }: { skills: string }) => {
    const allSkills = (skills || '').split(',').map(s => s.trim()).filter(Boolean);
    const midPoint = Math.ceil(allSkills.length / 2);
    const col1 = allSkills.slice(0, midPoint);
    const col2 = allSkills.slice(midPoint);

    return (
        <div className="grid grid-cols-2 gap-x-4">
            <ul className="space-y-1">
                {(col1 || []).map((skill, i) => <li key={`col1-${i}`}>{skill}</li>)}
            </ul>
            <ul className="space-y-1">
                {(col2 || []).map((skill, i) => <li key={`col2-${i}`}>{skill}</li>)}
            </ul>
        </div>
    );
};

const ClassicTemplate = ({ data, style }: CvPreviewProps) => {
    const {
        fullName, email, phoneNumber, address, professionalSummary,
        workExperience, education, skills, jobTitle, projects, certificates, languages, achievements, references, interests,
    } = data;
    
      // const headerStyle = { backgroundColor: style.primaryColor, color: style.secondaryColor };
      const sectionTitleStyle = { color: style.primaryColor, borderColor: style.primaryColor, fontSize: style.fontSize * 1.25 + 'px' };

    return (
        <div className="p-8 space-y-6" style={{ fontFamily: style.fontFamily }} data-cv-preview>
            <header className="text-center">
                <h1 className="text-4xl font-bold" style={{color: style.primaryColor, fontSize: style.fontSize * 2.5 + 'px'}}>{fullName || "Your Name"}</h1>
                <p className="text-xl mt-1" style={{color: style.primaryColor, fontSize: style.fontSize * 1.25 + 'px'}}>{jobTitle}</p>
            </header>
            
            <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                {email && <span>{email}</span>}
                {phoneNumber && <span>{phoneNumber}</span>}
                {address && <span>{address}</span>}
            </div>

            {professionalSummary && <Section title="Summary" style={sectionTitleStyle}><p className="text-gray-700">{professionalSummary}</p></Section>}
            
            {workExperience && workExperience.length > 0 && <Section title="Experience" style={sectionTitleStyle}>{(workExperience || []).map((exp: any, index: number) => (
                <div key={index} className="experience-item mt-2">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold" style={{fontSize: style.fontSize * 1.1 + 'px'}}>{exp.jobTitle}</h3>
                        <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                    </div>
                    <p className="text-sm italic text-gray-600">{exp.company}</p>
                    <ul className="mt-1 list-disc pl-5 text-gray-700 whitespace-pre-wrap">
                        {(exp.description || '').split('\n').map((line: string, i: number) => line.trim() && <li key={i}>{line.replace(/^- /, '')}</li>)}
                    </ul>
                </div>
            ))}</Section>}
            
            {education && education.length > 0 && <Section title="Education" style={sectionTitleStyle}><div className="space-y-2">{(education || []).map((edu: any, index: number) => (
                <div key={index} className="education-item flex justify-between">
                    <div>
                        <h3 className="font-semibold" style={{fontSize: style.fontSize * 1.1 + 'px'}}>{edu.degree}</h3>
                        <p className="text-sm italic text-gray-600">{edu.institution}</p>
                    </div>
                    <p className="text-xs text-gray-500">{edu.graduationYear}</p>
                </div>
            ))}</div></Section>}
            
            {skills && <Section title="Skills" style={sectionTitleStyle}><SkillsTwoColumn skills={skills} /></Section>}
            
            {projects && projects.length > 0 && projects[0].name && <Section title="Projects" style={sectionTitleStyle}>
                <div className="space-y-4">
                    {projects.map((project, index) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-4">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                <span className="text-sm text-gray-500">
                                    {project.startDate} - {project.endDate || 'Present'}
                                </span>
                            </div>
                            {project.technologies && (
                                <p className="text-sm text-gray-600 mb-2">Technologies: {project.technologies}</p>
                            )}
                            <p className="text-sm text-gray-700">{project.description}</p>
                            {project.url && (
                                <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                    View Project →
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            </Section>}
            
            {certificates && certificates.length > 0 && certificates[0].name && <Section title="Certifications" style={sectionTitleStyle}>
                <div className="space-y-3">
                    {certificates.map((cert, index) => (
                        <div key={index} className="flex justify-between items-start">
                            <div>
                                <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                                <p className="text-sm text-gray-600">{cert.issuer}</p>
                                {cert.credentialId && (
                                    <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>
                                )}
                            </div>
                            <span className="text-sm text-gray-500">{cert.date}</span>
                        </div>
                    ))}
                </div>
            </Section>}
            
            {languages && languages.length > 0 && languages[0].language && <Section title="Languages" style={sectionTitleStyle}>
                <div className="space-y-2">
                    {languages.map((lang, index) => (
                        <div key={index} className="flex justify-between items-center">
                            <span className="font-medium">{lang.language}</span>
                            <span className="text-sm text-gray-600">{lang.proficiency}</span>
                        </div>
                    ))}
                </div>
            </Section>}
            
            {achievements && achievements.length > 0 && achievements[0].title && <Section title="Achievements" style={sectionTitleStyle}>
                <div className="space-y-3">
                    {achievements.map((achievement, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                            <p className="text-sm text-gray-700">{achievement.description}</p>
                            {achievement.date && (
                                <p className="text-xs text-gray-500">{achievement.date}</p>
                            )}
                        </div>
                    ))}
                </div>
            </Section>}
            
            {references && references.length > 0 && references[0].name && <Section title="References" style={sectionTitleStyle}>
                <div className="space-y-3">
                    {references.map((ref, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-gray-900">{ref.name}</h3>
                            <p className="text-sm text-gray-600">{ref.position} at {ref.company}</p>
                            <p className="text-sm text-gray-700">{ref.email}</p>
                            {ref.phone && (
                                <p className="text-sm text-gray-700">{ref.phone}</p>
                            )}
                        </div>
                    ))}
                </div>
            </Section>}
            
            {interests && interests.length > 0 && interests[0].category && <Section title="Interests" style={sectionTitleStyle}>
                <div className="space-y-2">
                    {interests.map((interest, index) => (
                        <div key={index}>
                            <h3 className="font-semibold text-gray-900">{interest.category}</h3>
                            <p className="text-sm text-gray-600">{interest.items}</p>
                        </div>
                    ))}
                </div>
            </Section>}
        </div>
    )
};

const ModernTemplate = ({ data, style }: CvPreviewProps) => {
    const {
        fullName, email, phoneNumber, address, professionalSummary,
        workExperience, education, skills, jobTitle, profilePictureUrl, projects, certificates, languages, achievements, references, interests
    } = data;
    
    const headerStyle = { backgroundColor: style.primaryColor, color: style.secondaryColor };
    const sectionTitleStyle = { color: style.primaryColor, borderColor: style.primaryColor, fontSize: style.fontSize * 1.25 + 'px' };
    
    return (
        <div className="p-8 space-y-6" style={{ fontFamily: style.fontFamily }} data-cv-preview>
            <header className="flex items-center space-x-6" style={headerStyle}>
                {profilePictureUrl && (
                    <img 
                        src={profilePictureUrl} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-4 border-white"
                    />
                )}
                <div className="flex-1">
                    <h1 className="text-4xl font-bold" style={{color: style.secondaryColor, fontSize: style.fontSize * 2.5 + 'px'}}>{fullName || "Your Name"}</h1>
                    <p className="text-xl mt-1" style={{color: style.secondaryColor, fontSize: style.fontSize * 1.25 + 'px'}}>{jobTitle}</p>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mt-2">
                        {email && <span>{email}</span>}
                        {phoneNumber && <span>{phoneNumber}</span>}
                        {address && <span>{address}</span>}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {professionalSummary && <Section title="Professional Summary" style={sectionTitleStyle}><p className="text-gray-700">{professionalSummary}</p></Section>}
                    
                    {workExperience && workExperience.length > 0 && <Section title="Work Experience" style={sectionTitleStyle}>{(workExperience || []).map((exp, index) => (
                        <div key={index} className="experience-item mt-4">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold" style={{fontSize: style.fontSize * 1.1 + 'px'}}>{exp.jobTitle}</h3>
                                <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                            </div>
                            <p className="text-sm italic text-gray-600">{exp.company}</p>
                            <ul className="mt-1 list-disc pl-5 text-gray-700 whitespace-pre-wrap">
                                {(exp.description || '').split('\n').map((line: string, i: number) => line.trim() && <li key={i}>{line.replace(/^- /, '')}</li>)}
                            </ul>
                        </div>
                    ))}</Section>}
                </div>

                <div className="space-y-6">
                    {education && education.length > 0 && <Section title="Education" style={sectionTitleStyle}><div className="space-y-3">{(education || []).map((edu, index) => (
                        <div key={index} className="education-item">
                                <h3 className="font-semibold" style={{fontSize: style.fontSize * 1.1 + 'px'}}>{edu.degree}</h3>
                                <p className="text-sm italic text-gray-600">{edu.institution}</p>
                            <p className="text-xs text-gray-500">{edu.graduationYear}</p>
                        </div>
                    ))}</div></Section>}
                    
                    {skills && <Section title="Skills" style={sectionTitleStyle}><div className="space-y-1">{(skills || '').split(',').map((skill: string, i: number) => (
                        <div key={i} className="text-sm">
                          <span>{skill.trim()}</span>
                        </div>
                        ))}</div></Section>}
                    
                    {projects && projects.length > 0 && projects[0].name && <Section title="Projects" style={sectionTitleStyle}>
                        <div className="space-y-4">
                            {projects.map((project, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                                        <span className="text-sm text-gray-500">
                                            {project.startDate} - {project.endDate || 'Present'}
                                        </span>
                                    </div>
                                    {project.technologies && (
                                        <p className="text-sm text-gray-600 mb-2">Technologies: {project.technologies}</p>
                                    )}
                                    <p className="text-sm text-gray-700">{project.description}</p>
                                    {project.url && (
                                        <a href={project.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-sm hover:underline">
                                            View Project →
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>}
                    
                    {certificates && certificates.length > 0 && certificates[0].name && <Section title="Certifications" style={sectionTitleStyle}>
                        <div className="space-y-3">
                            {certificates.map((cert, index) => (
                                <div key={index} className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{cert.name}</h3>
                                        <p className="text-sm text-gray-600">{cert.issuer}</p>
                                        {cert.credentialId && (
                                            <p className="text-xs text-gray-500">ID: {cert.credentialId}</p>
                                        )}
                                    </div>
                                    <span className="text-sm text-gray-500">{cert.date}</span>
                                </div>
                            ))}
                        </div>
                    </Section>}
                    
                    {languages && languages.length > 0 && languages[0].language && <Section title="Languages" style={sectionTitleStyle}>
                        <div className="space-y-2">
                            {languages.map((lang, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="font-medium">{lang.language}</span>
                                    <span className="text-sm text-gray-600">{lang.proficiency}</span>
                                </div>
                            ))}
                        </div>
                    </Section>}
                    
                    {achievements && achievements.length > 0 && achievements[0].title && <Section title="Achievements" style={sectionTitleStyle}>
                        <div className="space-y-3">
                            {achievements.map((achievement, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-gray-900">{achievement.title}</h3>
                                    <p className="text-sm text-gray-700">{achievement.description}</p>
                                    {achievement.date && (
                                        <p className="text-xs text-gray-500">{achievement.date}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>}
                    
                    {references && references.length > 0 && references[0].name && <Section title="References" style={sectionTitleStyle}>
                        <div className="space-y-3">
                            {references.map((ref, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-gray-900">{ref.name}</h3>
                                    <p className="text-sm text-gray-600">{ref.position} at {ref.company}</p>
                                    <p className="text-sm text-gray-700">{ref.email}</p>
                                    {ref.phone && (
                                        <p className="text-sm text-gray-700">{ref.phone}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Section>}
                    
                    {interests && interests.length > 0 && interests[0].category && <Section title="Interests" style={sectionTitleStyle}>
                        <div className="space-y-2">
                            {interests.map((interest, index) => (
                                <div key={index}>
                                    <h3 className="font-semibold text-gray-900">{interest.category}</h3>
                                    <p className="text-sm text-gray-600">{interest.items}</p>
                                </div>
                            ))}
                        </div>
                    </Section>}
                </div>
            </div>
        </div>
    )
};

const MinimalTemplate = ({ data, style }: CvPreviewProps) => {
    const {
        fullName, email, phoneNumber, address, professionalSummary,
        workExperience, education, skills, jobTitle
    } = data;
    
    const sectionTitleStyle = { color: style.primaryColor, borderColor: style.primaryColor, fontSize: style.fontSize * 1.25 + 'px' };
    
    return (
        <div className="p-8 space-y-6" style={{ fontFamily: style.fontFamily }} data-cv-preview>
            <header className="text-center border-b border-gray-300 pb-6">
                <h1 className="text-4xl font-bold" style={{color: style.primaryColor, fontSize: style.fontSize * 2.5 + 'px'}}>{fullName || "Your Name"}</h1>
                <p className="text-xl mt-1" style={{color: style.primaryColor, fontSize: style.fontSize * 1.25 + 'px'}}>{jobTitle}</p>
                <div className="flex justify-center flex-wrap items-center gap-x-6 gap-y-2 text-sm mt-2">
                    {email && <span>{email}</span>}
                    {phoneNumber && <span>{phoneNumber}</span>}
                    {address && <span>{address}</span>}
                </div>
            </header>
            
            {professionalSummary && <Section title="Summary" style={sectionTitleStyle}><p className="text-gray-700">{professionalSummary}</p></Section>}
            
            {workExperience && workExperience.length > 0 && <Section title="Experience" style={sectionTitleStyle}>{(workExperience || []).map((exp: any, index: number) => (
                <div key={index} className="experience-item mt-2">
                    <div className="flex justify-between items-baseline">
                        <h3 className="font-semibold" style={{fontSize: style.fontSize * 1.1 + 'px'}}>{exp.jobTitle}</h3>
                        <p className="text-xs text-gray-500">{exp.startDate} - {exp.endDate || 'Present'}</p>
                    </div>
                    <p className="text-sm italic text-gray-600">{exp.company}</p>
                    <p className="text-gray-700 whitespace-pre-wrap">{exp.description}</p>
                </div>
            ))}</Section>}
            
            {education && education.length > 0 && <Section title="Education" style={sectionTitleStyle}><div className="space-y-2">{(education || []).map((edu: any, index: number) => (
                <div key={index} className="education-item flex justify-between">
                    <div>
                        <h3 className="font-semibold" style={{fontSize: style.fontSize * 1.1 + 'px'}}>{edu.degree}</h3>
                        <p className="text-sm italic text-gray-600">{edu.institution}</p>
                    </div>
                        <p className="text-xs text-gray-500">{edu.graduationYear}</p>
                    </div>
                ))}</div></Section>}
                
            {skills && <Section title="Skills" style={sectionTitleStyle}><p className="text-gray-700">{skills}</p></Section>}
        </div>
    )
};

// ATS-Optimized Template - Maximum compatibility with Applicant Tracking Systems
const ATSOptimizedTemplate = ({ data }: CvPreviewProps) => {
    const {
        fullName, email, phoneNumber, address, professionalSummary,
        workExperience, education, skills, jobTitle
    } = data;

    return (
        <div className="p-8 space-y-4" style={{ fontFamily: 'Arial, sans-serif', fontSize: '11pt', lineHeight: '1.15' }} data-cv-preview>
            {/* Header - Simple, clean format */}
            <header className="text-center border-b-2 border-black pb-4">
                <h1 className="text-2xl font-bold uppercase mb-1">{fullName || "Your Name"}</h1>
                <p className="text-lg font-semibold mb-2">{jobTitle}</p>
                <div className="text-sm">
                    {email && <span>{email} | </span>}
                    {phoneNumber && <span>{phoneNumber} | </span>}
                    {address && <span>{address}</span>}
                </div>
            </header>
            
            {/* Professional Summary */}
            {professionalSummary && (
                <section className="mt-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 pb-1 mb-2">PROFESSIONAL SUMMARY</h2>
                    <p className="text-sm">{professionalSummary}</p>
                </section>
            )}
            
            {/* Work Experience */}
            {workExperience && workExperience.length > 0 && (
                <section className="mt-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 pb-1 mb-2">WORK EXPERIENCE</h2>
                    {(workExperience || []).map((exp: any, index: number) => (
                        <div key={index} className="mb-3">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-sm">{exp.jobTitle}</h3>
                                <span className="text-xs">{exp.startDate} - {exp.endDate || 'Present'}</span>
                            </div>
                            <p className="text-sm font-semibold italic">{exp.company}</p>
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
                <section className="mt-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 pb-1 mb-2">EDUCATION</h2>
                    {(education || []).map((edu: any, index: number) => (
                        <div key={index} className="mb-2">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-bold text-sm">{edu.degree}</h3>
                                <span className="text-xs">{edu.graduationYear}</span>
                </div>
                            <p className="text-sm italic">{edu.institution}</p>
                        </div>
                    ))}
                </section>
            )}
            
            {/* Skills */}
            {skills && (
                <section className="mt-4">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-400 pb-1 mb-2">SKILLS</h2>
                    <p className="text-sm">{skills}</p>
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