// frontend/src/hooks/useAuth.js
import { useAuth0 } from "@auth0/auth0-react";
import { useCallback } from "react";

export function useAuth() {
  const { getAccessTokenSilently } = useAuth0();

  const getToken = useCallback(async () => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        },
      });

      // 🔹 Ajout log debug
      console.log("[Auth] Audience demandée:", import.meta.env.VITE_AUTH0_AUDIENCE);
      console.log("[Auth] Token reçu:", token);

      // Pour voir si c’est un JWT (3 parties) ou un JWE (5 parties)
      const parts = token.split(".");
      console.log("[Auth] Token parts:", parts.length);

      if (parts.length === 3) {
        console.log("[Auth] Format JWT RS256 clair ✅");
      } else if (parts.length === 5) {
        console.warn("[Auth] Format JWE (token chiffré) ⚠️");
      } else {
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
