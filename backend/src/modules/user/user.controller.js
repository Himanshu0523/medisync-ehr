import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as userService from './user.service.js';

export const getMe = catchAsync(async (req, res) => {
    sendResponse(res, 200, req.user);
});

export const getUsers = catchAsync(async (req, res) => {
    const result = await userService.getAllUsers(req.query);
    sendResponse(res, 200, result);
});

export const getUser = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    sendResponse(res, 200, user);
});

export const updateUser = catchAsync(async (req, res) => {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    sendResponse(res, 200, user, 'User updated');
});

export const deleteUser = catchAsync(async (req, res) => {
    await userService.deleteUser(req.params.id);
    sendResponse(res, 200, null, 'User deleted');
});