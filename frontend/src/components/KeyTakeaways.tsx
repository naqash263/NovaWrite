interface KeyTakeawaysProps {
  takeaways: string[];
  title?: string;
}

export default function KeyTakeaways({ takeaways, title = "Key Takeaways" }: KeyTakeawaysProps) {
  if (!takeaways || takeaways.length === 0) {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 my-8 rounded-lg">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {title}
      </h3>
      <ul className="space-y-2">
        {takeaways.map((takeaway, index) => (
          <li key={index} className="flex items-start gap-3 text-gray-700">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{takeaway}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

