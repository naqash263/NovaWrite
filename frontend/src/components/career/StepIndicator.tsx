/** Wrapping step indicator for the multi-step career tools (never overflows at phone width). */
export default function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  const index = Math.min(Math.max(current, 0), steps.length - 1);
  return (
    <nav aria-label="Progress" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2">
        {steps.map((title, i) => (
          <li key={title} className="flex items-center gap-2" aria-current={i === index ? 'step' : undefined}>
            <span
              className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-medium sm:h-8 sm:w-8 sm:text-sm ${
                i <= index ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}
            >
              {i + 1}
              <span className="sr-only">. {title}</span>
            </span>
            <span className={`hidden text-sm md:inline ${i === index ? 'font-semibold text-blue-700' : 'text-gray-600'}`} aria-hidden="true">
              {title}
            </span>
            {i < steps.length - 1 && <span aria-hidden="true" className={`h-0.5 w-4 sm:w-6 ${i < index ? 'bg-blue-600' : 'bg-gray-300'}`} />}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-sm text-gray-600 md:hidden" data-testid="step-label">
        Step {index + 1} of {steps.length}: <span className="font-medium text-gray-900">{steps[index]}</span>
      </p>
    </nav>
  );
}
