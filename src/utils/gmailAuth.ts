import {
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { auth } from './firebaseClient';

export const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

function buildGoogleProvider(forceConsent: boolean = false, includeGmailScope: boolean = true): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  if (includeGmailScope) {
    GMAIL_SCOPES.forEach((scope) => provider.addScope(scope));
  }
  provider.setCustomParameters({
    prompt: forceConsent ? 'consent select_account' : 'select_account',
  });
  return provider;
}

let isSigningIn = false;
// In-memory cache only (never persisted to localStorage / sessionStorage)
let cachedAccessToken: string | null = null;

export interface GmailAccountInfo {
  email: string;
  displayName: string;
  photoURL?: string;
}

export function initGmailAuth(
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: (user: User | null) => void
) {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthFailure?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthFailure?.(null);
    }
  });
}

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code || '';
  const rawMessage = err instanceof Error ? err.message : '';

  if (code === 'auth/popup-blocked') {
    return 'Trình duyệt đang chặn cửa sổ đăng nhập Google (Popup). Hãy bấm cho phép Popup trên thanh địa chỉ hoặc mở ứng dụng ở tab mới rồi thử lại.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Bạn đã đóng cửa sổ đăng nhập Google trước khi hoàn tất cấp quyền.';
  }
  if (code === 'auth/cancelled-popup-request') {
    return 'Yêu cầu đăng nhập bị hủy do bấm nhiều lần. Vui lòng bấm lại một lần nữa.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Tên miền hiện tại chưa được cấp quyền đăng nhập Google trong cấu hình Firebase (Authorized domains).';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'Đăng nhập Google chưa được kích hoạt trên dự án Firebase.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Lỗi kết nối mạng khi đăng nhập Google. Vui lòng kiểm tra kết nối Internet.';
  }
  return rawMessage || 'Không thể kết nối tài khoản Google.';
}

export async function signInWithGoogleAccount(): Promise<{ user: User }> {
  try {
    isSigningIn = true;
    const provider = buildGoogleProvider(false, false);
    const result = await signInWithPopup(auth, provider);
    return { user: result.user };
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err));
  } finally {
    isSigningIn = false;
  }
}

export async function signInWithGmail(forceConsent: boolean = false): Promise<{
  user: User;
  accessToken: string;
}> {
  try {
    isSigningIn = true;
    const provider = buildGoogleProvider(forceConsent, true);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Không lấy được mã quyền gửi Gmail từ Google. Vui lòng đăng nhập lại và tích chọn cấp quyền gửi email.'
      );
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (err) {
    throw new Error(mapFirebaseAuthError(err));
  } finally {
    isSigningIn = false;
  }
}

export function getGmailAccessToken(): string | null {
  return cachedAccessToken;
}

export function clearGmailAccessToken(): void {
  cachedAccessToken = null;
}

export async function signOutGmail(): Promise<void> {
  cachedAccessToken = null;
  await auth.signOut();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function utf8ToBase64(str: string): string {
  return bytesToBase64(new TextEncoder().encode(str));
}

function utf8ToBase64Url(str: string): string {
  return utf8ToBase64(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function chunkString(str: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < str.length; i += size) {
    chunks.push(str.slice(i, i + size));
  }
  return chunks;
}

/**
 * Encodes a UTF-8 header value as RFC 2047 encoded-words (splitting safely on character boundaries)
 * so long Vietnamese subjects/display names stay well under the 75-char encoded-word limit.
 */
function encodeRfc2047Utf8(text: string): string {
  if (!text) return '';
  if (/^[\x20-\x7E]+$/.test(text) && !/[=?]/.test(text)) {
    return text;
  }
  const encoder = new TextEncoder();
  const words: string[] = [];
  let currentChunk = '';
  let currentByteLen = 0;

  for (const ch of text) {
    const chBytes = encoder.encode(ch).length;
    if (currentByteLen + chBytes > 42 && currentChunk) {
      words.push(`=?UTF-8?B?${utf8ToBase64(currentChunk)}?=`);
      currentChunk = ch;
      currentByteLen = chBytes;
    } else {
      currentChunk += ch;
      currentByteLen += chBytes;
    }
  }
  if (currentChunk) {
    words.push(`=?UTF-8?B?${utf8ToBase64(currentChunk)}?=`);
  }
  return words.join('\r\n ');
}

export async function sendViaGmailApi(params: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
  html?: string;
  senderName?: string;
  fromEmail?: string;
}): Promise<{ id: string }> {
  const token = cachedAccessToken;
  if (!token) {
    throw new Error('__GMAIL_NOT_AUTHENTICATED__');
  }

  const encodedSubject = encodeRfc2047Utf8(params.subject);
  const encodedTextBody = chunkString(utf8ToBase64(params.body), 76).join('\r\n');

  const headers: string[] = [];
  if (params.fromEmail && params.fromEmail.trim()) {
    const cleanFrom = params.fromEmail.trim();
    const cleanSender = (params.senderName || '').trim();
    const fromHeader = cleanSender
      ? `${encodeRfc2047Utf8(cleanSender)} <${cleanFrom}>`
      : cleanFrom;
    headers.push(`From: ${fromHeader}`);
  }
  headers.push(`To: ${params.to}`);
  if (params.cc && params.cc.trim()) {
    headers.push(`Cc: ${params.cc.trim()}`);
  }
  headers.push(`Subject: ${encodedSubject}`);
  headers.push('MIME-Version: 1.0');

  let rawMime = '';
  if (params.html && params.html.trim()) {
    const boundary = `fsm_alt_${Date.now().toString(36)}`;
    const encodedHtmlBody = chunkString(utf8ToBase64(params.html), 76).join('\r\n');
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
    rawMime = [
      headers.join('\r\n'),
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      encodedTextBody,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      'Content-Transfer-Encoding: base64',
      '',
      encodedHtmlBody,
      `--${boundary}--`,
    ].join('\r\n');
  } else {
    headers.push('Content-Type: text/plain; charset="UTF-8"');
    headers.push('Content-Transfer-Encoding: base64');
    rawMime = `${headers.join('\r\n')}\r\n\r\n${encodedTextBody}`;
  }

  const raw = utf8ToBase64Url(rawMime);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('__GMAIL_TOKEN_EXPIRED__');
  }

  const data = (await res.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string; status?: string; code?: number };
  };

  if (!res.ok) {
    const errMsg = data.error?.message || `Gmail API HTTP ${res.status}`;
    if (
      res.status === 403 &&
      /insufficient|scope|PERMISSION_DENIED/i.test(`${errMsg} ${data.error?.status || ''}`)
    ) {
      if (/has not been used in project|is disabled/i.test(errMsg)) {
        throw new Error('__GMAIL_API_DISABLED__:' + errMsg);
      }
      cachedAccessToken = null;
      throw new Error('__GMAIL_INSUFFICIENT_SCOPE__');
    }
    throw new Error(errMsg);
  }

  return { id: data.id || 'gmail-ok' };
}
