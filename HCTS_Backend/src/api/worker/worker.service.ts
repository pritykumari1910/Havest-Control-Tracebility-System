import mongoose from 'mongoose';
import httpStatus from 'http-status';
import crypto from 'crypto';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit';
import { Worker, EmploymentCompany, Crew, SatelliteStaff } from '../../models/index.ts';
import { WorkerStatus, DocumentIdType } from '../../models/worker.model.ts';
import { EmploymentCompanyStatus } from '../../models/employmentCompany.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import workerRepository from './worker.repository.ts';
import type { CreateWorkerBody, WorkerListFilters, UpdateWorkerBody } from './worker.types.ts';

const WORKER_MESSAGES = {
  CREATE_SUCCESS: 'Worker created successfully',
  FETCH_SUCCESS: 'Workers fetched successfully',
  FETCH_ONE_SUCCESS: 'Worker fetched successfully',
  UPDATE_SUCCESS: 'Worker updated successfully',
  NOT_FOUND: 'Worker not found',
  COMPANY_NOT_FOUND: 'Employment company not found or inactive',
  DUPLICATE_DOCUMENT: 'Identity document (DNI/NIE) number already registered',
  QR_REGENERATE_SUCCESS: 'Worker QR code regenerated successfully',
} as const;

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

class WorkerService {
  async createWorker(payload: CreateWorkerBody) {
    const { firstName, lastName, documentIdType, documentIdNumber, employmentCompany, phoneNumber = '', email = '', status = WorkerStatus.ACTIVE } = payload;

    const docExists = await workerRepository.findByDocumentId(documentIdNumber);
    if (docExists) {
      return ServiceResponse.failure(WORKER_MESSAGES.DUPLICATE_DOCUMENT, null, httpStatus.BAD_REQUEST);
    }

    if (!mongoose.Types.ObjectId.isValid(employmentCompany)) {
      return ServiceResponse.failure(WORKER_MESSAGES.COMPANY_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const company = await EmploymentCompany.findOne({
      _id: new mongoose.Types.ObjectId(employmentCompany),
      status: EmploymentCompanyStatus.ACTIVE,
    });
    if (!company) {
      return ServiceResponse.failure(WORKER_MESSAGES.COMPANY_NOT_FOUND, null, httpStatus.BAD_REQUEST);
    }

    const worker = await workerRepository.create({
      firstName,
      lastName,
      documentIdType,
      documentIdNumber: documentIdNumber.toUpperCase().trim(),
      employmentCompany: company._id,
      phoneNumber,
      email,
      status,
      qrCode: `WQR-${crypto.randomUUID()}`,
    });

    dashboardEventPublisher.publishCreated(DashboardEntity.WORKER, String(worker._id));

    return ServiceResponse.success(WORKER_MESSAGES.CREATE_SUCCESS, worker, httpStatus.CREATED);
  }

  async getWorkers(filters: WorkerListFilters) {
    const query: any = {};

    if (filters.employmentCompany && mongoose.Types.ObjectId.isValid(filters.employmentCompany)) {
      query.employmentCompany = new mongoose.Types.ObjectId(filters.employmentCompany);
    }

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.documentIdType) {
      query.documentIdType = filters.documentIdType;
    }

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search), 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { documentIdNumber: searchRegex },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [workers, total] = await Promise.all([
      workerRepository.findWithPagination(query, skip, limit),
      workerRepository.count(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return ServiceResponse.success(
      WORKER_MESSAGES.FETCH_SUCCESS,
      {
        workers,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      httpStatus.OK
    );
  }

  async getWorkerById(workerId: string) {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const worker = await workerRepository.findByIdWithCompany(workerId);
    if (!worker) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success(WORKER_MESSAGES.FETCH_ONE_SUCCESS, worker, httpStatus.OK);
  }

  async updateWorker(workerId: string, payload: UpdateWorkerBody) {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const worker = await workerRepository.findById(workerId);
    if (!worker) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (payload.documentIdNumber && payload.documentIdNumber.toLowerCase() !== worker.documentIdNumber.toLowerCase()) {
      const docExists = await workerRepository.findByDocumentId(payload.documentIdNumber);
      if (docExists) {
        return ServiceResponse.failure(WORKER_MESSAGES.DUPLICATE_DOCUMENT, null, httpStatus.BAD_REQUEST);
      }
      worker.documentIdNumber = payload.documentIdNumber.toUpperCase().trim();
    }

    if (payload.employmentCompany && payload.employmentCompany !== worker.employmentCompany.toString()) {
      if (!mongoose.Types.ObjectId.isValid(payload.employmentCompany)) {
        return ServiceResponse.failure(WORKER_MESSAGES.COMPANY_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      const company = await EmploymentCompany.findOne({
        _id: new mongoose.Types.ObjectId(payload.employmentCompany),
        status: EmploymentCompanyStatus.ACTIVE,
      });
      if (!company) {
        return ServiceResponse.failure(WORKER_MESSAGES.COMPANY_NOT_FOUND, null, httpStatus.BAD_REQUEST);
      }
      worker.employmentCompany = company._id;
    }

    if (payload.firstName !== undefined) worker.firstName = payload.firstName;
    if (payload.lastName !== undefined) worker.lastName = payload.lastName;
    if (payload.documentIdType !== undefined) worker.documentIdType = payload.documentIdType;
    if (payload.phoneNumber !== undefined) worker.phoneNumber = payload.phoneNumber;
    if (payload.email !== undefined) worker.email = payload.email;
    if (payload.status !== undefined) worker.status = payload.status;

    await worker.save();

    dashboardEventPublisher.publishUpdated(DashboardEntity.WORKER, String(worker._id));

    return ServiceResponse.success(WORKER_MESSAGES.UPDATE_SUCCESS, worker, httpStatus.OK);
  }

  private generatePdfBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));
      doc.end();
    });
  }

  async getWorkerQrCard(workerId: string) {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const worker = await workerRepository.findByIdWithCompany(workerId);
    if (!worker) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (!worker.qrCode) {
      worker.qrCode = `WQR-${crypto.randomUUID()}`;
      await worker.save();
    }

    const company = worker.employmentCompany as any;
    const companyName = company?.companyName || 'Other / Independent';
    const qrDataUri = await QRCode.toDataURL(worker.qrCode);

    return ServiceResponse.success(WORKER_MESSAGES.FETCH_ONE_SUCCESS, {
      worker: {
        _id: worker._id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        documentIdType: worker.documentIdType,
        documentIdNumber: worker.documentIdNumber,
        employmentCompany: companyName,
        qrCode: worker.qrCode,
        qrDataUri,
      }
    }, httpStatus.OK);
  }

  async downloadWorkerQrCardPdf(workerId: string) {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const worker = await workerRepository.findByIdWithCompany(workerId);
    if (!worker) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    if (!worker.qrCode) {
      worker.qrCode = `WQR-${crypto.randomUUID()}`;
      await worker.save();
    }

    const company = worker.employmentCompany as any;
    const companyName = company?.companyName || 'Other / Independent';

    const doc = new PDFDocument({
      size: 'A6',
      margins: { top: 20, bottom: 20, left: 20, right: 20 },
    });

    doc.roundedRect(15, 15, 268, 390, 10).lineWidth(2).stroke('#666666');
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#444444').text('WORKER IDENTIFICATION CARD', 20, 35, { align: 'center', width: 258 });
    doc.moveTo(25, 55).lineTo(273, 55).lineWidth(1).stroke('#CCCCCC');
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000000').text(`${worker.lastName}, ${worker.firstName}`, 20, 75, { align: 'center', width: 258 });

    const qrBuffer = (await QRCode.toBuffer(worker.qrCode!, { margin: 1, width: 180 })) as Buffer;
    doc.image(qrBuffer, 59, 115, { width: 180, height: 180 });

    doc.font('Helvetica').fontSize(12).fillColor('#333333').text(companyName, 20, 320, { align: 'center', width: 258, ellipsis: true });
    doc.font('Helvetica-Oblique').fontSize(10).fillColor('#777777').text(`${worker.documentIdType}: ${worker.documentIdNumber}`, 20, 345, { align: 'center', width: 258 });

    const buffer = await this.generatePdfBuffer(doc);
    const filename = `worker_qr_${worker.lastName.replace(/\s+/g, '_')}_${worker.firstName.replace(/\s+/g, '_')}.pdf`;

    return ServiceResponse.success('PDF generated successfully', { buffer, filename }, httpStatus.OK);
  }

  async downloadWorkerQrBooklet() {
    const activeWorkers = await Worker.find({ status: WorkerStatus.ACTIVE })
      .populate('employmentCompany')
      .lean();

    if (activeWorkers.length === 0) {
      return ServiceResponse.failure('No active workers found to generate booklet', null, httpStatus.NOT_FOUND);
    }

    for (const w of activeWorkers) {
      if (!w.qrCode) {
        w.qrCode = `WQR-${crypto.randomUUID()}`;
        await Worker.updateOne({ _id: w._id }, { qrCode: w.qrCode });
      }
    }

    const grouped = new Map<string, typeof activeWorkers>();
    for (const w of activeWorkers) {
      const company = w.employmentCompany as any;
      const companyName = company?.companyName || 'Other / Independent';
      if (!grouped.has(companyName)) {
        grouped.set(companyName, []);
      }
      grouped.get(companyName)!.push(w);
    }

    const sortedCompanyNames = Array.from(grouped.keys()).sort();

    for (const companyName of sortedCompanyNames) {
      grouped.get(companyName)!.sort((a, b) => {
        const lastA = (a.lastName || '').toLowerCase();
        const lastB = (b.lastName || '').toLowerCase();
        if (lastA !== lastB) {
          return lastA.localeCompare(lastB);
        }
        const firstA = (a.firstName || '').toLowerCase();
        const firstB = (b.firstName || '').toLowerCase();
        return firstA.localeCompare(firstB);
      });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 40,
    });

    let isFirstCompany = true;
    for (const companyName of sortedCompanyNames) {
      if (!isFirstCompany) {
        doc.addPage();
      }
      isFirstCompany = false;

      doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text(`Employment Company: ${companyName}`, 40, 30);
      doc.moveTo(40, 50).lineTo(555, 50).lineWidth(1).stroke('#DDDDDD');

      const workers = grouped.get(companyName)!;
      let cardCount = 0;

      for (const w of workers) {
        if (cardCount > 0 && cardCount % 8 === 0) {
          doc.addPage();
          doc.font('Helvetica-Bold').fontSize(16).fillColor('#111111').text(`Employment Company: ${companyName}`, 40, 30);
          doc.moveTo(40, 50).lineTo(555, 50).lineWidth(1).stroke('#DDDDDD');
        }

        const indexOnPage = cardCount % 8;
        const col = indexOnPage % 2;
        const row = Math.floor(indexOnPage / 2);

        const x = col === 0 ? 40 : 315;
        const y = 70 + row * 180;

        doc.roundedRect(x, y, 240, 160, 8).lineWidth(1).stroke('#CCCCCC');
        doc.font('Helvetica-Bold').fontSize(8).fillColor('#666666').text('WORKER IDENTIFICATION', x, y + 12, { width: 240, align: 'center' });
        doc.font('Helvetica-Bold').fontSize(11).fillColor('#000000').text(`${w.lastName}, ${w.firstName}`, x + 10, y + 25, { width: 220, align: 'center', ellipsis: true });

        const qrBuffer = (await QRCode.toBuffer(w.qrCode!, { margin: 1, width: 80 })) as Buffer;
        doc.image(qrBuffer, x + 80, y + 42, { width: 80, height: 80 });

        doc.font('Helvetica').fontSize(9).fillColor('#333333').text(companyName, x + 10, y + 128, { width: 220, align: 'center', ellipsis: true });
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#777777').text(`${w.documentIdType}: ${w.documentIdNumber}`, x + 10, y + 142, { width: 220, align: 'center' });

        cardCount++;
      }
    }

    const buffer = await this.generatePdfBuffer(doc);
    return ServiceResponse.success('Booklet generated successfully', { buffer, filename: 'worker_qr_booklet.pdf' }, httpStatus.OK);
  }

