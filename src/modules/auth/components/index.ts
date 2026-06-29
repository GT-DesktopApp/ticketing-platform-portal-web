/**
 * Public surface of the auth feature's login UI.
 *
 * Components are intentionally small and single-purpose (SRP) so the login page
 * is pure composition with no duplicated markup or styling.
 */
export { DefaultFooterMessage, FooterMessage } from "./footer-message";
export { InputField } from "./input-field";
export { LoginButton } from "./login-button";
export { LoginCard } from "./login-card";
export { PasswordField } from "./password-field";
export { LOGIN_ROLES, type LoginRole, RoleTabs } from "./role-tabs";
