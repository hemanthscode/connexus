import { formatDistanceToNow, parseISO } from 'date-fns';

export const relativeTimeFromNow = (isoDate) => {
  try {
    return formatDistanceToNow(parseISO(isoDate), { addSuffix: true });
  } catch {
    return '';
  }
};
