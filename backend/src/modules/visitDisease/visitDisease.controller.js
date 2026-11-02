import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as vdService from './visitDisease.service.js';

export const create = catchAsync(async (req, res) => {
    const record = await vdService.createVisitDisease(req.body, req.user);
    sendResponse(res, 201, record, 'Disease record added');
});

export const getAll = catchAsync(async (req, res) => {
    const result = await vdService.getVisitDiseases(req.user, req.query);
    sendResponse(res, 200, result);
});