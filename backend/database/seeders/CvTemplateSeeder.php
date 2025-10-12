<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CvTemplate;
use App\Models\User;

class CvTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the first admin user or create one
        $admin = User::where('role', 'admin')->first();
        if (!$admin) {
            $admin = User::create([
                'name' => 'Admin User',
                'email' => 'admin@novawrite.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);
        }

        $templates = [
            [
                'name' => 'Jobscan Executive',
                'description' => 'Professional executive template optimized for ATS systems. Clean, single-column layout with strong visual hierarchy.',
                'category' => 'executive',
                'ats_score' => 9,
                'is_default' => true,
                'customizable_options' => ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
                'field_mappings' => [
                    '{{fullName}}' => 'fullName',
                    '{{jobTitle}}' => 'jobTitle',
                    '{{email}}' => 'email',
                    '{{phoneNumber}}' => 'phoneNumber',
                    '{{address}}' => 'address',
                    '{{professionalSummary}}' => 'professionalSummary',
                    '{{workExperience}}' => 'workExperience',
                    '{{education}}' => 'education',
                    '{{skills}}' => 'skills',
                    '{{primaryColor}}' => 'primaryColor',
                    '{{secondaryColor}}' => 'secondaryColor',
                    '{{fontFamily}}' => 'fontFamily',
                    '{{fontSize}}' => 'fontSize'
                ],
                'html_content' => $this->getJobscanExecutiveTemplate(),
                'json_config' => [
                    'layout' => 'single-column',
                    'sections' => ['header', 'summary', 'experience', 'education', 'skills'],
                    'features' => ['ATS-optimized', 'Executive style', 'Clean layout']
                ]
            ],
            [
                'name' => 'Microsoft Professional',
                'description' => 'Classic professional template with balanced layout. Perfect for mid-level professionals.',
                'category' => 'professional',
                'ats_score' => 8,
                'is_default' => false,
                'customizable_options' => ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
                'field_mappings' => [
                    '{{fullName}}' => 'fullName',
                    '{{jobTitle}}' => 'jobTitle',
                    '{{email}}' => 'email',
                    '{{phoneNumber}}' => 'phoneNumber',
                    '{{address}}' => 'address',
                    '{{professionalSummary}}' => 'professionalSummary',
                    '{{workExperience}}' => 'workExperience',
                    '{{education}}' => 'education',
                    '{{skills}}' => 'skills',
                    '{{primaryColor}}' => 'primaryColor',
                    '{{secondaryColor}}' => 'secondaryColor',
                    '{{fontFamily}}' => 'fontFamily',
                    '{{fontSize}}' => 'fontSize'
                ],
                'html_content' => $this->getMicrosoftProfessionalTemplate(),
                'json_config' => [
                    'layout' => 'two-column',
                    'sections' => ['header', 'summary', 'experience', 'education', 'skills', 'certifications'],
                    'features' => ['Professional', 'Balanced layout', 'ATS-friendly']
                ]
            ],
            [
                'name' => 'Novoresume Modern',
                'description' => 'Modern, clean template with card-based design. Great for creative professionals.',
                'category' => 'modern',
                'ats_score' => 8,
                'is_default' => false,
                'customizable_options' => ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
                'field_mappings' => [
                    '{{fullName}}' => 'fullName',
                    '{{jobTitle}}' => 'jobTitle',
                    '{{email}}' => 'email',
                    '{{phoneNumber}}' => 'phoneNumber',
                    '{{address}}' => 'address',
                    '{{professionalSummary}}' => 'professionalSummary',
                    '{{workExperience}}' => 'workExperience',
                    '{{education}}' => 'education',
                    '{{skills}}' => 'skills',
                    '{{primaryColor}}' => 'primaryColor',
                    '{{secondaryColor}}' => 'secondaryColor',
                    '{{fontFamily}}' => 'fontFamily',
                    '{{fontSize}}' => 'fontSize'
                ],
                'html_content' => $this->getNovoresumeModernTemplate(),
                'json_config' => [
                    'layout' => 'card-based',
                    'sections' => ['header', 'summary', 'experience', 'education', 'skills', 'projects'],
                    'features' => ['Modern design', 'Card layout', 'Creative friendly']
                ]
            ],
            [
                'name' => 'Tech Professional',
                'description' => 'Specialized template for tech professionals with emphasis on technical skills and projects.',
                'category' => 'tech',
                'ats_score' => 9,
                'is_default' => false,
                'customizable_options' => ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
                'field_mappings' => [
                    '{{fullName}}' => 'fullName',
                    '{{jobTitle}}' => 'jobTitle',
                    '{{email}}' => 'email',
                    '{{phoneNumber}}' => 'phoneNumber',
                    '{{address}}' => 'address',
                    '{{professionalSummary}}' => 'professionalSummary',
                    '{{workExperience}}' => 'workExperience',
                    '{{education}}' => 'education',
                    '{{skills}}' => 'skills',
                    '{{primaryColor}}' => 'primaryColor',
                    '{{secondaryColor}}' => 'secondaryColor',
                    '{{fontFamily}}' => 'fontFamily',
                    '{{fontSize}}' => 'fontSize'
                ],
                'html_content' => $this->getTechProfessionalTemplate(),
                'json_config' => [
                    'layout' => 'tech-focused',
                    'sections' => ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications'],
                    'features' => ['Tech-focused', 'Project emphasis', 'Skills highlight']
                ]
            ],
            [
                'name' => 'Minimal Clean',
                'description' => 'Ultra-minimal template with maximum readability. Perfect for ATS systems.',
                'category' => 'minimal',
                'ats_score' => 10,
                'is_default' => false,
                'customizable_options' => ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
                'field_mappings' => [
                    '{{fullName}}' => 'fullName',
                    '{{jobTitle}}' => 'jobTitle',
                    '{{email}}' => 'email',
                    '{{phoneNumber}}' => 'phoneNumber',
                    '{{address}}' => 'address',
                    '{{professionalSummary}}' => 'professionalSummary',
                    '{{workExperience}}' => 'workExperience',
                    '{{education}}' => 'education',
                    '{{skills}}' => 'skills',
                    '{{primaryColor}}' => 'primaryColor',
                    '{{secondaryColor}}' => 'secondaryColor',
                    '{{fontFamily}}' => 'fontFamily',
                    '{{fontSize}}' => 'fontSize'
                ],
                'html_content' => $this->getMinimalCleanTemplate(),
                'json_config' => [
                    'layout' => 'minimal',
                    'sections' => ['header', 'summary', 'experience', 'education', 'skills'],
                    'features' => ['Ultra-minimal', 'Maximum ATS score', 'Clean typography']
                ]
            ],
            [
                'name' => 'Modern Advanced',
                'description' => 'Modern template with advanced CSS features including gradients, animations, hover effects, and responsive design.',
                'category' => 'modern',
                'ats_score' => 7,
                'is_default' => false,
                'customizable_options' => ['primaryColor', 'secondaryColor', 'fontFamily', 'fontSize'],
                'field_mappings' => [
                    '{{fullName}}' => 'fullName',
                    '{{jobTitle}}' => 'jobTitle',
                    '{{email}}' => 'email',
                    '{{phoneNumber}}' => 'phoneNumber',
                    '{{address}}' => 'address',
                    '{{professionalSummary}}' => 'professionalSummary',
                    '{{workExperience}}' => 'workExperience',
                    '{{education}}' => 'education',
                    '{{skills}}' => 'skills',
                    '{{projects}}' => 'projects',
                    '{{certificates}}' => 'certificates',
                    '{{languages}}' => 'languages',
                    '{{interests}}' => 'interests',
                    '{{primaryColor}}' => 'primaryColor',
                    '{{secondaryColor}}' => 'secondaryColor',
                    '{{fontFamily}}' => 'fontFamily',
                    '{{fontSize}}' => 'fontSize'
                ],
                'html_content' => $this->getModernAdvancedTemplate(),
                'json_config' => [
                    'layout' => 'modern-advanced',
                    'sections' => ['header', 'summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'interests'],
                    'features' => ['Advanced CSS', 'Animations', 'Hover effects', 'Responsive design', 'Modern styling']
                ]
            ]
        ];

        foreach ($templates as $templateData) {
            CvTemplate::create([
                ...$templateData,
                'created_by' => $admin->id,
                'is_active' => true,
            ]);
        }
    }

    private function getJobscanExecutiveTemplate(): string
    {
        return '
        <div class="cv-template jobscan-executive" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <style>
                .cv-template { background: white; }
                .header { text-align: center; border-bottom: 3px solid {{primaryColor}}; padding-bottom: 20px; margin-bottom: 30px; }
                .name { font-size: 28px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 5px; }
                .title { font-size: 18px; color: {{secondaryColor}}; margin-bottom: 10px; }
                .contact { font-size: 14px; color: #666; }
                .section { margin-bottom: 25px; }
                .section-title { font-size: 16px; font-weight: bold; color: {{primaryColor}}; border-bottom: 2px solid {{primaryColor}}; padding-bottom: 5px; margin-bottom: 15px; }
                .item { margin-bottom: 15px; }
                .item-title { font-weight: bold; font-size: 14px; }
                .item-subtitle { color: {{secondaryColor}}; font-size: 13px; }
                .item-date { color: #666; font-size: 12px; }
                .item-description { margin-top: 5px; font-size: 13px; line-height: 1.4; }
            </style>
            
            <div class="header">
                <div class="name">{{fullName}}</div>
                <div class="title">{{jobTitle}}</div>
                <div class="contact">{{email}} | {{phoneNumber}} | {{address}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="item-description">{{professionalSummary}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Work Experience</div>
                {{workExperience}}
            </div>
            
            <div class="section">
                <div class="section-title">Education</div>
                {{education}}
            </div>
            
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="item-description">{{skills}}</div>
            </div>
        </div>';
    }

    private function getMicrosoftProfessionalTemplate(): string
    {
        return '
        <div class="cv-template microsoft-professional" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <style>
                .cv-template { background: white; }
                .header { border-left: 4px solid {{primaryColor}}; padding-left: 20px; margin-bottom: 30px; }
                .name { font-size: 24px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 5px; }
                .title { font-size: 16px; color: {{secondaryColor}}; margin-bottom: 10px; }
                .contact { font-size: 13px; color: #666; }
                .section { margin-bottom: 25px; }
                .section-title { font-size: 15px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 12px; }
                .item { margin-bottom: 15px; }
                .item-title { font-weight: bold; font-size: 14px; }
                .item-subtitle { color: {{secondaryColor}}; font-size: 13px; }
                .item-date { color: #666; font-size: 12px; }
                .item-description { margin-top: 5px; font-size: 13px; line-height: 1.4; }
            </style>
            
            <div class="header">
                <div class="name">{{fullName}}</div>
                <div class="title">{{jobTitle}}</div>
                <div class="contact">{{email}} | {{phoneNumber}} | {{address}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="item-description">{{professionalSummary}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Work Experience</div>
                {{workExperience}}
            </div>
            
            <div class="section">
                <div class="section-title">Education</div>
                {{education}}
            </div>
            
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="item-description">{{skills}}</div>
            </div>
        </div>';
    }

    private function getNovoresumeModernTemplate(): string
    {
        return '
        <div class="cv-template novoresume-modern" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <style>
                .cv-template { background: white; }
                .header { background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); color: white; padding: 30px; border-radius: 10px; margin-bottom: 30px; text-align: center; }
                .name { font-size: 26px; font-weight: bold; margin-bottom: 5px; }
                .title { font-size: 16px; opacity: 0.9; margin-bottom: 10px; }
                .contact { font-size: 13px; opacity: 0.8; }
                .section { margin-bottom: 25px; background: #f8f9fa; padding: 20px; border-radius: 8px; }
                .section-title { font-size: 16px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 15px; }
                .item { margin-bottom: 15px; }
                .item-title { font-weight: bold; font-size: 14px; }
                .item-subtitle { color: {{secondaryColor}}; font-size: 13px; }
                .item-date { color: #666; font-size: 12px; }
                .item-description { margin-top: 5px; font-size: 13px; line-height: 1.4; }
            </style>
            
            <div class="header">
                <div class="name">{{fullName}}</div>
                <div class="title">{{jobTitle}}</div>
                <div class="contact">{{email}} | {{phoneNumber}} | {{address}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="item-description">{{professionalSummary}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Work Experience</div>
                {{workExperience}}
            </div>
            
            <div class="section">
                <div class="section-title">Education</div>
                {{education}}
            </div>
            
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="item-description">{{skills}}</div>
            </div>
        </div>';
    }

    private function getTechProfessionalTemplate(): string
    {
        return '
        <div class="cv-template tech-professional" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <style>
                .cv-template { background: white; }
                .header { border-bottom: 2px solid {{primaryColor}}; padding-bottom: 20px; margin-bottom: 30px; }
                .name { font-size: 26px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 5px; }
                .title { font-size: 16px; color: {{secondaryColor}}; margin-bottom: 10px; }
                .contact { font-size: 13px; color: #666; }
                .section { margin-bottom: 25px; }
                .section-title { font-size: 16px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 15px; }
                .item { margin-bottom: 15px; }
                .item-title { font-weight: bold; font-size: 14px; }
                .item-subtitle { color: {{secondaryColor}}; font-size: 13px; }
                .item-date { color: #666; font-size: 12px; }
                .item-description { margin-top: 5px; font-size: 13px; line-height: 1.4; }
                .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; }
                .skill-category { background: #f0f0f0; padding: 10px; border-radius: 5px; }
            </style>
            
            <div class="header">
                <div class="name">{{fullName}}</div>
                <div class="title">{{jobTitle}}</div>
                <div class="contact">{{email}} | {{phoneNumber}} | {{address}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="item-description">{{professionalSummary}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Work Experience</div>
                {{workExperience}}
            </div>
            
            <div class="section">
                <div class="section-title">Education</div>
                {{education}}
            </div>
            
            <div class="section">
                <div class="section-title">Technical Skills</div>
                <div class="item-description">{{skills}}</div>
            </div>
        </div>';
    }

    private function getMinimalCleanTemplate(): string
    {
        return '
        <div class="cv-template minimal-clean" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <style>
                .cv-template { background: white; }
                .header { text-align: center; margin-bottom: 30px; }
                .name { font-size: 24px; font-weight: bold; color: {{primaryColor}}; margin-bottom: 5px; }
                .title { font-size: 16px; color: {{secondaryColor}}; margin-bottom: 10px; }
                .contact { font-size: 13px; color: #666; }
                .section { margin-bottom: 20px; }
                .section-title { font-size: 14px; font-weight: bold; color: {{primaryColor}}; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 10px; }
                .item { margin-bottom: 12px; }
                .item-title { font-weight: bold; font-size: 13px; }
                .item-subtitle { color: {{secondaryColor}}; font-size: 12px; }
                .item-date { color: #666; font-size: 11px; }
                .item-description { margin-top: 3px; font-size: 12px; line-height: 1.3; }
            </style>
            
            <div class="header">
                <div class="name">{{fullName}}</div>
                <div class="title">{{jobTitle}}</div>
                <div class="contact">{{email}} | {{phoneNumber}} | {{address}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Summary</div>
                <div class="item-description">{{professionalSummary}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Experience</div>
                {{workExperience}}
            </div>
            
            <div class="section">
                <div class="section-title">Education</div>
                {{education}}
            </div>
            
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="item-description">{{skills}}</div>
            </div>
        </div>';
    }

    private function getModernAdvancedTemplate(): string
    {
        return '
        <div class="cv-template modern-advanced" style="font-family: {{fontFamily}}; font-size: {{fontSize}}px; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
            <style>
                /* Modern Advanced Template CSS */
                .cv-template { 
                    background: white; 
                    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
                    border-radius: 15px;
                    overflow: hidden;
                }
                
                /* Header with gradient background */
                .header { 
                    background: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}}); 
                    color: white; 
                    padding: 40px 30px; 
                    text-align: center;
                    position: relative;
                    overflow: hidden;
                }
                
                .header::before {
                    content: "";
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                    animation: shimmer 3s ease-in-out infinite;
                }
                
                @keyframes shimmer {
                    0%, 100% { transform: translateX(-100%) translateY(-100%); }
                    50% { transform: translateX(100%) translateY(100%); }
                }
                
                .name { 
                    font-size: 32px; 
                    font-weight: bold; 
                    margin-bottom: 8px;
                    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    position: relative;
                    z-index: 1;
                }
                
                .title { 
                    font-size: 18px; 
                    opacity: 0.9; 
                    margin-bottom: 15px;
                    position: relative;
                    z-index: 1;
                }
                
                .contact { 
                    font-size: 14px; 
                    opacity: 0.8;
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    flex-wrap: wrap;
                    position: relative;
                    z-index: 1;
                }
                
                .contact span {
                    background: rgba(255,255,255,0.2);
                    padding: 5px 12px;
                    border-radius: 20px;
                    backdrop-filter: blur(10px);
                }
                
                /* Section styling with cards */
                .section { 
                    margin-bottom: 30px; 
                    background: #f8f9fa; 
                    padding: 25px; 
                    border-radius: 12px;
                    border-left: 4px solid {{primaryColor}};
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                
                .section:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.1);
                }
                
                .section-title { 
                    font-size: 18px; 
                    font-weight: bold; 
                    color: {{primaryColor}}; 
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .section-title::before {
                    content: "▶";
                    font-size: 14px;
                    color: {{secondaryColor}};
                }
                
                /* Experience cards */
                .experience-card {
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                    margin-bottom: 15px;
                    border: 1px solid #e0e0e0;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                
                .experience-card::before {
                    content: "";
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 4px;
                    height: 100%;
                    background: {{primaryColor}};
                    transition: width 0.3s ease;
                }
                
                .experience-card:hover::before {
                    width: 8px;
                }
                
                .experience-card:hover {
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                    transform: translateX(5px);
                }
                
                .item-title { 
                    font-weight: bold; 
                    font-size: 16px;
                    color: {{primaryColor}};
                    margin-bottom: 5px;
                }
                
                .item-subtitle { 
                    color: {{secondaryColor}}; 
                    font-size: 14px;
                    font-weight: 500;
                    margin-bottom: 5px;
                }
                
                .item-date { 
                    color: #666; 
                    font-size: 12px;
                    background: #f0f0f0;
                    padding: 3px 8px;
                    border-radius: 12px;
                    display: inline-block;
                    margin-bottom: 10px;
                }
                
                .item-description { 
                    margin-top: 10px; 
                    font-size: 14px; 
                    line-height: 1.6;
                    color: #555;
                }
                
                /* Skills with tags */
                .skills-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                
                .skill-tag {
                    background: linear-gradient(45deg, {{primaryColor}}, {{secondaryColor}});
                    color: white;
                    padding: 8px 16px;
                    border-radius: 25px;
                    font-size: 13px;
                    font-weight: 500;
                    transition: transform 0.2s ease;
                }
                
                .skill-tag:hover {
                    transform: scale(1.05);
                }
                
                /* Education cards */
                .education-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 10px;
                    border-left: 3px solid {{secondaryColor}};
                }
                
                /* Projects grid */
                .projects-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                }
                
                .project-card {
                    background: white;
                    border-radius: 8px;
                    padding: 15px;
                    border: 1px solid #e0e0e0;
                    transition: all 0.3s ease;
                }
                
                .project-card:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                
                /* Responsive design */
                @media (max-width: 768px) {
                    .cv-template {
                        margin: 10px;
                        padding: 15px;
                    }
                    
                    .header {
                        padding: 30px 20px;
                    }
                    
                    .name {
                        font-size: 28px;
                    }
                    
                    .contact {
                        flex-direction: column;
                        gap: 10px;
                    }
                    
                    .section {
                        padding: 20px;
                    }
                    
                    .projects-grid {
                        grid-template-columns: 1fr;
                    }
                }
                
                /* Print styles */
                @media print {
                    .cv-template {
                        box-shadow: none;
                        border-radius: 0;
                    }
                    
                    .section:hover {
                        transform: none;
                        box-shadow: none;
                    }
                    
                    .experience-card:hover {
                        transform: none;
                        box-shadow: none;
                    }
                }
            </style>
            
            <div class="header">
                <div class="name">{{fullName}}</div>
                <div class="title">{{jobTitle}}</div>
                <div class="contact">
                    <span>{{email}}</span>
                    <span>{{phoneNumber}}</span>
                    <span>{{address}}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">Professional Summary</div>
                <div class="item-description">{{professionalSummary}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Work Experience</div>
                {{workExperience}}
            </div>
            
            <div class="section">
                <div class="section-title">Education</div>
                {{education}}
            </div>
            
            <div class="section">
                <div class="section-title">Skills</div>
                <div class="skills-container">{{skills}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Projects</div>
                <div class="projects-grid">{{projects}}</div>
            </div>
            
            <div class="section">
                <div class="section-title">Certifications</div>
                {{certificates}}
            </div>
            
            <div class="section">
                <div class="section-title">Languages</div>
                {{languages}}
            </div>
            
            <div class="section">
                <div class="section-title">Interests</div>
                {{interests}}
            </div>
        </div>';
    }
}