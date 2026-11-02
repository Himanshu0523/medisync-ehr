import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

const mongoSanitizer = (options = { replaceWith: '_' }) => (req, res, next) => {
    ['body', 'params', 'headers', 'query'].forEach((key) => {
        if (req[key]) {
            mongoSanitize.sanitize(req[key], options);
        }
    });
    next();
};

export const sanitize = [
    mongoSanitizer({ replaceWith: '_' }),
    hpp(),
];