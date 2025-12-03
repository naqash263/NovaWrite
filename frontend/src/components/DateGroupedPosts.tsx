import { PostCard } from './PostCard';

interface Post {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  published_at: string;
  category: {
    id: number;
    name: string;
  };
  user: {
    name: string;
  };
}

interface DateGroupedPostsProps {
  posts: Post[];
}

export default function DateGroupedPosts({ posts }: DateGroupedPostsProps) {
  // Group posts by date (year-month)
  const groupedPosts = posts.reduce((acc, post) => {
    const date = new Date(post.published_at);
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const key = `${year}-${month}`;
    
    if (!acc[key]) {
      acc[key] = {
        year,
        month,
        posts: []
      };
    }
    acc[key].posts.push(post);
    return acc;
  }, {} as Record<string, { year: number; month: string; posts: Post[] }>);

  // Sort posts within each group by published_at (newest first)
  Object.values(groupedPosts).forEach(group => {
    group.posts.sort((a, b) => {
      const dateA = new Date(a.published_at).getTime();
      const dateB = new Date(b.published_at).getTime();
      return dateB - dateA;
    });
  });

  // Sort groups by date (newest first)
  const sortedGroups = Object.values(groupedPosts).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months.indexOf(b.month) - months.indexOf(a.month);
  });

  if (sortedGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-12">
      {sortedGroups.map((group, groupIndex) => (
        <div key={`${group.year}-${group.month}`} className="date-group">
          <div className="mb-6 pb-2 border-b-2 border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {group.month} {group.year}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {group.posts.length} post{group.posts.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {group.posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          
          {groupIndex < sortedGroups.length - 1 && (
            <div className="mt-12 border-t border-gray-200"></div>
          )}
        </div>
      ))}
    </div>
  );
}

