import { Amplify } from 'aws-amplify';

export const configureAmplify = () => {
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID as string;
  const userPoolClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID as string;

  if (!userPoolId || !userPoolClientId) {
    console.warn(
      '[Amplify] VITE_COGNITO_USER_POOL_ID or VITE_COGNITO_USER_POOL_CLIENT_ID is not set. ' +
      'Authentication will not work until these are configured in your .env file.'
    );
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: userPoolId || '',
        userPoolClientId: userPoolClientId || '',
      },
    },
  });
};
