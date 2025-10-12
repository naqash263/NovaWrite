import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

// Accordion Context
interface AccordionContextValue {
  openItems: string[];
  toggleItem: (value: string) => void;
  type: 'single' | 'multiple';
}

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<string>('');

// Accordion Component
interface AccordionProps {
  children: React.ReactNode;
  type?: 'single' | 'multiple';
  defaultValue?: string | string[];
  className?: string;
}

export const Accordion = ({ 
  children, 
  type = 'single', 
  defaultValue = type === 'single' ? '' : [],
  className = '' 
}: AccordionProps) => {
  const [openItems, setOpenItems] = useState<string[]>(
    Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []
  );

  const toggleItem = (value: string) => {
    setOpenItems(prev => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value];
      } else {
        return prev.includes(value)
          ? prev.filter(item => item !== value)
          : [...prev, value];
      }
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={`space-y-2 ${className}`}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

// AccordionItem Component
interface AccordionItemProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

export const AccordionItem = ({ children, value, className = '' }: AccordionItemProps) => {
  return (
    <AccordionItemContext.Provider value={value}>
      <div className={`border border-gray-200 rounded-lg ${className}`}>
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

// AccordionTrigger Component
interface AccordionTriggerProps {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const AccordionTrigger = ({ children, className = '', disabled = false }: AccordionTriggerProps) => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error('AccordionTrigger must be used within an Accordion component');
  }

  const { openItems, toggleItem } = context;
  
  // Get the value from the parent AccordionItem
  const parentValue = React.useContext(AccordionItemContext);
  const isOpen = openItems.includes(parentValue);

  return (
    <button
      type="button"
      className={`
        w-full flex items-center justify-between p-4 text-left font-medium
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
        transition-colors duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
          toggleItem(parentValue);
        }
      }}
      disabled={disabled}
    >
      <span>{children}</span>
      <ChevronDownIcon 
        className={`
          w-5 h-5 transition-transform duration-200
          ${isOpen ? 'rotate-180' : ''}
        `} 
      />
    </button>
  );
};

// AccordionContent Component
interface AccordionContentProps {
  children: React.ReactNode;
  className?: string;
}

export const AccordionContent = ({ children, className = '' }: AccordionContentProps) => {
  const context = useContext(AccordionContext);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(0);

  if (!context) {
    throw new Error('AccordionContent must be used within an Accordion component');
  }

  const { openItems } = context;
  const parentValue = useContext(AccordionItemContext);
  const isOpen = openItems.includes(parentValue);

  useEffect(() => {
    if (contentRef.current) {
      if (isOpen) {
        setHeight(contentRef.current.scrollHeight);
      } else {
        setHeight(0);
      }
    }
  }, [isOpen, children]);

  return (
    <div
      className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${className}
      `}
      style={{ height: height }}
    >
      <div ref={contentRef} className="p-4 pt-0">
        {children}
      </div>
    </div>
  );
};
