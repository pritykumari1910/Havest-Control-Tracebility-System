import type { Response } from 'express';
import httpStatus from 'http-status';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import reportsRepository from './reports.repository.ts';
import type {
  HarvestProgressFilters,
  ForecastVsActualFilters,
  HarvestReceiptScanReportFilters,
  TransferOrderReportFilters,
  DispatchNoteReportFilters,
} from './reports.types.ts';

class ReportsService {
  async getHarvestProgress(filters: HarvestProgressFilters) {
    const reportData = await reportsRepository.getHarvestProgressData(filters);
    return ServiceResponse.success(
      'Harvest progress report retrieved successfully',
      reportData,
      httpStatus.OK
    );
  }

  async getForecastVsActual(filters: ForecastVsActualFilters) {
    const comparisonData = await reportsRepository.getForecastVsActualData(filters);
    return ServiceResponse.success(
      'Forecast vs Actual comparison retrieved successfully',
      comparisonData,
      httpStatus.OK
    );
  }

  async getHarvestReceiptScans(filters: HarvestReceiptScanReportFilters) {
    const reportData = await reportsRepository.getHarvestReceiptScanReportData(filters);
    return ServiceResponse.success(
      'Harvest receipt scan report retrieved successfully',
      reportData,
      httpStatus.OK
    );
  }

  async getTransferOrders(filters: TransferOrderReportFilters) {
    const reportData = await reportsRepository.getTransferOrderReportData(filters);
    return ServiceResponse.success(
      'Transfer order report retrieved successfully',
      reportData,
      httpStatus.OK
    );
  }

