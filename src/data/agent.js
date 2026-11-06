/**
 * sessionStorage key for a question typed into the Contact section's
 * "Send a signal" prompt. Contact writes it before switching to the Ask Hetav
 * page; RealTimeDemo reads, clears and sends it on mount.
 */
export const PENDING_QUESTION_KEY = 'hetav_agent_pending_question';
