import mongoose from 'mongoose';
import httpStatus from 'http-status';
import QRCode from 'qrcode';
// @ts-ignore
import { ZipArchive } from 'archiver';
import PDFDocument from 'pdfkit';
import { QrSeries, QrInventory } from '../../models/index.ts';
import { QrSeriesStatus, PrinterStatus } from '../../models/qrSeries.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import qrSeriesRepository from './qrSeries.repository.ts';
import type { CreateSeriesPayload, PrinterOrderPayload, ReceiptPayload, QrSeriesListFilters, QrInventoryFilters } from './qrSeries.types.ts';

const QR_SERIES_MESSAGES = {
  CREATE_SUCCESS: 'QR code series created successfully',
  LIST_SUCCESS: 'QR code series retrieved successfully',
  GET_SUCCESS: 'QR code series details retrieved successfully',
  NOT_FOUND: 'QR code series not found',
  OVERLAP_ERROR: 'The requested range overlaps with an existing series',
  CANCEL_SUCCESS: 'QR code series cancelled successfully',
  ORDER_UPDATE_SUCCESS: 'Printer order tracking updated successfully',
  RECEIPT_REGISTER_SUCCESS: 'Receipt of printed stickers registered successfully',
  ACTIVATE_SUCCESS: 'QR code series activated successfully',
  INVALID_LIFECYCLE: 'Invalid action for current series status lifecycle',
} as const;

class QrSeriesService {
  formatCode(num: number): string {
    return `QR-01-${String(num).padStart(6, '0')}`;
  }

