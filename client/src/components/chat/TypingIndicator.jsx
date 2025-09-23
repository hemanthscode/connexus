import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (!typingUsers || typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : `${typingUsers.join(', ')} are typing...`;

  return (
    <div
      className="p-2 text-sm italic text-gray-600 select-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {text}
    </div>
  );
};

export default TypingIndicator;
