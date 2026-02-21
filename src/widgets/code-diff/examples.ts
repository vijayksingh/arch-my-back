import type { WidgetExample } from '../types';
import type { CodeDiffInput, CodeDiffConfig } from './CodeDiff';

/**
 * Example 1: Security Fix - SQL Injection Prevention
 */
export const securityFixExample: WidgetExample<CodeDiffInput, CodeDiffConfig> = {
  name: 'Security Fix: SQL Injection',
  description: 'Before/after comparison of a SQL injection vulnerability fix',
  input: {
    language: 'javascript',
    filename: 'api/users.js',
    oldCode: `async function getUser(userId) {
  // VULNERABLE: SQL injection possible!
  const query = \`SELECT * FROM users WHERE id = '\${userId}'\`;
  const result = await db.query(query);
  return result.rows[0];
}

async function searchUsers(searchTerm) {
  // VULNERABLE: Direct string concatenation
  const query = "SELECT * FROM users WHERE name LIKE '%" + searchTerm + "%'";
  return await db.query(query);
}`,
    newCode: `async function getUser(userId) {
  // FIXED: Using parameterized query
  const query = 'SELECT * FROM users WHERE id = $1';
  const result = await db.query(query, [userId]);
  return result.rows[0];
}

async function searchUsers(searchTerm) {
  // FIXED: Using parameterized query with proper escaping
  const query = 'SELECT * FROM users WHERE name LIKE $1';
  return await db.query(query, [\`%\${searchTerm}%\`]);
}`,
  },
  config: {
    name: 'Security Fix',
    viewMode: 'split',
    showLineNumbers: true,
  },
};

/**
 * Example 2: Refactoring - Class to Functional Component
 */
export const refactoringExample: WidgetExample<CodeDiffInput, CodeDiffConfig> = {
  name: 'Refactoring: Class to Hooks',
  description: 'Converting a React class component to a functional component with hooks',
  input: {
    language: 'typescript',
    filename: 'components/Counter.tsx',
    oldCode: `import React, { Component } from 'react';

interface CounterProps {
  initialCount?: number;
}

interface CounterState {
  count: number;
}

class Counter extends Component<CounterProps, CounterState> {
  constructor(props: CounterProps) {
    super(props);
    this.state = {
      count: props.initialCount || 0,
    };
  }

  increment = () => {
    this.setState({ count: this.state.count + 1 });
  };

  decrement = () => {
    this.setState({ count: this.state.count - 1 });
  };

  render() {
    return (
      <div>
        <h2>Count: {this.state.count}</h2>
        <button onClick={this.increment}>+</button>
        <button onClick={this.decrement}>-</button>
      </div>
    );
  }
}

export default Counter;`,
    newCode: `import { useState } from 'react';

interface CounterProps {
  initialCount?: number;
}

function Counter({ initialCount = 0 }: CounterProps) {
  const [count, setCount] = useState(initialCount);

  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);

  return (
    <div>
      <h2>Count: {count}</h2>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  );
}

export default Counter;`,
  },
  config: {
    name: 'Class to Hooks Refactoring',
    viewMode: 'split',
    showLineNumbers: true,
  },
};

/**
 * Example 3: Performance Optimization
 */
export const performanceExample: WidgetExample<CodeDiffInput, CodeDiffConfig> = {
  name: 'Performance: Debounce Search',
  description: 'Adding debouncing to search input to reduce API calls',
  input: {
    language: 'typescript',
    filename: 'components/SearchBox.tsx',
    oldCode: `import { useState } from 'react';

function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Problem: API call on every keystroke!
    onSearch(value);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search..."
    />
  );
}`,
    newCode: `import { useState, useEffect, useRef } from 'react';

function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debouncing
    timeoutRef.current = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <input
      type="text"
      value={query}
      onChange={handleChange}
      placeholder="Search..."
    />
  );
}`,
  },
  config: {
    name: 'Debounce Optimization',
    viewMode: 'unified',
    showLineNumbers: true,
  },
};

export const codeDiffExamples = [
  securityFixExample,
  refactoringExample,
  performanceExample,
];
