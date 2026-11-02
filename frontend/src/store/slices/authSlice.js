import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { api, setStoredTokens, clearStoredTokens, getStoredTokens } from '../../lib/api';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('medisync_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialTokens = getStoredTokens();
const initialUser = getInitialUser();

const initialState = {
  user: initialUser,
  accessToken: initialTokens.accessToken || null,
  refreshToken: initialTokens.refreshToken || null,
  isAuthenticated: Boolean(initialTokens.accessToken && initialUser),
  role: initialUser?.role || null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = response.data;
      setStoredTokens({ accessToken, refreshToken });
      localStorage.setItem('medisync_user', JSON.stringify(user));
      return { user, accessToken, refreshToken };
    } catch (err) {
      return rejectWithValue(err.message || 'Login failed. Please check your credentials.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async ({ name, mobile, email, password }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', { name, mobile, email, password });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.message || 'Registration failed.');
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me');
      const user = response.data;
      localStorage.setItem('medisync_user', JSON.stringify(user));
      return user;
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch user session.');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { getState }) => {
  const { auth } = getState();
  try {
    if (auth.refreshToken) {
      await api.post('/auth/logout', { refreshToken: auth.refreshToken });
    }
  } catch {
    // Ignore network failures on logout
  } finally {
    clearStoredTokens();
  }
  return null;
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch Current User
    builder
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload;
        state.role = action.payload.role;
        state.isAuthenticated = true;
      })
      .addCase(fetchCurrentUser.rejected, (state) => {
        state.user = null;
        state.role = null;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.refreshToken = null;
        clearStoredTokens();
      });

    // Logout
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.user = null;
      state.role = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    });
  },
});

export const { clearError } = authSlice.actions;

export const selectAuth = (state) => state.auth;
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectUserRole = (state) => state.auth.role;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectAuthError = (state) => state.auth.error;

export default authSlice.reducer;
