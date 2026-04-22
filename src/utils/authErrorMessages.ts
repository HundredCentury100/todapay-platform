// Maps Supabase auth error codes/messages to user-friendly messages
export const getFriendlyAuthError = (error: any): string => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorCode = error?.code || '';

  // Common error patterns
  if (errorMessage.includes('invalid login credentials') || errorCode === 'invalid_credentials') {
    return "That email and password combination didn't work. Please check your details and try again.";
  }
  
  if (errorMessage.includes('user already registered') || errorCode === 'user_already_exists') {
    return "This email is already registered. Please sign in instead, or use a different email.";
  }
  
  if (errorMessage.includes('email not confirmed') || errorCode === 'email_not_confirmed') {
    return "Please check your email to confirm your account before signing in.";
  }
  
  if (errorMessage.includes('invalid email') || errorCode === 'invalid_email') {
    return "Please enter a valid email address.";
  }
  
  if (errorMessage.includes('password') && errorMessage.includes('weak')) {
    return "Please choose a stronger password with at least 8 characters.";
  }
  
  if (errorMessage.includes('rate limit') || errorCode === 'too_many_requests' || errorMessage.includes('too many requests')) {
    return "Too many attempts. Please wait a moment before trying again.";
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
    return "Connection issue. Please check your internet and try again.";
  }
  
  if (errorMessage.includes('email rate limit')) {
    return "Too many sign-up attempts. Please try again in a few minutes.";
  }

  if (errorMessage.includes('signup is disabled')) {
    return "Sign-ups are temporarily disabled. Please try again later.";
  }

  // Default friendly message
  return "Something went wrong. Please try again or contact support if the issue persists.";
};
