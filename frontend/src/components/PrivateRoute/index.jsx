import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { FullScreenLoader } from "../Preloader";
import validateSessionTokenForUser from "@/utils/session";
import paths from "@/utils/paths";
import { AUTH_TIMESTAMP, AUTH_TOKEN, AUTH_USER } from "@/utils/constants";
import { userFromStorage } from "@/utils/request";
import System from "@/models/system";
import UserMenu from "../UserMenu";
import { KeyboardShortcutWrapper } from "@/utils/keyboardShortcuts";
// AI Beleegyezés modul – elkülönített import
import AiConsentModal from "@/components/AiConsentModal";
import AiConsent from "@/models/aiConsent";

// Used only for Multi-user mode only as we permission specific pages based on auth role.
// When in single user mode we just bypass any authchecks.
function useIsAuthenticated() {
  const [isAuthd, setIsAuthed] = useState(null);
  const [shouldRedirectToOnboarding, setShouldRedirectToOnboarding] =
    useState(false);
  const [multiUserMode, setMultiUserMode] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      const onboardingComplete = await System.isOnboardingComplete();
      const { MultiUserMode, RequiresAuth } = await System.keys();
      setMultiUserMode(MultiUserMode);

      // Check for the onboarding redirect condition
      if (onboardingComplete === false) {
        setShouldRedirectToOnboarding(true);
        setIsAuthed(true);
        return;
      }

      // Single User mode without password - no auth required
      if (!MultiUserMode && !RequiresAuth) {
        setIsAuthed(true);
        return;
      }

      // Single User password mode check
      if (!MultiUserMode && RequiresAuth) {
        const localAuthToken = localStorage.getItem(AUTH_TOKEN);
        if (!localAuthToken) {
          setIsAuthed(false);
          return;
        }

        const isValid = await validateSessionTokenForUser();
        setIsAuthed(isValid);
        return;
      }

      // Multi-user mode checks
      const localUser = localStorage.getItem(AUTH_USER);
      const localAuthToken = localStorage.getItem(AUTH_TOKEN);
      if (!localUser || !localAuthToken) {
        setIsAuthed(false);
        return;
      }

      const isValid = await validateSessionTokenForUser();
      if (!isValid) {
        localStorage.removeItem(AUTH_USER);
        localStorage.removeItem(AUTH_TOKEN);
        localStorage.removeItem(AUTH_TIMESTAMP);
        setIsAuthed(false);
        return;
      }

      setIsAuthed(true);
    };
    validateSession();
  }, []);

  return { isAuthd, shouldRedirectToOnboarding, multiUserMode };
}

/**
 * AI Beleegyezés hook – csak multi-user módban ellenőrzi az elfogadást.
 * Egyszemélyes módban mindig elfogadottnak tekinti (nincs mentendő userId).
 */
function useAiConsentCheck(isAuthd, multiUserMode) {
  const [consentAccepted, setConsentAccepted] = useState(null);

  useEffect(() => {
    if (isAuthd === null) return; // még töltünk

    if (!isAuthd || !multiUserMode) {
      // Nem hitelesített, vagy egyszemélyes mód – nem kell ellenőrizni
      setConsentAccepted(true);
      return;
    }

    AiConsent.checkStatus().then(({ accepted }) => {
      setConsentAccepted(accepted);
    });
  }, [isAuthd, multiUserMode]);

  return { consentAccepted, setConsentAccepted };
}

// Allows only admin to access the route and if in single user mode,
// allows all users to access the route
export function AdminRoute({ Component, hideUserMenu = false }) {
  const { isAuthd, shouldRedirectToOnboarding, multiUserMode } =
    useIsAuthenticated();
  const { consentAccepted, setConsentAccepted } = useAiConsentCheck(
    isAuthd,
    multiUserMode
  );

  if (isAuthd === null || consentAccepted === null) return <FullScreenLoader />;

  if (shouldRedirectToOnboarding) {
    return <Navigate to={paths.onboarding.home()} />;
  }

  if (isAuthd && consentAccepted === false) {
    return <AiConsentModal onAccepted={() => setConsentAccepted(true)} />;
  }

  const user = userFromStorage();
  return isAuthd && (user?.role === "admin" || !multiUserMode) ? (
    hideUserMenu ? (
      <KeyboardShortcutWrapper>
        <Component />
      </KeyboardShortcutWrapper>
    ) : (
      <KeyboardShortcutWrapper>
        <UserMenu>
          <Component />
        </UserMenu>
      </KeyboardShortcutWrapper>
    )
  ) : (
    <Navigate to={paths.home()} />
  );
}

// Allows manager and admin to access the route and if in single user mode,
// allows all users to access the route
export function ManagerRoute({ Component }) {
  const { isAuthd, shouldRedirectToOnboarding, multiUserMode } =
    useIsAuthenticated();
  const { consentAccepted, setConsentAccepted } = useAiConsentCheck(
    isAuthd,
    multiUserMode
  );

  if (isAuthd === null || consentAccepted === null) return <FullScreenLoader />;

  if (shouldRedirectToOnboarding) {
    return <Navigate to={paths.onboarding.home()} />;
  }

  if (isAuthd && consentAccepted === false) {
    return <AiConsentModal onAccepted={() => setConsentAccepted(true)} />;
  }

  const user = userFromStorage();
  const hasManagerAccess =
    user?.role === "admin" || user?.role === "manager";
  return isAuthd && (hasManagerAccess || !multiUserMode) ? (
    <KeyboardShortcutWrapper>
      <UserMenu>
        <Component />
      </UserMenu>
    </KeyboardShortcutWrapper>
  ) : (
    <Navigate to={paths.home()} />
  );
}

export default function PrivateRoute({ Component }) {
  const { isAuthd, shouldRedirectToOnboarding, multiUserMode } =
    useIsAuthenticated();
  const { consentAccepted, setConsentAccepted } = useAiConsentCheck(
    isAuthd,
    multiUserMode
  );

  if (isAuthd === null || consentAccepted === null) return <FullScreenLoader />;

  if (shouldRedirectToOnboarding) {
    return <Navigate to="/onboarding" />;
  }

  if (!isAuthd) return <Navigate to={paths.login(true)} />;

  if (consentAccepted === false) {
    return <AiConsentModal onAccepted={() => setConsentAccepted(true)} />;
  }

  return (
    <KeyboardShortcutWrapper>
      <UserMenu>
        <Component />
      </UserMenu>
    </KeyboardShortcutWrapper>
  );
}
