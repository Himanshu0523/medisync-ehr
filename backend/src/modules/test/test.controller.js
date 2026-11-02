import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as testService from './test.service.js';

export const create = catchAsync(async (req, res) => {
    const test = await testService.createTest(req.body, req.user);
    sendResponse(res, 201, test, 'Test created');
});

export const getAll = catchAsync(async (req, res) => {
    const result = await testService.getTests(req.user, req.query);
    sendResponse(res, 200, result);
});