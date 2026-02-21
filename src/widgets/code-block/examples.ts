import type { WidgetExample } from '../types';
import type { CodeBlockInput, CodeBlockConfig } from './CodeBlock';

/**
 * Example 1: JavaScript REPL
 */
export const javascriptReplExample: WidgetExample<CodeBlockInput, CodeBlockConfig> = {
  name: 'JavaScript REPL',
  description: 'Interactive JavaScript code editor',
  input: {
    language: 'javascript',
    code: `// Welcome to the JavaScript REPL!
// Try running this code

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
  console.log(\`fib(\${i}) = \${fibonacci(i)}\`);
}

// Return the 10th fibonacci number
fibonacci(10);`,
    runtime: 'sandboxed',
  },
  config: {
    name: 'JavaScript REPL',
    editable: true,
    showOutput: true,
    theme: 'dark',
  },
};

/**
 * Example 2: Array Methods Demo
 */
export const arrayMethodsExample: WidgetExample<CodeBlockInput, CodeBlockConfig> = {
  name: 'Array Methods Demo',
  description: 'Demonstrate JavaScript array methods',
  input: {
    language: 'javascript',
    code: `// Array methods demonstration

const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

console.log('Original array:', numbers);

// Filter even numbers
const evens = numbers.filter(n => n % 2 === 0);
console.log('Even numbers:', evens);

// Map to squares
const squares = numbers.map(n => n * n);
console.log('Squares:', squares);

// Reduce to sum
const sum = numbers.reduce((acc, n) => acc + n, 0);
console.log('Sum:', sum);

// Chain operations
const result = numbers
  .filter(n => n > 5)
  .map(n => n * 2)
  .reduce((acc, n) => acc + n, 0);

console.log('Chained result:', result);

result;`,
    runtime: 'sandboxed',
  },
  config: {
    name: 'Array Methods',
    editable: true,
    showOutput: true,
    theme: 'dark',
  },
};

/**
 * Example 3: API Request Builder (simulation)
 */
export const apiRequestExample: WidgetExample<CodeBlockInput, CodeBlockConfig> = {
  name: 'API Request Builder',
  description: 'Simulate API requests and responses',
  input: {
    language: 'javascript',
    code: `// Simulate API request
// (In production, this would make real HTTP calls)

async function fetchUser(userId) {
  console.log(\`Fetching user \${userId}...\`);

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // Mock response
  return {
    id: userId,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'developer'
  };
}

async function fetchPosts(userId) {
  console.log(\`Fetching posts for user \${userId}...\`);

  await new Promise(resolve => setTimeout(resolve, 300));

  return [
    { id: 1, title: 'Hello World', userId },
    { id: 2, title: 'GraphQL vs REST', userId }
  ];
}

// Use async/await
(async () => {
  try {
    const user = await fetchUser(1);
    console.log('User:', user);

    const posts = await fetchPosts(user.id);
    console.log('Posts:', posts);

    console.log(\`\${user.name} has \${posts.length} posts\`);
  } catch (error) {
    console.error('Error:', error);
  }
})();`,
    runtime: 'sandboxed',
  },
  config: {
    name: 'API Request Builder',
    editable: true,
    showOutput: true,
    theme: 'dark',
  },
};

/**
 * Example 4: Data Transformation
 */
export const dataTransformExample: WidgetExample<CodeBlockInput, CodeBlockConfig> = {
  name: 'Data Transformation',
  description: 'Transform and analyze data',
  input: {
    language: 'javascript',
    code: `// Transform data from API format to UI format

const apiResponse = {
  data: {
    users: [
      { id: 1, first_name: 'Alice', last_name: 'Johnson', age: 28 },
      { id: 2, first_name: 'Bob', last_name: 'Smith', age: 34 },
      { id: 3, first_name: 'Charlie', last_name: 'Brown', age: 22 }
    ]
  },
  meta: {
    total: 3,
    page: 1
  }
};

console.log('API Response:', apiResponse);

// Transform to UI format
const uiData = apiResponse.data.users.map(user => ({
  id: user.id,
  fullName: \`\${user.first_name} \${user.last_name}\`,
  age: user.age,
  isAdult: user.age >= 18
}));

console.log('\\nTransformed for UI:', uiData);

// Calculate statistics
const avgAge = uiData.reduce((sum, u) => sum + u.age, 0) / uiData.length;
console.log('\\nAverage age:', avgAge.toFixed(1));

uiData;`,
    runtime: 'sandboxed',
  },
  config: {
    name: 'Data Transformation',
    editable: true,
    showOutput: true,
    theme: 'dark',
  },
};

export const codeBlockExamples = [
  javascriptReplExample,
  arrayMethodsExample,
  apiRequestExample,
  dataTransformExample,
];
