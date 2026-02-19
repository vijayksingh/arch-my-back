import { parser } from './syntax.js';

// Test 1: Simple architecture
const test1 = `archspec v1

architecture "Test" {
  vars {
    x: "hello"
  }
}`;

console.log('Test 1: Basic architecture with vars');
const tree1 = parser.parse(test1);
let hasErrors1 = false;
tree1.iterate({
  enter(node) {
    if (node.type.isError) {
      hasErrors1 = true;
      console.log(`  Error at ${node.from}-${node.to}: "${test1.substring(node.from, node.to)}"`);
    }
  }
});
console.log(hasErrors1 ? '  ✗ Failed' : '  ✓ Passed');

// Test 2: Component declaration
const test2 = `archspec v1

architecture "Test" {
  cdn1 = cdn "CloudFront" {}
}`;

console.log('\nTest 2: Component declaration');
const tree2 = parser.parse(test2);
let hasErrors2 = false;
tree2.iterate({
  enter(node) {
    if (node.type.isError) {
      hasErrors2 = true;
      console.log(`  Error at ${node.from}-${node.to}: "${test2.substring(node.from, node.to)}"`);
    }
  }
});
console.log(hasErrors2 ? '  ✗ Failed' : '  ✓ Passed');

// Test 3: Group declaration
const test3 = `archspec v1

architecture "Test" {
  edge = group "Edge" {}
}`;

console.log('\nTest 3: Group declaration');
const tree3 = parser.parse(test3);
let hasErrors3 = false;
tree3.iterate({
  enter(node) {
    if (node.type.isError) {
      hasErrors3 = true;
      console.log(`  Error at ${node.from}-${node.to}: "${test3.substring(node.from, node.to)}"`);
    }
  }
});
console.log(hasErrors3 ? '  ✗ Failed' : '  ✓ Passed');

// Test 4: Connection
const test4 = `archspec v1

architecture "Test" {
  a -> b
}`;

console.log('\nTest 4: Connection');
const tree4 = parser.parse(test4);
let hasErrors4 = false;
tree4.iterate({
  enter(node) {
    if (node.type.isError) {
      hasErrors4 = true;
      console.log(`  Error at ${node.from}-${node.to}: "${test4.substring(node.from, node.to)}"`);
    }
  }
});
console.log(hasErrors4 ? '  ✗ Failed' : '  ✓ Passed');
