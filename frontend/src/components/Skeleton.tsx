interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const PostCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-20 bg-gray-200 rounded-full" />
        <div className="h-4 w-24 bg-gray-200 rounded" />
      </div>
      <div className="h-6 bg-gray-200 rounded mb-3" />
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
    </div>
  </div>
);

export const WorkflowCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md p-8 animate-pulse">
    <div className="flex gap-2 mb-3">
      <div className="h-6 w-16 bg-gray-200 rounded-full" />
      <div className="h-6 w-20 bg-gray-200 rounded-full" />
    </div>
    <div className="h-8 bg-gray-200 rounded mb-4" />
    <div className="h-4 bg-gray-200 rounded mb-2" />
    <div className="h-4 bg-gray-200 rounded mb-2 w-4/5" />
    <div className="h-4 bg-gray-200 rounded mb-6 w-3/5" />
    
    <div className="mb-4">
      <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
      <div className="flex flex-wrap gap-2">
        <div className="h-6 w-16 bg-gray-200 rounded-full" />
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
        <div className="h-6 w-14 bg-gray-200 rounded-full" />
      </div>
    </div>
    
    <div className="mb-6">
      <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
      <div className="space-y-1">
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
        <div className="h-4 bg-gray-200 rounded w-3/6" />
      </div>
    </div>
  </div>
);

export const CourseCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <div className="h-48 bg-gray-200" />
    <div className="p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-4 w-16 bg-gray-200 rounded-full" />
        <div className="h-4 w-12 bg-gray-200 rounded" />
      </div>
      <div className="h-6 bg-gray-200 rounded mb-3" />
      <div className="h-4 bg-gray-200 rounded mb-2" />
      <div className="h-4 bg-gray-200 rounded mb-4 w-4/5" />
      
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 w-16 bg-gray-200 rounded" />
        <div className="h-4 w-20 bg-gray-200 rounded" />
      </div>
      
      <div className="h-10 bg-gray-200 rounded" />
    </div>
  </div>
);

export const TableRowSkeleton = ({ columns = 4 }: { columns?: number }) => (
  <tr className="animate-pulse">
    {Array.from({ length: columns }).map((_, index) => (
      <td key={index} className="px-6 py-4">
        <div className="h-4 bg-gray-200 rounded" />
      </td>
    ))}
  </tr>
);

export const FormSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow-md animate-pulse">
    <div className="space-y-4">
      <div>
        <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div>
        <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
      <div>
        <div className="h-4 w-16 bg-gray-200 rounded mb-2" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-20 bg-gray-200 rounded" />
        <div className="h-10 w-24 bg-gray-200 rounded" />
      </div>
    </div>
  </div>
);

export const DashboardStatsSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-lg" />
          <div className="ml-4 flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2" />
            <div className="h-6 w-16 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export const PageHeaderSkeleton = () => (
  <div className="flex justify-between items-center mb-8 animate-pulse">
    <div className="h-8 w-48 bg-gray-200 rounded" />
    <div className="h-10 w-32 bg-gray-200 rounded" />
  </div>
);