import { parser } from './syntax.js';

// Test: Nested group with component
const test = `archspec v1

architecture "Test" {
  edge = group "Edge Layer" {
    cdn = cdn "CloudFront" {}
  }
}`;

console.log('Test: Nested group with component');
const tree = parser.parse(test);
let hasErrors = false;
tree.iterate({
  enter(node) {
    if (node.type.isError) {
      hasErrors = true;
      const text = test.substring(node.from, node.to);
      console.log(`  Error at ${node.from}-${node.to}: "${text}"`);
      console.log(`  Parent: ${node.node.parent?.type.name}`);
    }
  }
});

if (!hasErrors) {
  console.log('  ✓ Passed');
  console.log('\nTree structure:');
  tree.iterate({
    enter(node) {
      const indent = ' '.repeat(node.node.depth * 2);
      const text = test.substring(node.from, node.to).replace(/\n/g, '\\n');
      const preview = text.length > 40 ? text.substring(0, 40) + '...' : text;
      console.log(`${indent}${node.type.name}: "${preview}"`);
    }
  });
} else {
  console.log('  ✗ Failed');
}
