import reportsService from '../services/reports.service';
import catchAsync from '../utils/catchAsync';

const getTableReportData = catchAsync(async (req, res) => {
    const { parametrs, indicators, additionalParametrs } = req.body;
    const result = await reportsService.getTableReportData(parametrs, indicators, additionalParametrs);
    return res.json(result);
});

export default {
    getTableReportData,
};
