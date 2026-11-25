// Small demo knowledge base. Replace or extend these notes with verified product documentation.
export const knowledgeBase = [
  {
    title: 'Reset a password',
    content: 'If a user cannot sign in, use the Forgot Password link on the sign-in page. Check the registered email inbox and spam folder for the reset message. Reset links expire for security.'
  },
  {
    title: 'API authentication',
    content: 'For API requests, send the access token in the Authorization header using the Bearer scheme. Check token expiry and environment configuration when receiving an authentication error. Never share secret keys in client-side code.'
  },
  {
    title: 'Application performance',
    content: 'For slow pages, capture the affected route, browser, approximate time and network conditions. Check server logs, database query latency and recent deployments before proposing a fix.'
  },
  {
    title: 'Database connectivity',
    content: 'When a database connection fails, verify the connection string, credentials, network access rules and whether the database service is available. Do not paste credentials into tickets or logs.'
  },
  {
    title: 'Bug report checklist',
    content: 'A useful bug report includes expected behaviour, actual behaviour, reproducible steps, environment, approximate timestamp and sanitized error messages. Do not include passwords, personal data or API secrets.'
  }
];
