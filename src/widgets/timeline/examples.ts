import type { WidgetExample } from '../types';
import type { TimelineInput, TimelineConfig } from './Timeline';

/**
 * Example 1: HTTP Request Lifecycle
 */
export const httpRequestExample: WidgetExample<TimelineInput, TimelineConfig> = {
  name: 'HTTP Request Lifecycle',
  description: 'Visualize the flow of an HTTP request through various layers',
  input: {
    events: [
      {
        id: 'req-start',
        timestamp: 0,
        title: 'Request Started',
        description: 'Client initiates HTTP request',
        type: 'start',
        swimlaneId: 'client',
      },
      {
        id: 'dns-lookup',
        timestamp: 10,
        title: 'DNS Lookup',
        description: 'Resolve domain name to IP address',
        type: 'event',
        swimlaneId: 'network',
      },
      {
        id: 'tcp-handshake',
        timestamp: 30,
        title: 'TCP Handshake',
        description: 'Establish TCP connection (SYN, SYN-ACK, ACK)',
        type: 'event',
        swimlaneId: 'network',
      },
      {
        id: 'tls-handshake',
        timestamp: 50,
        title: 'TLS Handshake',
        description: 'Establish secure connection',
        type: 'event',
        swimlaneId: 'network',
      },
      {
        id: 'req-sent',
        timestamp: 80,
        title: 'Request Sent',
        description: 'HTTP request sent to server',
        type: 'event',
        swimlaneId: 'client',
      },
      {
        id: 'server-received',
        timestamp: 100,
        title: 'Request Received',
        description: 'Server receives and starts processing',
        type: 'event',
        swimlaneId: 'server',
      },
      {
        id: 'auth-check',
        timestamp: 120,
        title: 'Authentication',
        description: 'Verify user credentials',
        type: 'decision',
        swimlaneId: 'server',
      },
      {
        id: 'db-query',
        timestamp: 150,
        title: 'Database Query',
        description: 'Fetch data from database',
        type: 'event',
        swimlaneId: 'database',
      },
      {
        id: 'db-response',
        timestamp: 200,
        title: 'Database Response',
        description: 'Data returned from database',
        type: 'event',
        swimlaneId: 'database',
      },
      {
        id: 'response-sent',
        timestamp: 230,
        title: 'Response Sent',
        description: 'Server sends HTTP response',
        type: 'event',
        swimlaneId: 'server',
      },
      {
        id: 'response-received',
        timestamp: 260,
        title: 'Response Received',
        description: 'Client receives response',
        type: 'event',
        swimlaneId: 'client',
      },
      {
        id: 'req-end',
        timestamp: 280,
        title: 'Request Complete',
        description: 'Request lifecycle completed successfully',
        type: 'end',
        swimlaneId: 'client',
      },
    ],
    swimlanes: [
      { id: 'client', label: 'Client' },
      { id: 'network', label: 'Network' },
      { id: 'server', label: 'Server' },
      { id: 'database', label: 'Database' },
    ],
  },
  config: {
    name: 'HTTP Request Lifecycle',
    showSwimlanes: true,
    animate: true,
  },
};

/**
 * Example 2: Authentication Flow
 */
