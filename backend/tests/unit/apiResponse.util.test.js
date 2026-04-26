'use strict';

const apiResponse = require('../../src/utils/apiResponse');

describe('apiResponse utility', () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('sends 200 with success=true by default', () => {
    apiResponse(res, 'OK', { id: 1 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'OK', data: { id: 1 } });
  });

  it('sends 201 with success=true', () => {
    apiResponse(res, 'Created', { id: 2 }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Created', data: { id: 2 } });
  });

  it('sends 400 with success=false', () => {
    apiResponse(res, 'Bad request', null, 400);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Bad request', data: null });
  });

  it('sends 404 with success=false', () => {
    apiResponse(res, 'Not found', null, 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Not found', data: null });
  });

  it('defaults data to null when not provided', () => {
    apiResponse(res, 'No data');
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'No data', data: null });
  });

  it('handles array data', () => {
    apiResponse(res, 'List', [1, 2, 3]);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: 'List', data: [1, 2, 3] });
  });

  it('handles 500 with success=false', () => {
    apiResponse(res, 'Server error', null, 500);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Server error', data: null });
  });
});
