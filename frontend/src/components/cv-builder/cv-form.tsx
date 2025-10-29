import { useEffect, useState, useRef } from "react";
import { useForm, useFieldArray, useWatch, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Textarea from "../../components/ui/Textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../components/ui/form";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";
import { useToast } from "../../hooks/use-toast";

const experienceSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string(),
  description: z.string(),
});

const educationSchema = z.object({
  degree: z.string().min(1, "Degree is required"),
  institution: z.string().min(1, "Institution is required"),
  graduationYear: z.string().min(1, "Year is required"),
});

const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: z.string().min(1, "Project description is required"),
  technologies: z.string(),
  url: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

const certificateSchema = z.object({
  name: z.string().min(1, "Certificate name is required"),
  issuer: z.string().min(1, "Issuer is required"),
  date: z.string().min(1, "Date is required"),
  credentialId: z.string().optional(),
  url: z.string().optional(),
});

const languageSchema = z.object({
  language: z.string().min(1, "Language is required"),
  proficiency: z.enum(["Beginner", "Intermediate", "Advanced", "Native", "Fluent"]),
});

const achievementSchema = z.object({
  title: z.string().min(1, "Achievement title is required"),
  description: z.string().min(1, "Achievement description is required"),
  date: z.string().optional(),
});

const referenceSchema = z.object({
  name: z.string().min(1, "Reference name is required"),
  position: z.string().min(1, "Position is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

const interestSchema = z.object({
  category: z.string().min(1, "Category is required"),
  items: z.string().min(1, "At least one interest is required"),
});

const cvSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  jobTitle: z.string(),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string(),
  address: z.string(),
  profilePictureUrl: z.string(),
  professionalSummary: z.string(),
  workExperience: z.array(experienceSchema),
  education: z.array(educationSchema),
  skills: z.string(),
  projects: z.array(projectSchema),
  certificates: z.array(certificateSchema),
  languages: z.array(languageSchema),
  achievements: z.array(achievementSchema),
  references: z.array(referenceSchema),
  interests: z.array(interestSchema),
  jobDescription: z.string().optional(),
});

export type CVData = z.infer<typeof cvSchema>;

export const defaultCVData: CVData = {
    fullName: "",
    jobTitle: "",
    email: "",
    phoneNumber: "",
    address: "",
    profilePictureUrl: "",
    professionalSummary: "",
    workExperience: [
        { jobTitle: "", company: "", startDate: "", endDate: "", description: "" }
    ],
    education: [
        { degree: "", institution: "", graduationYear: "" }
    ],
    skills: "",
    projects: [
        { name: "", description: "", technologies: "", url: "", startDate: "", endDate: "" }
    ],
    certificates: [
        { name: "", issuer: "", date: "", credentialId: "", url: "" }
    ],
    languages: [
        { language: "", proficiency: "Intermediate" }
    ],
    achievements: [
        { title: "", description: "", date: "" }
    ],
    references: [
        { name: "", position: "", company: "", email: "", phone: "" }
    ],
    interests: [
        { category: "Hobbies", items: "" }
    ],
    jobDescription: "",
};

type CvFormProps = {
  data: CVData;
  onDataChange: (data: CVData) => void;
};

// This component isolates the useWatch hook to prevent re-rendering the entire form.
function WatchedForm({ control, onDataChange }: { control: Control<CVData>, onDataChange: (data: CVData) => void }) {
  const watchedData = useWatch({ control });

  useEffect(() => {
    const handler = setTimeout(() => {
        onDataChange(watchedData as CVData);
    }, 300); // Debounce the update slightly

    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(watchedData), onDataChange]);

  return null;
}

export function CvForm({ data, onDataChange }: CvFormProps) {
  const [apiStats, setApiStats] = useState({ totalRequests: 0, availableRequests: 0 });
  const pictureFileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const form = useForm<CVData>({
    resolver: zodResolver(cvSchema),
    defaultValues: data,
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control: form.control,
    name: "workExperience",
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control: form.control,
    name: "education",
  });

  // Fetch API stats on component mount
  useEffect(() => {
    fetchApiStats();
  }, []);

  const fetchApiStats = async () => {
    try {
      const response = await fetch('/api/cv-ai/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setApiStats({
            totalRequests: data.data.total_requests,
            availableRequests: data.data.available_requests
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch API stats:', error);
    }
  };

  const handleFileUpload = async (file: File, type: 'cv' | 'picture') => {
    if (type === 'cv') {
      try {
        const formData = new FormData();
        formData.append('cv_file', file);

        const response = await fetch('/api/cv/parse', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const parsedData = await response.json();
          form.reset(parsedData);
          addToast({
            type: 'success',
            title: 'CV Parsed Successfully',
            description: 'Your CV has been parsed and the form has been filled automatically.',
          });
          await fetchApiStats(); // Refresh API stats
        } else {
          const error = await response.json();
          addToast({
            type: 'error',
            title: 'Parsing Failed',
            description: error.message || 'Failed to parse CV. Please try again.',
          });
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: 'Parsing Failed',
          description: 'Network error. Please check your connection and try again.',
        });
      } finally {
        // File upload completed
      }
    } else if (type === 'picture') {
      // Handle picture upload
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        form.setValue('profilePictureUrl', result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      {/* API Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">AI Requests Available</h3>
            <p className="text-3xl font-bold text-blue-600 mb-1">{apiStats.availableRequests}</p>
            <p className="text-sm text-blue-700">out of {apiStats.totalRequests} total requests</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-900 mb-1">Powered by Gemini AI</p>
            <p className="text-xs text-blue-700">5 requests per API key</p>
            </div>
        </div>
        </div>

      <Form control={form.control}>
        <WatchedForm control={form.control} onDataChange={onDataChange} />
          
        <div className="space-y-6">
          <Accordion type="single" defaultValue="personal">
          {/* Personal Information */}
          <AccordionItem value="personal">
            <AccordionTrigger className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-semibold">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
              </div>
                <span>Personal Information</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 bg-white">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  name="fullName"
                  render={({ field, fieldState }: { field: any, fieldState: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Full Name *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter your full name" 
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm">{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="jobTitle"
                  render={({ field, fieldState }: { field: any, fieldState: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Job Title</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="e.g., Software Engineer" 
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm">{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="email"
                  render={({ field, fieldState }: { field: any, fieldState: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Email *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="email" 
                          placeholder="your.email@example.com" 
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm">{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="phoneNumber"
                  render={({ field, fieldState }: { field: any, fieldState: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Phone Number</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="+1 (555) 123-4567" 
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm">{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="address"
                  render={({ field, fieldState }: { field: any, fieldState: any }) => (
                    <FormItem className="md:col-span-2 space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Address</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="123 Main St, City, State 12345" 
                          className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm">{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />

                <FormField
                  name="profilePictureUrl"
                  render={({ field }: { field: any }) => (
                    <FormItem className="md:col-span-2">
                  <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                        <div className="flex items-center space-x-4">
                          <Input {...field} placeholder="Image URL" />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => pictureFileInputRef.current?.click()}
                          >
                            Upload
                    </Button>
                          <input
                      ref={pictureFileInputRef}
                      type="file"
                            accept="image/*"
                      className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file, 'picture');
                            }}
                    />
                  </div>
                      </FormControl>
                </FormItem>
                  )}
                />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Professional Summary */}
          <AccordionItem value="summary">
            <AccordionTrigger className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-semibold">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span>Professional Summary</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 bg-white">
                <FormField
                  name="professionalSummary"
                  render={({ field, fieldState }: { field: any, fieldState: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Summary</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Write a brief summary of your professional background and career objectives..."
                          rows={4}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none"
                        />
                      </FormControl>
                      <FormMessage className="text-red-600 text-sm">{fieldState.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Work Experience */}
          <AccordionItem value="experience">
            <AccordionTrigger className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-semibold">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                  </svg>
                </div>
                <span>Work Experience</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 bg-white">
              <div className="space-y-4">
                {expFields?.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Experience {index + 1}</h4>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeExp(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        name={`workExperience.${index}.jobTitle`}
                        render={({ field, fieldState }: { field: any, fieldState: any }) => (
                          <FormItem>
                            <FormLabel>Job Title *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Software Engineer" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`workExperience.${index}.company`}
                        render={({ field, fieldState }: { field: any, fieldState: any }) => (
                          <FormItem>
                            <FormLabel>Company *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Tech Corp" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`workExperience.${index}.startDate`}
                        render={({ field, fieldState }: { field: any, fieldState: any }) => (
                          <FormItem>
                            <FormLabel>Start Date *</FormLabel>
                            <FormControl>
                              <Input {...field} type="month" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`workExperience.${index}.endDate`}
                        render={({ field }: { field: any }) => (
                          <FormItem>
                            <FormLabel>End Date</FormLabel>
                            <FormControl>
                              <Input {...field} type="month" placeholder="Present" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`workExperience.${index}.description`}
                        render={({ field }: { field: any }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Describe your responsibilities and achievements..."
                                rows={3}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                  </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendExp({ jobTitle: "", company: "", startDate: "", endDate: "", description: "" })}
                >
                  Add Experience
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Education */}
          <AccordionItem value="education">
            <AccordionTrigger className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-semibold">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.083 12.083 0 01.665-6.479L12 14z" />
                  </svg>
                </div>
                <span>Education</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 bg-white">
              <div className="space-y-4">
                {eduFields?.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Education {index + 1}</h4>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => removeEdu(index)}
                      >
                        Remove
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        name={`education.${index}.degree`}
                        render={({ field, fieldState }: { field: any, fieldState: any }) => (
                          <FormItem>
                            <FormLabel>Degree *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Bachelor of Science" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`education.${index}.institution`}
                        render={({ field, fieldState }: { field: any, fieldState: any }) => (
                          <FormItem>
                            <FormLabel>Institution *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., University Name" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                      <FormField
                        name={`education.${index}.graduationYear`}
                        render={({ field, fieldState }: { field: any, fieldState: any }) => (
                          <FormItem>
                            <FormLabel>Graduation Year *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="2020" />
                            </FormControl>
                            <FormMessage>{fieldState.error?.message}</FormMessage>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => appendEdu({ degree: "", institution: "", graduationYear: "" })}
                >
                  Add Education
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Skills */}
           <AccordionItem value="skills">
            <AccordionTrigger className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 text-gray-900 font-semibold">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <span>Skills</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="p-6 bg-white">
                <FormField
                  name="skills"
                  render={({ field }: { field: any }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-sm font-semibold text-gray-700">Skills</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="List your skills separated by commas (e.g., JavaScript, React, Python, SQL)"
                          rows={3}
                          className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg resize-none"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
        </div>
    </Form>
    </div>
  );
}