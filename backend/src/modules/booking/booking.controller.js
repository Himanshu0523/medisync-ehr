import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/apiResponse.js';
import * as bookingService from './booking.service.js';

export const create = catchAsync(async (req, res) => {
    const booking = await bookingService.createBooking(req.body, req.user, req.tenant);
    sendResponse(res, 201, booking, 'Booking created');
});

export const getAll = catchAsync(async (req, res) => {
    const result = await bookingService.getBookings(req.user, req.query, req.tenant);
    sendResponse(res, 200, result);
});

export const updateStatus = catchAsync(async (req, res) => {
    const booking = await bookingService.updateBookingStatus(
        req.params.id,
        req.body.status,
        req.user,
        req.tenant
    );
    sendResponse(res, 200, booking, 'Booking status updated');
});