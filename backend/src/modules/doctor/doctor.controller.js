import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as doctorService from './doctor.service.js';



export const create = catchAsync(async (req, res) => {
    const doctor = await doctorService.createDoctor(req.body, req.user);
    sendResponse(res, 201, doctor, 'Doctor created');
});

export const getAll = catchAsync(async (req, res) => {
    const result = await doctorService.getAllDoctors(req.query, req.user);
    sendResponse(res, 200, result);
});

export const getOne = catchAsync(async (req, res) => {
    const doctor = await doctorService.getDoctorById(req.params.id, req.user);
    sendResponse(res, 200, doctor);
});

export const update = catchAsync(async (req, res) => {
    const doctor = await doctorService.updateDoctor(req.params.id, req.body, req.user);
    sendResponse(res, 200, doctor, 'Doctor updated');
});

export const submitCredentials = catchAsync(async (req, res) => {
    const doctor = await doctorService.submitDoctorCredentials(req.params.id, req.body, req.user);
    sendResponse(res, 200, doctor, 'Doctor credentials submitted for verification review');
});

export const remove = catchAsync(async (req, res) => {
    await doctorService.deleteDoctor(req.params.id, req.user);
    sendResponse(res, 200, null, 'Doctor deleted');
});

export const approve = catchAsync(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const doctor = await doctorService.approveDoctor(req.params.id, req.user, meta);
    sendResponse(res, 200, doctor, 'Doctor credentials verified and profile published');
});

export const reject = catchAsync(async (req, res) => {
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] };
    const doctor = await doctorService.rejectDoctor(req.params.id, req.body.reason, req.user, meta);
    sendResponse(res, 200, doctor, 'Doctor credentials rejected with reason recorded');
});