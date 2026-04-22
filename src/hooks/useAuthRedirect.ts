import { useNavigate, useLocation } from "react-router-dom";
import { useCallback } from "react";

/**
 * Hook for consistent auth redirection behavior across the platform.
 * Captures current URL and passes it as returnTo parameter.
 */
export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navigate to auth page with current location preserved for post-auth redirect
   */
  const redirectToAuth = useCallback((customReturnTo?: string) => {
    const returnTo = customReturnTo || `${location.pathname}${location.search}`;
    navigate("/auth", { 
      state: { returnTo },
      replace: false 
    });
  }, [navigate, location]);

  /**
   * Get auth link props for use with Link components
   */
  const getAuthLinkProps = useCallback((customReturnTo?: string) => {
    const returnTo = customReturnTo || `${location.pathname}${location.search}`;
    return {
      to: "/auth",
      state: { returnTo }
    };
  }, [location]);

  /**
   * Build auth URL with returnTo as query parameter (for external links)
   */
  const getAuthUrl = useCallback((customReturnTo?: string) => {
    const returnTo = customReturnTo || `${location.pathname}${location.search}`;
    return `/auth?returnTo=${encodeURIComponent(returnTo)}`;
  }, [location]);

  return {
    redirectToAuth,
    getAuthLinkProps,
    getAuthUrl,
  };
};