  async regenerateWorkerQrCode(workerId: string) {
    if (!mongoose.Types.ObjectId.isValid(workerId)) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    const worker = await workerRepository.findByIdWithCompany(workerId);
    if (!worker) {
      return ServiceResponse.failure(WORKER_MESSAGES.NOT_FOUND, null, httpStatus.NOT_FOUND);
    }

    worker.qrCode = `WQR-${crypto.randomUUID()}`;
    await worker.save();

    const company = worker.employmentCompany as any;
    const companyName = company?.companyName || 'Other / Independent';
    const qrDataUri = await QRCode.toDataURL(worker.qrCode);

    return ServiceResponse.success(WORKER_MESSAGES.QR_REGENERATE_SUCCESS, {
      worker: {
        _id: worker._id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        documentIdType: worker.documentIdType,
        documentIdNumber: worker.documentIdNumber,
        employmentCompany: companyName,
        qrCode: worker.qrCode,
        qrDataUri,
      }
    }, httpStatus.OK);
  }

  async getWorkerByQrCode(qrCode: string, workDateStr?: string) {
    const worker = await Worker.findOne({ qrCode }).populate('employmentCompany');
    if (!worker) {
      return ServiceResponse.failure('Worker with this QR Code not found', null, httpStatus.NOT_FOUND);
    }

    if (worker.status !== WorkerStatus.ACTIVE) {
      return ServiceResponse.failure(
        `Worker '${worker.firstName} ${worker.lastName}' is inactive and cannot be assigned to a crew`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    const date = workDateStr ? new Date(workDateStr) : new Date();
    const startOfDay = new Date(new Date(date).setUTCHours(0, 0, 0, 0));
    const endOfDay = new Date(new Date(date).setUTCHours(23, 59, 59, 999));

    // 1. Check if worker is already assigned to a Crew today
    const conflictingCrew = await Crew.findOne({
      workDate: { $gte: startOfDay, $lte: endOfDay },
      $or: [{ assignedPickers: worker._id }, { leader: worker._id }],
    });

    if (conflictingCrew) {
      return ServiceResponse.failure(
        `Worker '${worker.firstName} ${worker.lastName}' is already assigned to Crew '${conflictingCrew.crewName}' (${conflictingCrew.crewCode}) today. A worker cannot be assigned to multiple crews on the same day.`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    // 2. Check if worker is registered as Satellite Staff today
    const conflictingStaff = await SatelliteStaff.findOne({
      workDate: { $gte: startOfDay, $lte: endOfDay },
      worker: worker._id,
    }).populate('satelliteRole', 'name roleName');

    if (conflictingStaff) {
      const roleName = (conflictingStaff.satelliteRole as any)?.roleName || (conflictingStaff.satelliteRole as any)?.name || 'support staff';
      return ServiceResponse.failure(
        `Worker '${worker.firstName} ${worker.lastName}' is already registered as Satellite Staff (role: '${roleName}') today.`,
        null,
        httpStatus.BAD_REQUEST
      );
    }

    return ServiceResponse.success(
      WORKER_MESSAGES.FETCH_ONE_SUCCESS,
      worker,
      httpStatus.OK
    );
  }
}

export default new WorkerService();
export { WORKER_MESSAGES };
