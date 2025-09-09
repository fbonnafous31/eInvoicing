import { useAuth0 } from "@auth0/auth0-react";

export function useAuthToken() {
  const { getAccessTokenSilently } = useAuth0();

  const getToken = async () => {
    try {
      const token = await getAccessTokenSilently();
      console.log("Token Auth0 :", token); // ← log pour debug
      return token;
    } catch (err) {
      console.error("Erreur récupération token :", err);
      return null;
    }
  };

  return getToken;
}
