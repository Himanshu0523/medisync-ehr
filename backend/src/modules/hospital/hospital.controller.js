import * as hospitalService from './hospital.service.js';

export const createHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.createHospital(req.body);
    res.status(201).json({
      success: true,
      message: 'Hospital registered successfully',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const listHospitals = async (req, res, next) => {
  try {
    const { search, status, city, page, limit } = req.query;
    const result = await hospitalService.listHospitals({ search, status, city, page, limit, actor: req.user });
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

export const getHospitalById = async (req, res, next) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id, req.user);
    res.status(200).json({
      success: true,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const updateHospital = async (req, res, next) => {
  try {
    const hospital = await hospitalService.updateHospital(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Hospital details updated',
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleHospitalStatus = async (req, res, next) => {
  try {
    const hospital = await hospitalService.toggleHospitalStatus(req.params.id, req.body.status);
    res.status(200).json({
      success: true,
      message: `Hospital status set to ${hospital.status}`,
      data: hospital,
    });
  } catch (err) {
    next(err);
  }
};

export const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await hospitalService.getPlatformStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
};
