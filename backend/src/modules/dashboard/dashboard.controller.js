import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as dashboardService from './dashboard.service.js';

export const getOverview = catchAsync(async (req, res) => {
  const overview = await dashboardService.getHospitalAdminOverview(req.tenant);
  sendResponse(res, 200, overview, 'Hospital admin overview retrieved successfully');
});

export const getTodayAppointments = catchAsync(async (req, res) => {
  const { status, doctorId, date, page, limit } = req.query;
  const result = await dashboardService.getTodayAppointments({
    hospitalId: req.tenant.hospitalId,
    status,
    doctorId,
    date,
    page,
    limit,
  });
  sendResponse(res, 200, result, "Today's appointments retrieved successfully");
});

export const getPendingDoctors = catchAsync(async (req, res) => {
  const doctors = await dashboardService.getPendingDoctors(req.tenant.hospitalId);
  sendResponse(res, 200, doctors, 'Pending doctor verifications retrieved successfully');
});

export const getPatientQueue = catchAsync(async (req, res) => {
  const { doctorId } = req.query;
  const queue = await dashboardService.getPatientQueue({
    hospitalId: req.tenant.hospitalId,
    doctorId,
  });
  sendResponse(res, 200, queue, 'Patient queue retrieved successfully');
});

export const getRecentActivity = catchAsync(async (req, res) => {
  const { limit } = req.query;
  const activities = await dashboardService.getRecentHospitalActivity(req.tenant.hospitalId, limit);
  sendResponse(res, 200, activities, 'Recent hospital activity retrieved successfully');
});
