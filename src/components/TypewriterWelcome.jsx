import { useState, useEffect } from 'react';

const getStatements = (userName) => [
  `Hi ${userName} 👋 I'm Nota, your personal study assistant.`,
  `I can answer questions from your notes or any topic you're studying.`,
  `Upload a PDF or .txt of your notes and I'll study them with you.`,
  `Click the + icon to switch modes and access quick actions.`,
  `What are you working on today?`
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
      timeout = setTimeout(() => {
        setIsWaiting(false);
        setDisplayText('');
        setStatementIndex((prev) => (prev + 1) % statements.length);
      }, 5000); // Wait 5 seconds
      return () => clearTimeout(timeout);
    }

    if (displayText.length < currentStatement.length) {
      timeout = setTimeout(() => {
        setDisplayText(currentStatement.slice(0, displayText.length + 1));
      }, 50); // Typing speed
    } else {
      setIsWaiting(true);
    }

    return () => clearTimeout(timeout);
  }, [displayText, isWaiting, statementIndex, userName]);

  return (
    <div className="message-bubble assistant welcome">
      <div className="typewriter-container">
        <span className="typewriter-text">{displayText}</span>
        <span className="typewriter-cursor">
          <img src="/favicon.svg" alt="cursor" width="16" height="16" />
        </span>
      </div>
    </div>
  );
}
