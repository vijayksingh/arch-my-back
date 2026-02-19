/**
 * Simple verification script to test that the parser can handle
 * the E-Commerce Platform example from the requirements.
 *
 * This is NOT a test file - just a quick verification script.
 */

import { parser } from './syntax.js';

const example = `archspec v1

architecture "E-Commerce Platform" {

  vars {
    region: "us-east-1"
    default_runtime: "node:20"
  }

  edge = group "Edge Layer" {
    cdn     = cdn "CloudFront" {}
    waf     = waf "API Firewall" { rules: ["rate-limit", "sqli", "xss"] }
    gateway = api_gateway "Kong Gateway" { rate_limit: 10000 }
  }

  compute = group "Compute" {
    api = app_server "Product API" {
      runtime:  \${default_runtime}
      replicas: 3
      cpu:      "2vCPU"
      memory:   "4GB"
    }
    worker = worker "Order Processor" {
      runtime:  "python:3.12"
      replicas: 2
    }
  }

  storage = group "Data Layer" {
    pg = postgres "Products DB" {
      storage:  "500GB"
      replicas: 2
      mode:     "primary-replica"
      profile:  "standard-oltp"
    }
    redis = cache "Session Store" {
      engine: "redis"
      memory: "6GB"
      ttl:    3600
    }
    s3 = object_storage "Media Bucket" {}
  }

  messaging = group "Async" {
    kafka = event_stream "Order Events" {
      engine:     "kafka"
      partitions: 12
      retention:  "7d"
    }
  }

  aws = group "AWS" {
    region_east = group "us-east-1" {
      vpc = group "Production VPC" {}
    }
  }

  cdn -> waf -> gateway -> api
  api -> pg      { protocol: "TCP", port: 5432, mode: "sync", fanOut: 0.2, label: "cache miss" }
  api -> redis   { protocol: "TCP", port: 6379, mode: "sync", fanOut: 1.0 }
  api -> kafka   { protocol: "TCP", port: 9092, mode: "async", fanOut: 1.0 }
  api -> s3      { protocol: "HTTPS", mode: "sync", fanOut: 0.05 }
  kafka -> worker { protocol: "AMQP", mode: "async" }
  worker -> pg   { protocol: "TCP", port: 5432, mode: "sync", label: "write" }
  api <-> redis  { label: "bidirectional cache" }

  simulation {
    rps:          10000
    duration:     "5m"
    ramp_up:      "30s"
    read_write:   "80:20"
    payload_size: "2KB"
  }
}`;

const tree = parser.parse(example);

console.log('Parse result:');
console.log('- Top node:', tree.topNode.type.name);
console.log('- From:', tree.topNode.from, 'To:', tree.topNode.to);
console.log('- Length:', tree.length);
console.log('- Has errors:', tree.topNode.type.isError);

// Check for error nodes
let hasErrors = false;
tree.iterate({
  enter(node) {
    if (node.type.isError) {
      hasErrors = true;
      console.log('Error node found at', node.from, '-', node.to);
    }
  }
});

if (!hasErrors) {
  console.log('✓ Successfully parsed the E-Commerce Platform example');
} else {
  console.log('✗ Parse errors detected');
  process.exit(1);
}
