import Input from "../../components/ui/Input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../../components/ui/accordion";

export type CVStyle = {
  templateName: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSize: number;
};

export const defaultCVStyle: CVStyle = {
    templateName: 'default',
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
};

interface TemplateCustomizerProps {
  style: CVStyle;
  onStyleChange: (style: CVStyle) => void;
  showTemplates?: boolean;
}

export const TemplateCustomizer = ({ style, onStyleChange }: TemplateCustomizerProps) => {
  const handleStyleChange = (field: keyof CVStyle, value: string | number) => {
    onStyleChange({
      ...style,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="w-full" defaultValue={["colors"]}>
        <AccordionItem value="colors">
          <AccordionTrigger className="text-sm font-medium">
            Colors & Typography
          </AccordionTrigger>
          <AccordionContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Primary Color</label>
                <Input
                  type="color"
                  value={style.primaryColor}
                  onChange={(e) => handleStyleChange('primaryColor', e.target.value)}
                  className="w-full h-10"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Secondary Color</label>
                <Input
                  type="color"
                  value={style.secondaryColor}
                  onChange={(e) => handleStyleChange('secondaryColor', e.target.value)}
                  className="w-full h-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Font Family</label>
                <select
                  value={style.fontFamily}
                  onChange={(e) => handleStyleChange('fontFamily', e.target.value)}
                  className="w-full px-4 py-2.5 text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="Calibri, sans-serif">Calibri</option>
                  <option value="Inter, sans-serif">Inter</option>
                  <option value="Helvetica, sans-serif">Helvetica</option>
                  <option value="Roboto, sans-serif">Roboto</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="Times New Roman, serif">Times New Roman</option>
                  <option value="Consolas, monospace">Consolas</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Font Size</label>
                <Input
                  type="number"
                  min="8"
                  max="16"
                  value={style.fontSize}
                  onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};