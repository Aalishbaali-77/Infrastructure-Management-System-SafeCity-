import { call, put, takeLatest } from 'redux-saga/effects';
import { setCredentials, setLoginError } from '../slices/authSlice';
import { authService } from '@/services/authService';
import type { AuthUser } from '../slices/authSlice';

interface LoginPayload {
  email: string;
  password: string;
}

const LOGIN_REQUEST = 'auth/loginRequest';

export function loginRequest(payload: LoginPayload) {
  return { type: LOGIN_REQUEST, payload };
}

function* handleLogin(action: { type: string; payload: LoginPayload }) {
  try {
    const result: {
      user: AuthUser;
      accessToken: string;
      refreshToken: string;
    } = yield call(authService.login, action.payload.email, action.payload.password);

    yield put(
      setCredentials({
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      })
    );
  } catch (err) {
    yield put(setLoginError((err as Error).message || 'Login failed'));
  }
}

export default function* authSaga() {
  yield takeLatest(LOGIN_REQUEST, handleLogin);
}