  async createSeries(userId: string | mongoose.Types.ObjectId, payload: CreateSeriesPayload) {
    if (payload.startNumber > payload.endNumber) {
      return ServiceResponse.failure('Start number cannot be greater than end number', null, httpStatus.BAD_REQUEST);
    }

    const overlap = await qrSeriesRepository.findOne({
      startNumber: { $lte: payload.endNumber },
      endNumber: { $gte: payload.startNumber },
      status: { $ne: QrSeriesStatus.CANCELLED },
    });

    if (overlap) {
      const maxSeries = await qrSeriesRepository.findOneSort(
        { status: { $ne: QrSeriesStatus.CANCELLED } },
        { endNumber: -1 }
      );
      const nextStart = maxSeries ? maxSeries.endNumber + 1 : payload.endNumber + 1;
      return ServiceResponse.failure(
        `The qr series ${overlap.startNumber}-${overlap.endNumber} already exists, start with ${nextStart}`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const totalQRs = payload.endNumber - payload.startNumber + 1;
    const pad = (num: number) => String(num).padStart(6, '0');
    const initialCode = `QR-01-${pad(payload.startNumber)}`;
    const finalCode = `QR-01-${pad(payload.endNumber)}`;

    const series = (await qrSeriesRepository.create({
      ...payload,
      totalQRs,
      initialCode,
      finalCode,
      generatingUser: new mongoose.Types.ObjectId(String(userId)),
      status: QrSeriesStatus.DRAFT,
      printerOrder: {
        expectedStickerCount: totalQRs * 2,
      },
    })) as any;

    series.status = QrSeriesStatus.GENERATED;
    await series.save();

    const inventoryDocs = [];
    for (let num = payload.startNumber; num <= payload.endNumber; num++) {
      inventoryDocs.push({
        qrCode: this.formatCode(num),
        qrNumber: num,
        series: series._id,
        status: QrInventoryStatus.GENERATED,
        history: [
          {
            status: QrInventoryStatus.GENERATED,
            date: new Date(),
            updatedBy: new mongoose.Types.ObjectId(String(userId)),
          },
        ],
      });
    }
    await QrInventory.insertMany(inventoryDocs);

    dashboardEventPublisher.publishCreated(DashboardEntity.QR_SERIES, String(series._id));
    dashboardEventPublisher.publishCreated(DashboardEntity.QR_INVENTORY, String(series._id));

    return ServiceResponse.success(QR_SERIES_MESSAGES.CREATE_SUCCESS, series, httpStatus.CREATED);
  }

  async updateSeries(
    seriesId: string,
    payload: { seriesName?: string; comments?: string; printerName?: string }
  ) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.seriesName && payload.seriesName !== series.seriesName) {
      const escapedName = payload.seriesName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const nameExists = await qrSeriesRepository.findOne({
        seriesName: { $regex: new RegExp(`^${escapedName}$`, 'i') },
        _id: { $ne: seriesId },
      });
      if (nameExists) {
        return ServiceResponse.failure('Series name must be unique', null, httpStatus.BAD_REQUEST);
      }
      series.seriesName = payload.seriesName;
    }

    if (payload.comments !== undefined) {
      series.comments = payload.comments;
    }

    if (payload.printerName !== undefined) {
      if (!series.printerOrder) {
        series.printerOrder = {
          expectedStickerCount: series.totalQRs * 2,
        };
      }
      series.printerOrder.printerName = payload.printerName;
    }

    await series.save();
    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_SERIES, String(series._id));
    return ServiceResponse.success('QR code series updated successfully', series, httpStatus.OK);
  }

  async listSeries(filters: QrSeriesListFilters) {
    const query: any = {};
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.search) {
      query.$or = [
        { seriesName: { $regex: filters.search, $options: 'i' } },
        { initialCode: { $regex: filters.search, $options: 'i' } },
        { finalCode: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [series, total] = await Promise.all([
      qrSeriesRepository.findWithPagination(query, skip, limit),
      qrSeriesRepository.count(query),
    ]);

    const result = {
      series,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success(QR_SERIES_MESSAGES.LIST_SUCCESS, result, httpStatus.OK);
  }

  async getSeriesById(seriesId: string) {
    const series = await qrSeriesRepository.findByIdWithUser(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }
    return ServiceResponse.success(QR_SERIES_MESSAGES.GET_SUCCESS, series, httpStatus.OK);
  }

  async updatePrinterOrder(
    seriesId: string,
    userId: string | mongoose.Types.ObjectId,
    payload: PrinterOrderPayload
  ) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (series.status !== QrSeriesStatus.GENERATED && series.status !== QrSeriesStatus.SENT_TO_PRINTER) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.INVALID_LIFECYCLE, null, httpStatus.BAD_REQUEST);
    }

    series.status = QrSeriesStatus.SENT_TO_PRINTER;
    series.printerOrder = {
      ...series.printerOrder,
      sentToPrinterDate: payload.sentToPrinterDate ? new Date(payload.sentToPrinterDate) : new Date(),
      printerName: payload.printerName || '',
      fileReference: payload.fileReference || '',
      printerStatus: payload.printerStatus || PrinterStatus.SENT,
      expectedStickerCount: series.totalQRs * 2,
    };

    await series.save();
    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_SERIES, String(series._id));
    return ServiceResponse.success(QR_SERIES_MESSAGES.ORDER_UPDATE_SUCCESS, series, httpStatus.OK);
  }

  async registerReceipt(seriesId: string, userId: string | mongoose.Types.ObjectId, payload: ReceiptPayload) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (series.status !== QrSeriesStatus.SENT_TO_PRINTER && series.status !== QrSeriesStatus.RECEIVED) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.INVALID_LIFECYCLE, null, httpStatus.BAD_REQUEST);
    }

    series.status = QrSeriesStatus.RECEIVED;
    series.receipt = {
      dateReceived: payload.dateReceived ? new Date(payload.dateReceived) : new Date(),
      quantityReceived: payload.quantityReceived || 0,
      responsiblePerson: payload.responsiblePerson || '',
      printingIssues: payload.printingIssues || '',
      qualityCheckResult: payload.qualityCheckResult || '',
    };

    if (series.printerOrder) {
      series.printerOrder.printerStatus = PrinterStatus.RECEIVED;
    }

    await series.save();
    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_SERIES, String(series._id));
    return ServiceResponse.success(QR_SERIES_MESSAGES.RECEIPT_REGISTER_SUCCESS, series, httpStatus.OK);
  }

  async activateSeries(seriesId: string, userId: string | mongoose.Types.ObjectId) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (series.status !== QrSeriesStatus.RECEIVED && series.status !== QrSeriesStatus.ACTIVE) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.INVALID_LIFECYCLE, null, httpStatus.BAD_REQUEST);
    }

    series.status = QrSeriesStatus.ACTIVE;
    await series.save();

    const qrs = await QrInventory.find({ series: series._id, status: QrInventoryStatus.GENERATED });
    for (const qr of qrs) {
      qr.status = QrInventoryStatus.AVAILABLE;
      qr.history.push({
        status: QrInventoryStatus.AVAILABLE,
        date: new Date(),
        updatedBy: new mongoose.Types.ObjectId(String(userId)),
      });
      await qr.save();
    }

    dashboardEventPublisher.publishUpdated(DashboardEntity.QR_SERIES, String(series._id));
    if (qrs.length > 0) {
      dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(series._id));
    }

    return ServiceResponse.success(QR_SERIES_MESSAGES.ACTIVATE_SUCCESS, series, httpStatus.OK);
  }

  async cancelSeries(seriesId: string, userId: string | mongoose.Types.ObjectId) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (series.status === QrSeriesStatus.CANCELLED) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.INVALID_LIFECYCLE, null, httpStatus.BAD_REQUEST);
    }

    series.seriesName = `${series.seriesName}_CANCELLED_${series._id}`;
    series.status = QrSeriesStatus.CANCELLED;
    await series.save();

    const unassignableStatuses = [
      QrInventoryStatus.GENERATED,
      QrInventoryStatus.AVAILABLE,
      QrInventoryStatus.ASSIGNED,
    ];

    const qrsToCancel = await QrInventory.find({
      series: series._id,
      status: { $in: unassignableStatuses },
    });

    for (const qr of qrsToCancel) {
      qr.status = QrInventoryStatus.CANCELLED;
      qr.history.push({
        status: QrInventoryStatus.CANCELLED,
        date: new Date(),
        updatedBy: new mongoose.Types.ObjectId(String(userId)),
      });
      await qr.save();
    }

    dashboardEventPublisher.publishCancelled(DashboardEntity.QR_SERIES, String(series._id));
    if (qrsToCancel.length > 0) {
      dashboardEventPublisher.publishUpdated(DashboardEntity.QR_INVENTORY, String(series._id));
    }

    return ServiceResponse.success(QR_SERIES_MESSAGES.CANCEL_SUCCESS, series, httpStatus.OK);
  }

  async exportCsv(seriesId: string) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      throw new Error(QR_SERIES_MESSAGES.NOT_FOUND);
    }

    let csvContent = 'QR Code,QR Number,Series Name,Status\n';
    for (let num = series.startNumber; num <= series.endNumber; num++) {
      const code = this.formatCode(num);
      csvContent += `${code},${num},"${series.seriesName}",${series.status}\n`;
    }

    return csvContent;
  }

  async exportZip(seriesId: string): Promise<any> {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      throw new Error(QR_SERIES_MESSAGES.NOT_FOUND);
    }

    const archive = new ZipArchive({ zlib: { level: 9 } });

    const generateQRsInZip = async () => {
      try {
        for (let num = series.startNumber; num <= series.endNumber; num++) {
          const code = this.formatCode(num);
          const qrBuffer = await QRCode.toBuffer(code, { type: 'png', margin: 1, width: 250 });
          archive.append(qrBuffer, { name: `${code}.png` });
        }
        await archive.finalize();
      } catch (err) {
        archive.emit('error', err);
      }
    };

    void generateQRsInZip();

    return archive;
  }

  async exportPdf(seriesId: string): Promise<PDFKit.PDFDocument> {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      throw new Error(QR_SERIES_MESSAGES.NOT_FOUND);
    }

    const doc = new PDFDocument({ size: 'A4', margin: 30 });

    // Multiple distinct soft pastel background themes per QR code number
    const cardThemes = [
      {
        bg: '#EBF8FF',        // 1. Soft Sky Blue
        border: '#BEE3F8',
        headerText: '#1A365D',
        badgeBg: '#CBD5E0',
        codeColor: '#2B6CB0',
      },
      {
        bg: '#F0FFF4',        // 2. Soft Mint Green
        border: '#C6F6D5',
        headerText: '#1C4532',
        badgeBg: '#9AE6B4',
        codeColor: '#276749',
      },
      {
        bg: '#FAF5FF',        // 3. Soft Lavender Purple
        border: '#E9D8FD',
        headerText: '#44337A',
        badgeBg: '#D6BCFA',
        codeColor: '#6B46C1',
      },
      {
        bg: '#FEFCBF',        // 4. Soft Warm Gold/Amber
        border: '#F6E05E',
        headerText: '#744210',
        badgeBg: '#ECC94B',
        codeColor: '#B7791F',
      },
      {
        bg: '#FFF5F5',        // 5. Soft Rose Coral
        border: '#FEB2B2',
        headerText: '#742A2A',
        badgeBg: '#FC8181',
        codeColor: '#C53030',
      },
    ];

    const generatePdfLabels = async () => {
      try {
        const stickersPerRow = 2;
        const rowsPerPage = 4;
        const labelWidth = 240;
        const labelHeight = 160;
        const gapX = 30;
        const gapY = 20;
        const startX = 40;
        const startY = 40;

        let rowCount = 0;

        for (let num = series.startNumber; num <= series.endNumber; num++) {
          const code = this.formatCode(num);
          const qrBuffer = await QRCode.toBuffer(code, { type: 'png', margin: 1, width: 100 });

          if (rowCount >= rowsPerPage) {
            doc.addPage();
            rowCount = 0;
          }

          const y = startY + rowCount * (labelHeight + gapY);

          // Select alternating background theme based on QR code index
          const themeIndex = (num - series.startNumber) % cardThemes.length;
          const theme = cardThemes[themeIndex];

          for (let col = 0; col < stickersPerRow; col++) {
            const x = startX + col * (labelWidth + gapX);

            // Draw Card Background Fill & Border
            doc
              .roundedRect(x, y, labelWidth, labelHeight, 6)
              .lineWidth(1.5)
              .fillAndStroke(theme.bg, theme.border);

            // Draw QR Code Image
            doc.image(qrBuffer, x + 12, y + 30, { width: 100, height: 100 });

            // Text section
            const textX = x + 120;

            // Header badge background
            doc
              .roundedRect(textX - 4, y + 18, 115, 20, 4)
              .fill(theme.badgeBg);

            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor(theme.headerText)
              .text('HCTS PALLET BIN', textX, y + 24);

            doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#4A5568')
              .text('Series Name:', textX, y + 50);

            doc
              .fontSize(9)
              .font('Helvetica-Bold')
              .fillColor('#2D3748')
              .text(series.seriesName, textX, y + 60, { width: 110, ellipsis: true });

            doc
              .fontSize(8)
              .font('Helvetica')
              .fillColor('#4A5568')
              .text('Pallet Bin QR:', textX, y + 85);

            doc
              .fontSize(11)
              .font('Helvetica-Bold')
              .fillColor(theme.codeColor)
              .text(code, textX, y + 95);

            // Copy indicator (Tag 1 vs Tag 2)
            const tagLabel = col === 0 ? 'TAG 1 (PRIMARY)' : 'TAG 2 (DUPLICATE)';
            doc
              .fontSize(7)
              .font('Helvetica-Bold')
              .fillColor('#718096')
              .text(tagLabel, textX, y + 125);
          }

          rowCount++;
        }

        doc.end();
      } catch (err) {
        doc.emit('error', err);
      }
    };

    void generatePdfLabels();

    return doc;
  }

  async getInventory(filters: QrInventoryFilters) {
    const query: any = {};

    if (filters.seriesId) {
      query.series = filters.seriesId;
    }
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.harvestAssignmentId) {
      query.harvestAssignmentId = { $regex: filters.harvestAssignmentId, $options: 'i' };
    }
    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    const page = Math.max(1, Number(filters.page) || 1);
    const limit = Math.max(1, Number(filters.limit) || 10);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      QrInventory.find(query).sort({ qrNumber: 1 }).skip(skip).limit(limit).populate('series', 'seriesName').exec(),
      QrInventory.countDocuments(query),
    ]);

    const result = {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };

    return ServiceResponse.success('Inventory fetched successfully', result, httpStatus.OK);
  }

  async getSeriesSummary(seriesId: string) {
    const series = await qrSeriesRepository.findById(seriesId);
    if (!series) {
      return ServiceResponse.failure(QR_SERIES_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const counts = await QrInventory.aggregate([
      { $match: { series: series._id } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const summary: Record<string, number> = {
      available: 0,
      assigned: 0,
      used: 0,
      returned: 0,
      damaged: 0,
      lost: 0,
      cancelled: 0,
    };

    counts.forEach((item) => {
      const statusKey = String(item._id).toLowerCase();
      if (statusKey === 'available') summary.available = item.count;
      else if (statusKey === 'assigned') summary.assigned = item.count;
      else if (statusKey === 'used') summary.used = item.count;
      else if (statusKey === 'returned') summary.returned = item.count;
      else if (statusKey === 'damaged') summary.damaged = item.count;
      else if (statusKey === 'lost') summary.lost = item.count;
      else if (statusKey === 'cancelled') summary.cancelled = item.count;
    });

    const result = {
      seriesId: series._id,
      seriesName: series.seriesName,
      status: series.status,
      totalQRs: series.totalQRs,
      summary,
    };

    return ServiceResponse.success('Series summary retrieved successfully', result, httpStatus.OK);
  }

  async isQrCodeActive(qrCode: string): Promise<boolean> {
    const qr = await QrInventory.findOne({
      qrCode: qrCode.trim(),
      status: { $ne: QrInventoryStatus.CANCELLED },
    });
    if (!qr) return false;
    return qr.status === QrInventoryStatus.AVAILABLE;
  }
}

export default new QrSeriesService();
export { QR_SERIES_MESSAGES };
