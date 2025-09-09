// frontend/src/hooks/useAuth.js
import { useAuth0 } from "@auth0/auth0-react";

export function useAuth() {
  const { getAccessTokenSilently } = useAuth0();

  const getToken = async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE, 
          scope: "openid profile email",
        },
      });
      return token;
    } catch (err) {
      console.error("Impossible de récupérer le token", err);
      throw err;
    }
  };

  return { getToken };
}
