import React, { createContext, useContext, forwardRef } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';

// Form Context
interface FormContextValue {
  control: Control<any>;
}

const FormContext = createContext<FormContextValue | null>(null);

// Form Component
interface FormProps {
  children: React.ReactNode;
  control: Control<any>;
  className?: string;
}

export const Form = ({ children, control, className = '' }: FormProps) => {
  return (
    <FormContext.Provider value={{ control }}>
      <form className={className}>
        {children}
      </form>
    </FormContext.Provider>
  );
};

// FormControl Component
interface FormControlProps {
  children: React.ReactNode;
  className?: string;
}

export const FormControl = forwardRef<HTMLDivElement, FormControlProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`relative ${className}`}>
        {children}
      </div>
    );
  }
);

FormControl.displayName = 'FormControl';

// FormField Component
interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  control?: Control<TFieldValues>;
  render: (props: {
    field: {
      onChange: (value: any) => void;
      onBlur: () => void;
      value: any;
      name: string;
      ref: React.Ref<any>;
    };
    fieldState: {
      error?: any;
      isTouched: boolean;
      isDirty: boolean;
    };
    formState: {
      errors: any;
      isSubmitting: boolean;
    };
  }) => React.ReactElement;
}

export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({ name, control, render }: FormFieldProps<TFieldValues, TName>) => {
  const context = useContext(FormContext);
  const formControl = control || context?.control;

  if (!formControl) {
    throw new Error('FormField must be used within a Form component or provide a control prop');
  }

  return (
    <Controller
      name={name}
      control={formControl}
      render={({ field, fieldState, formState }) => {
        return render({
          field: {
            ...field,
            ref: field.ref,
          },
          fieldState,
          formState,
        });
      }}
    />
  );
};

// FormItem Component
interface FormItemProps {
  children: React.ReactNode;
  className?: string;
}

export const FormItem = forwardRef<HTMLDivElement, FormItemProps>(
  ({ children, className = '' }, ref) => {
    return (
      <div ref={ref} className={`space-y-2 ${className}`}>
        {children}
      </div>
    );
  }
);

FormItem.displayName = 'FormItem';

// FormLabel Component
interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
  className?: string;
}

export const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-medium text-gray-700 ${className}`}
        {...props}
      >
        {children}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

// FormMessage Component
interface FormMessageProps {
  children?: React.ReactNode;
  className?: string;
}

export const FormMessage = forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ children, className = '' }, ref) => {
    if (!children) return null;

    return (
      <p
        ref={ref}
        className={`text-sm text-red-600 mt-1 ${className}`}
      >
        {children}
      </p>
    );
  }
);

FormMessage.displayName = 'FormMessage';
