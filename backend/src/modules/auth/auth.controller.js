import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as auth from './auth.service.js';

const meta = (req) => ({ ip: req.ip, userAgent: req.headers['user-agent'] });

export const register = catchAsync(async (req, res) => {
    const data = await auth.register(req.body);
    sendResponse(res, 201, data, 'Registration successful');
});

export const verifyEmail = catchAsync(async (req, res) => {
    const data = await auth.verifyEmail(req.query.token);
    sendResponse(res, 200, data);
});

export const resendVerification = catchAsync(async (req, res) => {
    const data = await auth.resendVerification(req.body.email);
    sendResponse(res, 200, data);
});

export const login = catchAsync(async (req, res) => {
    const data = await auth.login(req.body, meta(req));
    sendResponse(res, 200, data, 'Login successful');
});

export const refresh = catchAsync(async (req, res) => {
    const data = await auth.refresh(req.body.refreshToken, meta(req));
    sendResponse(res, 200, data);
});

export const logout = catchAsync(async (req, res) => {
    const data = await auth.logout(req.body.refreshToken);
    sendResponse(res, 200, data);
});

export const logoutAll = catchAsync(async (req, res) => {
    const data = await auth.logoutAll(req.user._id);
    sendResponse(res, 200, data);
});

export const forgotPassword = catchAsync(async (req, res) => {
    const data = await auth.forgotPassword(req.body.email);
    sendResponse(res, 200, data);
});

export const resetPassword = catchAsync(async (req, res) => {
    const data = await auth.resetPassword(req.body.token, req.body.password);
    sendResponse(res, 200, data);
});

export const inviteStaff = catchAsync(async (req, res) => {
    const data = await auth.inviteStaff(req.body, req.user);
    sendResponse(res, 201, data, 'Staff invitation created successfully');
});

export const acceptInvitation = catchAsync(async (req, res) => {
    const data = await auth.acceptInvitation(req.body.token, req.body.password);
    sendResponse(res, 200, data);
});