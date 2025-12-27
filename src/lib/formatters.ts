export const formatPrice = (price: number): string => {
  if (price >= 1000000) {
    const millions = price / 1000000;
    return `KES ${millions.toFixed(millions % 1 === 0 ? 0 : 1)}M`;
  }
  if (price >= 1000) {
    const thousands = price / 1000;
    return `KES ${thousands.toFixed(0)}K`;
  }
  return `KES ${price.toLocaleString()}`;
};

export const formatFullPrice = (price: number): string => {
  return `KES ${price.toLocaleString()}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

export const formatRelativeDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return `${Math.floor(diffInDays / 365)} years ago`;
};
