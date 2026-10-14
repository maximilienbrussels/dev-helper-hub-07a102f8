import type { ReactElement } from "react";
import {
  GoogleIcon,
  GitHubIcon,
  GitLabIcon,
  MastodonIcon,
  BlueskyIcon,
  KeycloakIcon,
  RoutIcon,
} from "@/components/auth/ProviderIcons";

export type OAuthProvider =
  | "google"
  | "github"
  | "gitlab"
  | "mastodon"
  | "bluesky"
  | "keycloak"
  | "rout";

export const OAUTH_PROVIDERS: {
  id: OAuthProvider;
  label: string;
  Icon: (p: { className?: string }) => ReactElement;
}[] = [
  { id: "google", label: "Google", Icon: GoogleIcon },
  { id: "github", label: "GitHub", Icon: GitHubIcon },
  { id: "gitlab", label: "GitLab", Icon: GitLabIcon },
  { id: "mastodon", label: "Mastodon", Icon: MastodonIcon },
  { id: "bluesky", label: "Bluesky", Icon: BlueskyIcon },
  { id: "keycloak", label: "Keycloak", Icon: KeycloakIcon },
  { id: "rout", label: "ROUT", Icon: RoutIcon },
];
