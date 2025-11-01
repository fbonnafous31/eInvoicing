import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";
import { getEnv } from "@/utils/getEnv";

export function useAuth() {
  const { getAccessTokenSilently } = useAuth0();

  const getToken = useCallback(async () => {
    try {
      const env = getEnv(); // récupération centralisée
      const audience = env.VITE_AUTH0_AUDIENCE;

      const token = await getAccessTokenSilently({
        authorizationParams: { audience },
      });

      // Vérification du format du token
      const parts = token.split(".");
      if (parts.length === 5) {
        console.warn("[Auth] Format JWE (token chiffré) ⚠️");
      } else if (parts.length !== 3) {
        console.warn("[Auth] Format token inattendu ⚠️");
      }

      return token;
    } catch (err) {
      console.error("Impossible de récupérer le token", err);
      throw err;
    }
  }, [getAccessTokenSilently]);

  return { getToken };
}
