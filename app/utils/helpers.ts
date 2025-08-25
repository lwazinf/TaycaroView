export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getStudentInitials = (name: string): string => {
  return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
};

export const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-blue-600', 
    'bg-gradient-to-br from-green-400 to-green-600', 
    'bg-gradient-to-br from-purple-400 to-purple-600', 
    'bg-gradient-to-br from-pink-400 to-pink-600', 
    'bg-gradient-to-br from-indigo-400 to-indigo-600', 
    'bg-gradient-to-br from-red-400 to-red-600', 
    'bg-gradient-to-br from-yellow-400 to-yellow-600', 
    'bg-gradient-to-br from-teal-400 to-teal-600'
  ];
  const index = name.length % colors.length;
  return colors[index];
};

export const formatDateForId = (dateString: string): string => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};