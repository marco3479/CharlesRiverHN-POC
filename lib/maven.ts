export const hasMavenCredentials = () => {
  return Boolean(
    process.env.MAVEN_APP_ID &&
      process.env.MAVEN_APP_SECRET &&
      process.env.MAVEN_ORG_ID &&
      process.env.MAVEN_AGENT_ID
  );
};
