import { useState, useEffect } from 'react';

const getStatements = (userName) => [
  `Back at it, ${userName}`
];

export function TypewriterWelcome({ userName }) {
  const [statementIndex, setStatementIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    const statements = getStatements(userName);
    const currentStatement = statements[statementIndex];
    let timeout;

    if (isWaiting) {
      // Don't cycle, just stay there since it's only one statement
      return;
    }

    if (displayText.length < currentStatement.length) {
      timeout = setTimeout(() => {
        setDisplayText(currentStatement.slice(0, displayText.length + 1));
      }, 70); // Typing speed
    } else {
      setIsWaiting(true);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isWaiting, statementIndex, userName]);

  return (
    <div className="typewriter-container typewriter-large">
      <span className="typewriter-text">{displayText}</span>
      <span className="typewriter-cursor">|</span>
    </div>
  );
}