export const authFlowExample: WidgetExample<TimelineInput, TimelineConfig> = {
  name: 'Authentication Flow',
  description: 'OAuth 2.0 authentication sequence',
  input: {
    events: [
      {
        id: 'user-clicks-login',
        timestamp: 0,
        title: 'User Clicks Login',
        description: 'User initiates login flow',
        type: 'start',
        swimlaneId: 'user',
      },
      {
        id: 'redirect-to-oauth',
        timestamp: 50,
        title: 'Redirect to OAuth Provider',
        description: 'App redirects to OAuth provider (e.g., Google)',
        type: 'event',
        swimlaneId: 'app',
      },
      {
        id: 'user-enters-credentials',
        timestamp: 1000,
        title: 'User Enters Credentials',
        description: 'User enters username and password',
        type: 'event',
        swimlaneId: 'user',
      },
      {
        id: 'oauth-validates',
        timestamp: 1500,
        title: 'OAuth Validates Credentials',
        description: 'OAuth provider validates credentials',
        type: 'decision',
        swimlaneId: 'oauth',
      },
      {
        id: 'oauth-consent',
        timestamp: 2000,
        title: 'User Grants Consent',
        description: 'User grants app permission to access data',
        type: 'event',
        swimlaneId: 'user',
      },
      {
        id: 'oauth-returns-code',
        timestamp: 2200,
        title: 'Authorization Code Returned',
        description: 'OAuth returns authorization code to app',
        type: 'event',
        swimlaneId: 'oauth',
      },
      {
        id: 'app-exchanges-code',
        timestamp: 2500,
        title: 'App Exchanges Code for Token',
        description: 'App exchanges code for access token',
        type: 'event',
        swimlaneId: 'app',
      },
      {
        id: 'oauth-returns-token',
        timestamp: 2800,
        title: 'Access Token Returned',
        description: 'OAuth returns access token',
        type: 'event',
        swimlaneId: 'oauth',
      },
      {
        id: 'app-stores-token',
        timestamp: 3000,
        title: 'Token Stored',
        description: 'App stores token securely',
        type: 'event',
        swimlaneId: 'app',
      },
      {
        id: 'user-authenticated',
        timestamp: 3200,
        title: 'User Authenticated',
        description: 'User is now logged in',
        type: 'end',
        swimlaneId: 'user',
      },
    ],
    swimlanes: [
      { id: 'user', label: 'User' },
      { id: 'app', label: 'Application' },
      { id: 'oauth', label: 'OAuth Provider' },
    ],
  },
  config: {
    name: 'OAuth 2.0 Authentication',
    showSwimlanes: true,
    animate: false,
  },
};

/**
 * Example 3: Simple Event Sequence (no swimlanes)
 */
export const buildPipelineExample: WidgetExample<TimelineInput, TimelineConfig> = {
  name: 'CI/CD Build Pipeline',
  description: 'Build and deployment pipeline events',
  input: {
    events: [
      {
        id: 'commit-pushed',
        timestamp: Date.now() - 300000,
        title: 'Commit Pushed',
        description: 'Developer pushes code to main branch',
        type: 'start',
      },
      {
        id: 'pipeline-triggered',
        timestamp: Date.now() - 295000,
        title: 'Pipeline Triggered',
        description: 'CI/CD pipeline starts automatically',
        type: 'event',
      },
      {
        id: 'checkout-code',
        timestamp: Date.now() - 290000,
        title: 'Checkout Code',
        description: 'Pipeline checks out repository',
        type: 'event',
      },
      {
        id: 'install-deps',
        timestamp: Date.now() - 280000,
        title: 'Install Dependencies',
        description: 'npm install completes',
        type: 'event',
      },
      {
        id: 'run-tests',
        timestamp: Date.now() - 250000,
        title: 'Run Tests',
        description: 'Unit and integration tests running',
        type: 'event',
      },
      {
        id: 'test-failure',
        timestamp: Date.now() - 240000,
        title: 'Test Failed',
        description: 'One test failed - authentication.test.ts',
        type: 'error',
      },
      {
        id: 'fix-committed',
        timestamp: Date.now() - 200000,
        title: 'Fix Committed',
        description: 'Developer fixes the failing test',
        type: 'event',
      },
      {
        id: 'tests-pass',
        timestamp: Date.now() - 180000,
        title: 'All Tests Pass',
        description: 'Test suite passes successfully',
        type: 'event',
      },
      {
        id: 'build-app',
        timestamp: Date.now() - 150000,
        title: 'Build Application',
        description: 'Production build in progress',
        type: 'event',
      },
      {
        id: 'deploy-staging',
        timestamp: Date.now() - 100000,
        title: 'Deploy to Staging',
        description: 'Application deployed to staging environment',
        type: 'event',
      },
      {
        id: 'smoke-tests',
        timestamp: Date.now() - 80000,
        title: 'Smoke Tests',
        description: 'Running smoke tests on staging',
        type: 'event',
      },
      {
        id: 'manual-approval',
        timestamp: Date.now() - 60000,
        title: 'Manual Approval',
        description: 'Waiting for manual approval to deploy to production',
        type: 'decision',
      },
      {
        id: 'deploy-prod',
        timestamp: Date.now() - 30000,
        title: 'Deploy to Production',
        description: 'Deploying to production',
        type: 'event',
      },
      {
        id: 'deployment-complete',
        timestamp: Date.now(),
        title: 'Deployment Complete',
        description: 'Successfully deployed to production',
        type: 'end',
      },
    ],
  },
  config: {
    name: 'CI/CD Pipeline',
    showSwimlanes: false,
    animate: false,
  },
};

export const timelineExamples = [
  httpRequestExample,
  authFlowExample,
  buildPipelineExample,
];
