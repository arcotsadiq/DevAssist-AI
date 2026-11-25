
// Demo knowledge base for DevAssist AI.
// Use verified troubleshooting guidance and avoid storing secrets.

export const knowledgeBase = [
  {
    title: 'Reset a password',
    content:
      'If a user cannot sign in because of a forgotten password, use the Forgot Password link on the sign-in page. Check the registered email inbox and spam folder for the reset message. Reset links may expire for security. Never request or store a user password.'
  },
  {
    title: 'Login and authentication troubleshooting',
    content:
      'When a user cannot log in, check whether the authentication API is responding correctly. Verify that the account exists, the authentication request succeeds, the session or token is created, and the frontend handles the response correctly. Check browser console errors and backend authentication logs. Never request passwords or expose authentication tokens.'
  },
  {
    title: 'API authentication',
    content:
      'For protected API requests, send the access token in the Authorization header using the Bearer scheme. Check token expiry, token validity, authorization permissions and environment configuration when receiving HTTP 401 or 403 errors. Never expose secret keys or access tokens in client-side code.'
  },
  {
    title: 'HTTP 500 Internal Server Error',
    content:
      'An HTTP 500 Internal Server Error indicates that the server encountered an unexpected problem while processing a request. Check backend application logs and stack traces around the request timestamp. Identify the affected endpoint, inspect recent code changes, validate request data and check dependent services such as databases. Reproduce the issue in a safe environment before applying a fix. Do not expose secrets or personal data in logs.'
  },
  {
    title: 'Backend server troubleshooting',
    content:
      'When backend requests fail, check whether the server process is running and whether the expected port is listening. Inspect application startup logs, runtime errors, environment configuration and recent deployments. Verify that required services are reachable. Restarting a service should not replace investigating the underlying error.'
  },
  {
    title: 'API endpoint troubleshooting',
    content:
      'When an API endpoint fails, record the HTTP method, endpoint path, response status code, sanitized request details and approximate timestamp. Check request validation, route handling, middleware, authentication, database operations and response generation. Compare working and failing endpoints to narrow down the problem.'
  },
  {
    title: 'Database connectivity',
    content:
      'When a database connection fails, verify the connection string configuration, credentials, network access rules and database service availability. Inspect database driver errors and connection timeouts. Check DNS resolution and network connectivity. Never paste credentials or full connection strings into tickets or logs.'
  },
  {
    title: 'Application performance',
    content:
      'For slow pages or API requests, capture the affected route, browser, approximate time and network conditions. Check server logs, database query latency, resource usage and recent deployments. Compare response times across endpoints to identify bottlenecks before proposing a fix.'
  },
  {
    title: 'Bug report checklist',
    content:
      'A useful bug report includes expected behaviour, actual behaviour, reproducible steps, affected environment, approximate timestamp and sanitized error messages. Include the affected endpoint for API issues. Do not include passwords, personal data, authentication tokens or API secrets.'
  }
];
