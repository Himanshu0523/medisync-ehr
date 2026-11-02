export const sendResponse = (res, statusCode, data, message = 'Success', meta = null) => {
    res.status(statusCode).json({
        success: true,
        message,
        data,
        ...(meta && { meta }),
    });
};