  async exportHarvestProgress(filters: HarvestProgressFilters, res: Response): Promise<void> {
    const reportData = await reportsRepository.getHarvestProgressData({ ...filters, page: 1, limit: 10000 });
    const format = filters.format || 'excel';

    if (format === 'csv') {
      const csvData = reportData.items.map((item) => ({
        Group: item.groupName,
        Code: item.groupCode || '',
        Campaign: item.campaignName || '',
        Farm: item.farmName || '',
        Plot: item.plotName || '',
        Variety: item.varietyName || '',
        Crew: item.crewName || '',
        'Total Bins': item.totalBinsScanned,
        'Std Weight (kg)': item.standardBinWeightKg,
        'Total Harvested (kg)': item.totalHarvestedKg,
        'Contribution (%)': item.percentageOfTotal,
      }));

      const worksheet = XLSX.utils.json_to_sheet(csvData);
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=harvest_progress_report_${Date.now()}.csv`);
      res.status(httpStatus.OK).send(csvOutput);
      return;
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 30, size: 'A4' });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=harvest_progress_report_${Date.now()}.pdf`);

      doc.pipe(res);

      doc.fontSize(18).font('Helvetica-Bold').text('HCTS Harvest Progress Report', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#666666').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(12).fillColor('#000000').font('Helvetica-Bold').text('Summary Totals:');
      doc.fontSize(10).font('Helvetica').text(`Total Bins Scanned: ${reportData.summary.totalBinsScanned}`);
      doc.text(`Standard Bin Weight: ${reportData.summary.standardBinWeightKg} kg`);
      doc.text(`Total Harvested: ${reportData.summary.totalHarvestedKg.toLocaleString()} kg (${reportData.summary.totalHarvestedTonnes} Tonnes)`);
      doc.moveDown(1.5);

      doc.fontSize(12).font('Helvetica-Bold').text('Detailed Harvest Breakdown:');
      doc.moveDown(0.5);

      const tableTop = doc.y;
      doc.fontSize(9).font('Helvetica-Bold');
      doc.text('Name / Group', 30, tableTop, { width: 140 });
      doc.text('Farm', 170, tableTop, { width: 90 });
      doc.text('Variety', 260, tableTop, { width: 80 });
      doc.text('Bins', 340, tableTop, { width: 50, align: 'right' });
      doc.text('Harvested (kg)', 400, tableTop, { width: 90, align: 'right' });
      doc.text('Share (%)', 500, tableTop, { width: 60, align: 'right' });

      doc.moveTo(30, tableTop + 15).lineTo(560, tableTop + 15).stroke('#cccccc');

      let yPos = tableTop + 25;
      doc.font('Helvetica').fontSize(8);

      for (const item of reportData.items.slice(0, 100)) {
        if (yPos > 750) {
          doc.addPage();
          yPos = 40;
        }

        doc.text(item.groupName, 30, yPos, { width: 140 });
        doc.text(item.farmName || '-', 170, yPos, { width: 90 });
        doc.text(item.varietyName || '-', 260, yPos, { width: 80 });
        doc.text(String(item.totalBinsScanned), 340, yPos, { width: 50, align: 'right' });
        doc.text(item.totalHarvestedKg.toLocaleString(), 400, yPos, { width: 90, align: 'right' });
        doc.text(`${item.percentageOfTotal}%`, 500, yPos, { width: 60, align: 'right' });

        yPos += 18;
      }

      doc.end();
      return;
    }

    // Default: Excel (.xlsx)
    const excelRows = reportData.items.map((item) => ({
      'Group / Name': item.groupName,
      Code: item.groupCode || '',
      Campaign: item.campaignName || '',
      Farm: item.farmName || '',
      Plot: item.plotName || '',
      Variety: item.varietyName || '',
      Crew: item.crewName || '',
      'Total Bins Scanned': item.totalBinsScanned,
      'Standard Weight (kg)': item.standardBinWeightKg,
      'Total Harvested Weight (kg)': item.totalHarvestedKg,
      'Contribution Share (%)': item.percentageOfTotal,
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelRows);

    const summaryRows = [
      {},
      { 'Group / Name': 'SUMMARY TOTALS' },
      { 'Group / Name': 'Total Bins Scanned', 'Total Bins Scanned': reportData.summary.totalBinsScanned },
      { 'Group / Name': 'Standard Bin Weight (kg)', 'Total Bins Scanned': reportData.summary.standardBinWeightKg },
      { 'Group / Name': 'Total Harvested Weight (kg)', 'Total Bins Scanned': reportData.summary.totalHarvestedKg },
      { 'Group / Name': 'Total Harvested (Tonnes)', 'Total Bins Scanned': reportData.summary.totalHarvestedTonnes },
    ];

    XLSX.utils.sheet_add_json(worksheet, summaryRows, { skipHeader: true, origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Harvest Progress');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=harvest_progress_report_${Date.now()}.xlsx`);
    res.status(httpStatus.OK).send(buffer);
  }

  async getDispatchNotes(filters: DispatchNoteReportFilters) {
    const reportData = await reportsRepository.getDispatchNoteReportData(filters);
    return ServiceResponse.success(
      'Dispatch note report retrieved successfully',
      reportData,
      httpStatus.OK
    );
  }

  async exportDispatchNotes(filters: DispatchNoteReportFilters, res: Response): Promise<void> {
    const reportData = await reportsRepository.getDispatchNoteReportData({ ...filters, page: 1, limit: 10000 });
    const format = filters.format || 'excel';

    const rows = reportData.items.map((item) => ({
      'Dispatch Note No': item.noteNumber,
      Date: new Date(item.noteDate).toLocaleDateString(),
      Status: item.status.toUpperCase(),
      Buyer: item.buyerName,
      'Buyer Code': item.buyerCode,
      Destination: item.destinationName,
      'Transport Provider': item.transportProviderName || 'N/A',
      Campaign: item.campaignName,
      'Pallet Bins Count': item.binsCount,
      'Est Total Weight (kg)': item.estimatedTotalWeightKg,
      'Edited After Closure': item.isEditedAfterClosure ? 'YES' : 'NO',
      'Assigned To Buyer Delivery Note': item.isAssociatedWithBuyerDeliveryNote ? 'YES' : 'NO',
    }));

    if (format === 'csv') {
      const csvHeaders = Object.keys(rows[0] || {}).join(',');
      const csvRows = rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(','));
      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=dispatch_notes_report_${Date.now()}.csv`);
      res.status(httpStatus.OK).send(csvContent);
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const summaryRows = [
      {},
      { 'Dispatch Note No': 'SUMMARY KPI TOTALS' },
      { 'Dispatch Note No': 'Total Dispatch Notes', Date: reportData.kpis.totalDispatchNotes },
      { 'Dispatch Note No': 'Total Pallet Bins', Date: reportData.kpis.totalPalletBins },
      { 'Dispatch Note No': 'Total Est Weight (kg)', Date: reportData.kpis.totalEstimatedWeightKg },
    ];
    XLSX.utils.sheet_add_json(worksheet, summaryRows, { skipHeader: true, origin: -1 });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dispatch Notes');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=dispatch_notes_report_${Date.now()}.xlsx`);
    res.status(httpStatus.OK).send(buffer);
  }
}

export default new ReportsService();
