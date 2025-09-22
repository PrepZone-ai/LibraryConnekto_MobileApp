export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = (hours % 12 || 12).toString().padStart(2, '0');
  const formattedMinutes = minutes.toString().padStart(2, '0');

  return `${day}/${month}/${d.getFullYear()} ${formattedHours}:${formattedMinutes} ${ampm}`;
};
