<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            // User Management Templates
            [
                'name' => 'welcome_email',
                'subject' => 'Welcome to {{app_name}}! 🚀',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to {{app_name}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{app_name}}! 🚀</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>Welcome to <strong>{{app_name}}</strong> - your gateway to professional writing excellence! We\'re thrilled to have you join our community of writers, content creators, and professionals.</p>
            
            <h2>What\'s Next?</h2>
            <p>Your account is now active and ready to use. Here\'s what you can do:</p>
            <ul>
                <li>📚 <strong>Explore Courses</strong>: Browse our comprehensive writing courses</li>
                <li>📝 <strong>Access Workflows</strong>: Get professional writing templates and guides</li>
                <li>🎯 <strong>Track Progress</strong>: Monitor your learning journey</li>
                <li>💡 <strong>Join Community</strong>: Connect with fellow writers</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{login_url}}" class="button">Get Started Now</a>
            </div>
            
            <h2>Need Help?</h2>
            <p>If you have any questions or need assistance getting started, don\'t hesitate to reach out to our support team at <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
            
            <p>Happy writing!</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'user',
                'variables' => ['user_name', 'user_email', 'app_name', 'app_url', 'login_url', 'support_email', 'current_year'],
                'description' => 'Welcome email sent to new users upon registration',
                'metadata' => ['priority' => 'high', 'tags' => ['welcome', 'onboarding']],
                'is_active' => true,
            ],
            [
                'name' => 'password_reset',
                'subject' => 'Reset Your {{app_name}} Password',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Reset Your Password</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>We received a request to reset your password for your {{app_name}} account. If you didn\'t make this request, you can safely ignore this email.</p>
            
            <h2>Reset Your Password</h2>
            <p>Click the button below to reset your password. This link will expire in <strong>{{expires_in}}</strong> for security reasons.</p>
            
            <div style="text-align: center;">
                <a href="{{reset_url}}" class="button">Reset Password</a>
            </div>
            
            <div class="warning">
                <h3>Security Notice</h3>
                <ul>
                    <li>This link will expire in {{expires_in}}</li>
                    <li>If you didn\'t request this password reset, please ignore this email</li>
                    <li>For security, never share this link with anyone</li>
                    <li>If you continue to have issues, contact our support team</li>
                </ul>
            </div>
            
            <h2>Need Help?</h2>
            <p>If you\'re having trouble with the button above, copy and paste the URL below into your web browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 5px;">{{reset_url}}</p>
            
            <p>If you didn\'t request this password reset, no further action is required.</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'user',
                'variables' => ['user_name', 'user_email', 'reset_url', 'expires_in', 'app_name', 'current_year'],
                'description' => 'Password reset email with secure reset link',
                'metadata' => ['priority' => 'high', 'tags' => ['security', 'password-reset']],
                'is_active' => true,
            ],
            [
                'name' => 'email_verification',
                'subject' => 'Verify Your Email Address - {{app_name}}',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Verify Your Email Address</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>Thank you for signing up for {{app_name}}! To complete your registration and start using your account, please verify your email address.</p>
            
            <h2>Verify Your Email</h2>
            <p>Click the button below to verify your email address and activate your account:</p>
            
            <div style="text-align: center;">
                <a href="{{verification_url}}" class="button">Verify Email Address</a>
            </div>
            
            <p>This verification link will expire in <strong>{{expires_in}}</strong> for security reasons.</p>
            
            <h2>What\'s Next?</h2>
            <p>Once you verify your email, you\'ll be able to:</p>
            <ul>
                <li>Access all features of your account</li>
                <li>Enroll in courses and workflows</li>
                <li>Track your progress</li>
                <li>Connect with the community</li>
            </ul>
            
            <p>If you didn\'t create an account with {{app_name}}, you can safely ignore this email.</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'user',
                'variables' => ['user_name', 'user_email', 'verification_url', 'expires_in', 'app_name', 'current_year'],
                'description' => 'Email verification for new user registration',
                'metadata' => ['priority' => 'high', 'tags' => ['verification', 'registration']],
                'is_active' => true,
            ],
            // Course Related Templates
            [
                'name' => 'course_enrollment',
                'subject' => 'Welcome to {{course_title}}! 📚',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Course Enrollment</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .course-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{course_title}}! 📚</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>Congratulations! You\'ve successfully enrolled in <strong>{{course_title}}</strong>. We\'re excited to have you join this course and start your learning journey.</p>
            
            <div class="course-info">
                <h2>Course Details</h2>
                <p><strong>Course:</strong> {{course_title}}</p>
                <p><strong>Description:</strong> {{course_description}}</p>
                <p><strong>Duration:</strong> {{course_duration}}</p>
                <p><strong>Difficulty:</strong> {{course_difficulty}}</p>
            </div>
            
            <h2>What\'s Next?</h2>
            <p>Your course is now available in your dashboard. Here\'s what you can do:</p>
            <ul>
                <li>📖 <strong>Start Learning</strong>: Access course materials and lessons</li>
                <li>📝 <strong>Track Progress</strong>: Monitor your completion status</li>
                <li>💬 <strong>Join Discussions</strong>: Engage with other learners</li>
                <li>🏆 <strong>Earn Certificates</strong>: Complete the course to earn your certificate</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{course_url}}" class="button">Start Course</a>
            </div>
            
            <h2>Course Features</h2>
            <ul>
                <li>Interactive lessons and materials</li>
                <li>Progress tracking</li>
                <li>Community discussions</li>
                <li>Certificate upon completion</li>
                <li>Lifetime access to course content</li>
            </ul>
            
            <h2>Need Support?</h2>
            <p>If you have any questions about the course or need technical assistance, our support team is here to help at <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
            
            <p>Happy learning!</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'course',
                'variables' => ['user_name', 'course_title', 'course_description', 'course_duration', 'course_difficulty', 'course_url', 'app_name', 'support_email', 'current_year'],
                'description' => 'Course enrollment confirmation email',
                'metadata' => ['priority' => 'medium', 'tags' => ['enrollment', 'course']],
                'is_active' => true,
            ],
            // Workflow Templates
            [
                'name' => 'workflow_notification',
                'subject' => 'New Workflow: {{workflow_title}} 📝',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Workflow Available</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #f5576c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .workflow-info { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f5576c; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>New Workflow Available: {{workflow_title}} 📝</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>A new workflow has been added to your account: <strong>{{workflow_title}}</strong>. This workflow is now available for you to use in your writing projects.</p>
            
            <div class="workflow-info">
                <h2>Workflow Details</h2>
                <p><strong>Title:</strong> {{workflow_title}}</p>
                <p><strong>Description:</strong> {{workflow_description}}</p>
                <p><strong>Estimated Time:</strong> {{workflow_duration}}</p>
                <p><strong>Difficulty:</strong> {{workflow_difficulty}}</p>
            </div>
            
            <h2>What You Can Do</h2>
            <ul>
                <li>📖 <strong>View Workflow</strong>: Access the complete workflow details</li>
                <li>📝 <strong>Start Using</strong>: Begin implementing the workflow in your projects</li>
                <li>💡 <strong>Get Tips</strong>: Learn best practices for effective writing</li>
                <li>🎯 <strong>Track Progress</strong>: Monitor your workflow implementation</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{workflow_url}}" class="button">View Workflow</a>
            </div>
            
            <h2>Workflow Benefits</h2>
            <ul>
                <li>Streamlined writing process</li>
                <li>Professional templates and guides</li>
                <li>Step-by-step instructions</li>
                <li>Best practices and tips</li>
                <li>Improved productivity and quality</li>
            </ul>
            
            <h2>Need Help?</h2>
            <p>If you have questions about this workflow or need assistance implementing it, our support team is ready to help at <a href="mailto:{{support_email}}">{{support_email}}</a>.</p>
            
            <p>Happy writing!</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'workflow',
                'variables' => ['user_name', 'workflow_title', 'workflow_description', 'workflow_duration', 'workflow_difficulty', 'workflow_url', 'app_name', 'support_email', 'current_year'],
                'description' => 'Workflow notification email for new or updated workflows',
                'metadata' => ['priority' => 'medium', 'tags' => ['workflow', 'notification']],
                'is_active' => true,
            ],
            // Marketing Templates
            [
                'name' => 'newsletter',
                'subject' => '{{app_name}} Newsletter - {{date}}',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Newsletter</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .highlight { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{app_name}} Newsletter</h1>
            <p>{{date}}</p>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>Welcome to our weekly newsletter! Here\'s what\'s new and exciting in the world of professional writing.</p>
            
            <div class="highlight">
                <h2>This Week\'s Highlights</h2>
                <p>{{newsletter_content}}</p>
            </div>
            
            <h2>Featured Content</h2>
            <ul>
                <li><strong>New Course:</strong> {{featured_course}}</li>
                <li><strong>Popular Workflow:</strong> {{featured_workflow}}</li>
                <li><strong>Community Spotlight:</strong> {{community_spotlight}}</li>
            </ul>
            
            <h2>Quick Tips</h2>
            <p>{{quick_tips}}</p>
            
            <h2>Stay Connected</h2>
            <p>Follow us on social media for daily writing tips and updates:</p>
            <ul>
                <li>Twitter: @{{app_name}}</li>
                <li>LinkedIn: {{app_name}}</li>
                <li>Facebook: {{app_name}}</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="{{app_url}}" class="button">Visit {{app_name}}</a>
            </div>
            
            <p>Thanks for being part of our community!</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
            <p><a href="{{unsubscribe_url}}">Unsubscribe</a> | <a href="{{preferences_url}}">Email Preferences</a></p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'marketing',
                'variables' => ['user_name', 'app_name', 'date', 'newsletter_content', 'featured_course', 'featured_workflow', 'community_spotlight', 'quick_tips', 'app_url', 'unsubscribe_url', 'preferences_url', 'current_year'],
                'description' => 'Newsletter template for marketing communications',
                'metadata' => ['priority' => 'low', 'tags' => ['newsletter', 'marketing']],
                'is_active' => true,
            ],
            // System Templates
            [
                'name' => 'system_maintenance',
                'subject' => 'Scheduled Maintenance - {{app_name}}',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scheduled Maintenance</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ffc107; color: #333; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Scheduled Maintenance</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{user_name}}</strong>,</p>
            
            <p>We wanted to inform you about an upcoming scheduled maintenance window for {{app_name}}.</p>
            
            <div class="warning">
                <h2>Maintenance Details</h2>
                <p><strong>Date:</strong> {{maintenance_date}}</p>
                <p><strong>Time:</strong> {{maintenance_time}}</p>
                <p><strong>Duration:</strong> {{maintenance_duration}}</p>
                <p><strong>Reason:</strong> {{maintenance_reason}}</p>
            </div>
            
            <h2>What to Expect</h2>
            <p>During this maintenance window:</p>
            <ul>
                <li>The website may be temporarily unavailable</li>
                <li>Some features may be limited</li>
                <li>Your data and progress will be safe</li>
                <li>We\'ll work to minimize downtime</li>
            </ul>
            
            <h2>What You Can Do</h2>
            <p>To prepare for the maintenance:</p>
            <ul>
                <li>Save any work in progress</li>
                <li>Download any important materials</li>
                <li>Plan your activities around the maintenance window</li>
            </ul>
            
            <p>We apologize for any inconvenience this may cause and appreciate your understanding.</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'system',
                'variables' => ['user_name', 'app_name', 'maintenance_date', 'maintenance_time', 'maintenance_duration', 'maintenance_reason', 'current_year'],
                'description' => 'System maintenance notification email',
                'metadata' => ['priority' => 'high', 'tags' => ['maintenance', 'system']],
                'is_active' => true,
            ],
            // Contact Form Templates
            [
                'name' => 'contact_form',
                'subject' => 'Thank You for Contacting {{app_name}}',
                'body' => '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Your Message</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .message-box { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Contacting Us! ✉️</h1>
        </div>
        <div class="content">
            <p>Hi <strong>{{contact_name}}</strong>,</p>
            
            <p>Thank you for reaching out to <strong>{{app_name}}</strong>! We have received your message and truly appreciate you taking the time to contact us.</p>
            
            <div class="message-box">
                <h3>Your Message</h3>
                <p><strong>Subject:</strong> {{contact_subject}}</p>
                <p><strong>Your Query:</strong></p>
                <p>{{contact_message}}</p>
            </div>
            
            <h2>What Happens Next?</h2>
            <p>Our team has received your inquiry and will review it carefully. Here\'s what you can expect:</p>
            <ul>
                <li>📧 We typically respond within <strong>24-48 hours</strong> during business days</li>
                <li>🔍 We\'ll review your specific question or request in detail</li>
                <li>💬 You\'ll receive a personalized response to your inquiry</li>
                <li>✅ We\'ll do our best to address your needs and provide helpful information</li>
            </ul>
            
            <h2>Need Immediate Assistance?</h2>
            <p>If your matter is urgent, please don\'t hesitate to reach out again or call us directly.</p>
            
            <h2>While You Wait</h2>
            <p>In the meantime, you might find these resources helpful:</p>
            <ul>
                <li>📚 Check out our <a href="{{app_url}}/blog">Blog</a> for tips and insights</li>
                <li>💼 Explore our <a href="{{app_url}}/resources">Career Tools</a></li>
                <li>🎓 Browse our <a href="{{app_url}}/courses">Courses</a></li>
                <li>📖 Review our <a href="{{app_url}}">FAQ</a> section</li>
            </ul>
            
            <h2>We Value Your Feedback</h2>
            <p>Your thoughts and questions help us improve our services. We truly appreciate your input and look forward to helping you.</p>
            
            <p>Thank you for being part of the {{app_name}} community!</p>
            
            <p>Best regards,<br><strong>The {{app_name}} Team</strong></p>
            
            <p style="margin-top: 20px; font-size: 13px; color: #666;">
                <strong>Reference:</strong> Your message was received on {{current_date}}<br>
                <strong>Your Contact Email:</strong> {{contact_email}}
            </p>
        </div>
        <div class="footer">
            <p>© {{current_year}} {{app_name}}. All rights reserved.</p>
            <p>You\'re receiving this email because you contacted us through our website.</p>
        </div>
    </div>
</body>
</html>',
                'type' => 'html',
                'category' => 'support',
                'variables' => ['contact_name', 'contact_email', 'contact_subject', 'contact_message', 'app_name', 'app_url', 'current_year', 'current_date'],
                'description' => 'Automated response email to contact form submissions',
                'metadata' => ['priority' => 'high', 'tags' => ['contact', 'support', 'response']],
                'is_active' => true,
            ],
        ];

        foreach ($templates as $template) {
            EmailTemplate::updateOrCreate(
                ['name' => $template['name']],
                $template
            );
        }
    }
}