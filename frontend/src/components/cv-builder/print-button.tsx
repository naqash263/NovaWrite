import { useState } from 'react';
import Button from "../../components/ui/Button";
import html2pdf from 'html2pdf.js';
import { useToast } from '../../hooks/use-toast';

export function PrintButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { addToast } = useToast();

  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    
    try {
      // Find the CV preview element
      const cvElement = document.querySelector('[data-cv-preview]');
      if (!cvElement) {
        addToast({
          type: 'error',
          title: 'CV Preview Not Found',
          description: 'Please make sure you are on the preview step.',
          duration: 5000
        });
        return;
      }

      // Configure PDF options
      const opt = {
        margin: 0.5,
        filename: 'cv.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait' 
        }
      };

      // Generate and download PDF
      await html2pdf().set(opt).from(cvElement).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast({
        type: 'error',
        title: 'PDF Generation Failed',
        description: 'Failed to generate PDF. Please try again.',
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button 
      onClick={handleDownloadPDF} 
      disabled={isGenerating}
      className="print:hidden"
    >
      {isGenerating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Generating...
        </>
      ) : (
        <>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Download PDF
        </>
      )}
    </Button>
  );
}