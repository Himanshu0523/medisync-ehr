import { catchAsync } from "../../utils/catchAsync.js";
import { sendResponse } from "../../utils/apiResponse.js";
import * as visitService from "./visit.service.js";

export const create = catchAsync(async (req, res) => {
    const visit = await visitService.createVisit(req.body, req.user, req.tenant);
    sendResponse(res, 201, visit, 'Visit created');
});

export const getAll = catchAsync(async (req, res) => {
    const result = await visitService.getVisits(req.user, req.query, req.tenant);
    sendResponse(res, 200, result);
});

export const getOne = catchAsync(async (req, res) => {
    const visit = await visitService.getVisitById(req.params.id, req.user, req.tenant);
    sendResponse(res, 200, visit);
});