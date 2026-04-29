import { useState, useEffect } from 'react';

const getStatements = (userName) => [
  `Back at it, ${userName}`,
  "What are we studying today?",
  "Let's make some progress."
];

export function TypewriterWelcome({ userName }) {
  const [statementIndex, setStatementIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const statements = getStatements(userName);
    const currentStatement = statements[statementIndex];
    let timeout;

    if (isWaiting) {
      timeout = setTimeout(() => {
        setIsWaiting(false);
        setIsDeleting(true);
      }, 14000); // Wait 14s before deleting
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(displayText.slice(0, -1));
        }, 30); // Deleting speed
      } else {
        setIsDeleting(false);
        setStatementIndex((prev) => (prev + 1) % statements.length);
      }
    } else {
      if (displayText.length < currentStatement.length) {
        timeout = setTimeout(() => {
          setDisplayText(currentStatement.slice(0, displayText.length + 1));
        }, 70); // Typing speed
      } else {
        setIsWaiting(true);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayText, isWaiting, isDeleting, statementIndex, userName]);

  return (
    <div className="typewriter-container typewriter-large">
      <span className="typewriter-text">{displayText}</span>
      <span className="typewriter-cursor favicon-cursor">
        <img src="/favicon.svg" alt="cursor" />
      </span>
    </div>
  );
}
