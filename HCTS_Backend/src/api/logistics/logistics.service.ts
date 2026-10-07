import mongoose from 'mongoose';
import httpStatus from 'http-status';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import {
  Buyer,
  DestinationCenter,
  TransportProvider,
  DispatchNote,
  TransferOrder,
  HarvestReceiptScan,
  QrInventory,
  Campaign,
  SystemConfig,
} from '../../models/index.ts';
import { BuyerStatus } from '../../models/buyer.model.ts';
import { DestinationCenterStatus } from '../../models/destinationCenter.model.ts';
import { TransportProviderStatus } from '../../models/transportProvider.model.ts';
import { DispatchNoteStatus } from '../../models/dispatchNote.model.ts';
import { TransferOrderStatus, TransferOrderWeightStatus } from '../../models/transferOrder.model.ts';
import { QrInventoryStatus } from '../../models/qrInventory.model.ts';
import ServiceResponse from '../../utils/ServiceResponse.ts';
import dashboardEventPublisher, { DashboardEntity } from '../../events/dashboard.publisher.ts';
import type {
  CreateBuyerBody,
  UpdateBuyerBody,
  BuyerFilters,
  CreateDestinationCenterBody,
  UpdateDestinationCenterBody,
  DestinationCenterFilters,
  CreateTransportProviderBody,
  UpdateTransportProviderBody,
  TransportProviderFilters,
  CreateDispatchNoteBody,
  UpdateDispatchNoteBody,
  DispatchNoteFilters,
  AssociateBinsBody,
  RemoveBinBody,
  CreateTransferOrderBody,
} from './logistics.types.ts';

const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DEFAULT_BIN_WEIGHT_KG = 400;

class LogisticsService {
  // ==========================================
  // BUYERS
  // ==========================================

  async createBuyer(payload: CreateBuyerBody) {
    try {
      const duplicate = await Buyer.findOne({ name: payload.name });
      if (duplicate) {
        return ServiceResponse.failure('Buyer name already exists', null, httpStatus.BAD_REQUEST);
      }
      if (payload.internalCode) {
        const dupCode = await Buyer.findOne({ internalCode: payload.internalCode });
        if (dupCode) {
          return ServiceResponse.failure('Buyer internalCode already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      const buyer = await Buyer.create(payload);
      return ServiceResponse.success('Buyer registered successfully', buyer, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateBuyer(buyerId: string, payload: UpdateBuyerBody) {
    try {
      const buyer = await Buyer.findById(buyerId);
      if (!buyer) {
        return ServiceResponse.failure('Buyer not found', null, httpStatus.NOT_FOUND);
      }
      if (payload.name && payload.name !== buyer.name) {
        const duplicate = await Buyer.findOne({ name: payload.name });
        if (duplicate) {
          return ServiceResponse.failure('Buyer name already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      if (payload.internalCode && payload.internalCode !== buyer.internalCode) {
        const dupCode = await Buyer.findOne({ internalCode: payload.internalCode });
        if (dupCode) {
          return ServiceResponse.failure('Buyer internalCode already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      Object.assign(buyer, payload);
      await buyer.save();
      return ServiceResponse.success('Buyer updated successfully', buyer, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getBuyers(filters: BuyerFilters) {
    const query: any = {};
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search.trim()), 'i');
      query.$or = [
        { name: searchRegex },
        { internalCode: searchRegex },
        { 'contactDetails.email': searchRegex },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [buyers, total] = await Promise.all([
      Buyer.find(query).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      Buyer.countDocuments(query),
    ]);

    return ServiceResponse.success('Buyers retrieved successfully', {
      buyers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  // ==========================================
  // DESTINATION CENTERS
  // ==========================================

  async createDestinationCenter(payload: CreateDestinationCenterBody) {
    try {
      const duplicate = await DestinationCenter.findOne({ name: payload.name });
      if (duplicate) {
        return ServiceResponse.failure('Destination Center name already exists', null, httpStatus.BAD_REQUEST);
      }
      if (payload.internalCode) {
        const dupCode = await DestinationCenter.findOne({ internalCode: payload.internalCode });
        if (dupCode) {
          return ServiceResponse.failure('Destination Center internalCode already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      const dest = await DestinationCenter.create(payload);
      return ServiceResponse.success('Destination Center registered successfully', dest, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateDestinationCenter(destId: string, payload: UpdateDestinationCenterBody) {
    try {
      const dest = await DestinationCenter.findById(destId);
      if (!dest) {
        return ServiceResponse.failure('Destination Center not found', null, httpStatus.NOT_FOUND);
      }
      if (payload.name && payload.name !== dest.name) {
        const duplicate = await DestinationCenter.findOne({ name: payload.name });
        if (duplicate) {
          return ServiceResponse.failure('Destination Center name already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      if (payload.internalCode && payload.internalCode !== dest.internalCode) {
        const dupCode = await DestinationCenter.findOne({ internalCode: payload.internalCode });
        if (dupCode) {
          return ServiceResponse.failure('Destination Center internalCode already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      Object.assign(dest, payload);
      await dest.save();
      return ServiceResponse.success('Destination Center updated successfully', dest, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getDestinationCenters(filters: DestinationCenterFilters) {
    const query: any = {};
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search.trim()), 'i');
      query.$or = [
        { name: searchRegex },
        { internalCode: searchRegex },
        { 'contactDetails.email': searchRegex },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [destinations, total] = await Promise.all([
      DestinationCenter.find(query).sort({ name: 1 }).skip(skip).limit(limit).exec(),
      DestinationCenter.countDocuments(query),
    ]);

    return ServiceResponse.success('Destination Centers retrieved successfully', {
      destinations,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  // ==========================================
  // TRANSPORT PROVIDERS
  // ==========================================

  async createTransportProvider(payload: CreateTransportProviderBody) {
    try {
      const duplicate = await TransportProvider.findOne({ legalName: payload.legalName });
      if (duplicate) {
        return ServiceResponse.failure('Transport Provider name already exists', null, httpStatus.BAD_REQUEST);
      }
      const transport = await TransportProvider.create(payload);
      return ServiceResponse.success('Transport Provider registered successfully', transport, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateTransportProvider(providerId: string, payload: UpdateTransportProviderBody) {
    try {
      const transport = await TransportProvider.findById(providerId);
      if (!transport) {
        return ServiceResponse.failure('Transport Provider not found', null, httpStatus.NOT_FOUND);
      }
      if (payload.legalName && payload.legalName !== transport.legalName) {
        const duplicate = await TransportProvider.findOne({ legalName: payload.legalName });
        if (duplicate) {
          return ServiceResponse.failure('Transport Provider name already exists', null, httpStatus.BAD_REQUEST);
        }
      }
      Object.assign(transport, payload);
      await transport.save();
      return ServiceResponse.success('Transport Provider updated successfully', transport, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getTransportProviders(filters: TransportProviderFilters) {
    const query: any = {};
    if (filters.status) query.status = filters.status;

    if (filters.search) {
      const searchRegex = new RegExp(escapeRegExp(filters.search.trim()), 'i');
      query.$or = [
        { legalName: searchRegex },
        { 'contactDetails.email': searchRegex },
      ];
    }

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      TransportProvider.find(query).sort({ legalName: 1 }).skip(skip).limit(limit).exec(),
      TransportProvider.countDocuments(query),
    ]);

    return ServiceResponse.success('Transport Providers retrieved successfully', {
      providers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  // ==========================================
  // DISPATCH NOTES
  // ==========================================

  async createDispatchNote(payload: CreateDispatchNoteBody) {
    try {
      // Validate campaign
      const campaignDoc = await Campaign.findById(payload.campaign);
      if (!campaignDoc) {
        return ServiceResponse.failure('Campaign not found', null, httpStatus.BAD_REQUEST);
      }

      // Validate buyer
      const buyerDoc = await Buyer.findById(payload.buyer);
      if (!buyerDoc || buyerDoc.status !== BuyerStatus.ACTIVE) {
        return ServiceResponse.failure('Buyer not found or is inactive', null, httpStatus.BAD_REQUEST);
      }

      // Validate destination center
      const destDoc = await DestinationCenter.findById(payload.destination);
      if (!destDoc || destDoc.status !== DestinationCenterStatus.ACTIVE) {
        return ServiceResponse.failure('Destination Center not found or is inactive', null, httpStatus.BAD_REQUEST);
      }

      const note = await DispatchNote.create({
        campaign: payload.campaign,
        buyer: payload.buyer,
        destination: payload.destination,
        noteDate: payload.noteDate ? new Date(payload.noteDate) : new Date(),
        status: DispatchNoteStatus.DRAFT,
      });

      dashboardEventPublisher.publishCreated(DashboardEntity.DISPATCH_NOTE, String(note._id));
      return ServiceResponse.success('Dispatch Note created successfully', note, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async updateDispatchNote(noteId: string, payload: UpdateDispatchNoteBody) {
    try {
      if (!mongoose.Types.ObjectId.isValid(noteId)) {
        return ServiceResponse.failure('Invalid Dispatch Note ID', null, httpStatus.BAD_REQUEST);
      }

      const note = await DispatchNote.findById(noteId);
      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      if (note.isAssociatedWithBuyerDeliveryNote) {
        return ServiceResponse.failure(
          'This dispatch note is permanently locked (associated with a buyer delivery note). Modifications are not permitted.',
          null,
          httpStatus.FORBIDDEN
        );
      }

      if (
        note.status === DispatchNoteStatus.DISPATCHED ||
        note.status === DispatchNoteStatus.RECONCILED
      ) {
        return ServiceResponse.failure(
          `Cannot edit dispatch note with status '${note.status}'.`,
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const updates: any = {};

      if (payload.campaign) {
        const campaignDoc = await Campaign.findById(payload.campaign);
        if (!campaignDoc) {
          return ServiceResponse.failure('Campaign not found', null, httpStatus.BAD_REQUEST);
        }
        updates.campaign = payload.campaign;
      }

      if (payload.buyer) {
        const buyerDoc = await Buyer.findById(payload.buyer);
        if (!buyerDoc || buyerDoc.status !== BuyerStatus.ACTIVE) {
          return ServiceResponse.failure('Buyer not found or is inactive', null, httpStatus.BAD_REQUEST);
        }
        updates.buyer = payload.buyer;
      }

      if (payload.destination) {
        const destDoc = await DestinationCenter.findById(payload.destination);
        if (!destDoc || destDoc.status !== DestinationCenterStatus.ACTIVE) {
          return ServiceResponse.failure('Destination Center not found or is inactive', null, httpStatus.BAD_REQUEST);
        }
        updates.destination = payload.destination;
      }

      if (payload.noteDate) {
        updates.noteDate = new Date(payload.noteDate);
      }

      // Check TransferOrder invariant if note is part of a TransferOrder
      if (updates.buyer || updates.destination) {
        const existingTransfer = await TransferOrder.findOne({
          dispatchNotes: note._id,
          status: { $ne: TransferOrderStatus.CLOSED },
        });

        if (existingTransfer) {
          const newBuyer = updates.buyer || String(note.buyer);
          const newDest = updates.destination || String(note.destination);

          const otherNotes = await DispatchNote.find({
            _id: { $in: existingTransfer.dispatchNotes, $ne: note._id },
          });

          for (const other of otherNotes) {
            if (String(other.buyer) !== newBuyer) {
              return ServiceResponse.failure(
                `Validation blocked: Updating buyer breaks Transfer Order '${existingTransfer.transferCode}' invariant. All dispatch notes in a Transfer Order must have the same buyer.`,
                null,
                httpStatus.BAD_REQUEST
              );
            }
            if (String(other.destination) !== newDest) {
              return ServiceResponse.failure(
                `Validation blocked: Updating destination breaks Transfer Order '${existingTransfer.transferCode}' invariant. All dispatch notes in a Transfer Order must have the same destination center.`,
                null,
                httpStatus.BAD_REQUEST
              );
            }
          }

          const transferUpdates: any = {};
          if (updates.buyer) transferUpdates.buyer = updates.buyer;
          if (updates.destination) transferUpdates.destination = updates.destination;

          if (Object.keys(transferUpdates).length > 0) {
            await TransferOrder.findByIdAndUpdate(existingTransfer._id, { $set: transferUpdates }, { runValidators: false });
          }
        }
      }

      const updated = await DispatchNote.findByIdAndUpdate(noteId, { $set: updates }, { new: true })
        .populate('buyer', 'name internalCode contactDetails')
        .populate('destination', 'name internalCode contactDetails')
        .populate('campaign', 'campaignName campaignCode');

      dashboardEventPublisher.publishUpdated(DashboardEntity.DISPATCH_NOTE, String(note._id));
      return ServiceResponse.success('Dispatch Note updated successfully', updated, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getDispatchNotes(filters: DispatchNoteFilters) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.campaign) query.campaign = new mongoose.Types.ObjectId(filters.campaign);
    if (filters.buyer) query.buyer = new mongoose.Types.ObjectId(filters.buyer);

    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [notes, total] = await Promise.all([
      DispatchNote.find(query)
        .populate('buyer', 'name internalCode')
        .populate('destination', 'name internalCode')
        .populate('campaign', 'campaignName campaignCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      DispatchNote.countDocuments(query),
    ]);

    return ServiceResponse.success('Dispatch Notes retrieved successfully', {
      notes,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  async getDispatchNoteById(noteId: string) {
    try {
      const note = await DispatchNote.findById(noteId)
        .populate('buyer', 'name internalCode contactDetails')
        .populate('destination', 'name internalCode contactDetails')
        .populate('campaign', 'campaignName campaignCode')
        .populate({
          path: 'bins',
          select: 'qrCode variety crew harvestAssignment farm plot valve workDate machine operator scannedAt',
          populate: [
            { path: 'variety', select: 'varietyName varietyCode name' },
            { path: 'crew', select: 'crewCode crewName' },
            { path: 'farm', select: 'farmName internalCode name' },
            { path: 'plot', select: 'plotName plotCode name' },
            { path: 'harvestAssignment', select: 'specialZone assignedRows startQrNumber endQrNumber workDate zoneType assignmentCode' },
            { path: 'machine', select: 'machineCode name' },
            { path: 'operator', select: 'name' },
          ],
        })
        .populate('editAuditTrail.actor', 'name')
        .exec();

      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      return ServiceResponse.success('Dispatch Note retrieved successfully', note, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async associateBins(noteId: string, payload: AssociateBinsBody, actorId: string) {
    try {
      const note = await DispatchNote.findById(noteId);
      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      // Locked — no changes allowed
      if (note.isAssociatedWithBuyerDeliveryNote) {
        return ServiceResponse.failure(
          'This dispatch note is permanently locked (associated with a buyer delivery note). No modifications are permitted.',
          null,
          httpStatus.FORBIDDEN
        );
      }

      // Only draft or closed (pre-buyer) notes can receive bins
      if (note.status !== DispatchNoteStatus.DRAFT && note.status !== DispatchNoteStatus.CLOSED) {
        return ServiceResponse.failure(
          `Cannot associate bins to a dispatch note with status '${note.status}'.`,
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const binIds = payload.binIds.map((id) => new mongoose.Types.ObjectId(id));
      const existingBinIds = new Set(note.bins.map((b) => String(b)));

      const errors: string[] = [];
      const toAdd: mongoose.Types.ObjectId[] = [];
      const auditEntries: any[] = [];

      for (const binId of binIds) {
        const binIdStr = String(binId);

        // Check already in this note
        if (existingBinIds.has(binIdStr)) {
          errors.push(`Bin ${binIdStr} is already in this dispatch note.`);
          continue;
        }

        // Fetch the scan record
        const scan = await HarvestReceiptScan.findById(binId);
        if (!scan) {
          errors.push(`Bin ${binIdStr} not found.`);
          continue;
        }

        // Fetch QR inventory to validate status
        const qr = await QrInventory.findOne({ qrCode: scan.qrCode });
        if (!qr) {
          errors.push(`QR inventory for bin ${scan.qrCode} not found.`);
          continue;
        }

        if (qr.status !== QrInventoryStatus.SCANNED_AT_COLLECTION) {
          errors.push(
            `Bin '${scan.qrCode}' cannot be added — current status is '${qr.status}'. Only bins with status '${QrInventoryStatus.SCANNED_AT_COLLECTION}' can be associated.`
          );
          continue;
        }

        // Check duplicate association in any dispatch note (this note or any other note)
        const alreadyAssociated = await DispatchNote.findOne({ bins: binId });
        if (alreadyAssociated) {
          errors.push(
            `Bin '${scan.qrCode}' is already associated with dispatch note '${alreadyAssociated.internalNoteNumber || alreadyAssociated.dispatchCode || alreadyAssociated._id}'.`
          );
          continue;
        }

        // Validate QR inventory status (allows SCANNED_AT_COLLECTION, and handles self-healing unlinked ASSIGNED_TO_DISPATCH)
        if (
          qr.status !== QrInventoryStatus.SCANNED_AT_COLLECTION &&
          qr.status !== QrInventoryStatus.ASSIGNED_TO_DISPATCH
        ) {
          errors.push(
            `Bin '${scan.qrCode}' cannot be added — current status is '${qr.status}'. Only bins received at collection point can be associated.`
          );
          continue;
        }

        toAdd.push(binId);
        auditEntries.push({
          actor: new mongoose.Types.ObjectId(actorId),
          action: 'bin_added',
          binId,
          qrCode: scan.qrCode,
          at: new Date(),
          reason: 'Associated to dispatch note',
        });
      }

      if (errors.length > 0 && toAdd.length === 0) {
        return ServiceResponse.failure(errors.join(' | '), null, httpStatus.BAD_REQUEST);
      }

      // 1. Update DispatchNote FIRST (using findByIdAndUpdate to skip full doc validation for legacy notes)
      const updatePayload: any = {
        $push: { bins: { $each: toAdd } },
      };

      if (note.status === DispatchNoteStatus.CLOSED && auditEntries.length > 0) {
        updatePayload.$push.editAuditTrail = { $each: auditEntries };
      }

      await DispatchNote.findByIdAndUpdate(noteId, updatePayload, { runValidators: false });

      // 2. Update QR inventory statuses after DispatchNote update succeeds
      await Promise.all(
        toAdd.map(async (binId) => {
          const scan = await HarvestReceiptScan.findById(binId);
          if (scan) {
            await QrInventory.findOneAndUpdate(
              { qrCode: scan.qrCode },
              { $set: { status: QrInventoryStatus.ASSIGNED_TO_DISPATCH } }
            );
          }
        })
      );

      const result: any = { added: toAdd.length };
      if (errors.length > 0) result.warnings = errors;

      return ServiceResponse.success(
        `${toAdd.length} bin(s) associated to dispatch note successfully.`,
        result,
        httpStatus.OK
      );
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async removeBinFromNote(noteId: string, binId: string, payload: RemoveBinBody, actorId: string) {
    try {
      const note = await DispatchNote.findById(noteId);
      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      // Permanent lock
      if (note.isAssociatedWithBuyerDeliveryNote) {
        return ServiceResponse.failure(
          'This dispatch note is permanently locked. No modifications are permitted.',
          null,
          httpStatus.FORBIDDEN
        );
      }

      // Only draft and closed (pre-buyer) notes are editable
      if (note.status !== DispatchNoteStatus.DRAFT && note.status !== DispatchNoteStatus.CLOSED) {
        return ServiceResponse.failure(
          `Cannot remove bins from a dispatch note with status '${note.status}'.`,
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const binObjectId = new mongoose.Types.ObjectId(binId);
      const existingIndex = note.bins.findIndex((b) => String(b) === binId);
      if (existingIndex === -1) {
        return ServiceResponse.failure('Bin not found in this dispatch note.', null, httpStatus.NOT_FOUND);
      }

      // Get scan for audit trail and QR status reversal
      const scan = await HarvestReceiptScan.findById(binObjectId);
      const qrCode = scan?.qrCode ?? binId;

      // Reverse QR status to SCANNED_AT_COLLECTION
      if (scan) {
        await QrInventory.findOneAndUpdate(
          { qrCode: scan.qrCode },
          { $set: { status: QrInventoryStatus.SCANNED_AT_COLLECTION } }
        );
      }

      // Remove bin and log audit — use findByIdAndUpdate to skip full doc validation
      await DispatchNote.findByIdAndUpdate(
        noteId,
        {
          $pull: { bins: binObjectId },
          $push: {
            editAuditTrail: {
              actor: new mongoose.Types.ObjectId(actorId),
              action: 'bin_removed',
              binId: binObjectId,
              qrCode,
              at: new Date(),
              reason: payload.reason,
            },
          },
        },
        { runValidators: false }
      );

      return ServiceResponse.success('Bin removed from dispatch note successfully.', { removed: qrCode }, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async closeDispatchNote(noteId: string) {
    try {
      const note = await DispatchNote.findById(noteId);
      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      if (note.isAssociatedWithBuyerDeliveryNote) {
        return ServiceResponse.failure('This dispatch note is permanently locked.', null, httpStatus.FORBIDDEN);
      }

      if (note.status !== DispatchNoteStatus.DRAFT) {
        return ServiceResponse.failure(
          `Dispatch note is already in '${note.status}' status. Only 'draft' notes can be closed.`,
          null,
          httpStatus.BAD_REQUEST
        );
      }

      if (note.bins.length === 0) {
        return ServiceResponse.failure(
          'Cannot close a dispatch note with no bins associated.',
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const updatedNote = await DispatchNote.findByIdAndUpdate(
        noteId,
        { $set: { status: DispatchNoteStatus.CLOSED } },
        { new: true, runValidators: false }
      )
        .populate('buyer', 'name internalCode')
        .populate('destination', 'name internalCode')
        .populate('campaign', 'campaignName campaignCode');

      return ServiceResponse.success('Dispatch Note closed successfully.', updatedNote, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async reopenDispatchNote(noteId: string) {
    try {
      const note = await DispatchNote.findById(noteId);
      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      if (note.isAssociatedWithBuyerDeliveryNote) {
        return ServiceResponse.failure(
          'This dispatch note is permanently locked (associated with a buyer delivery note). Reopening is not permitted.',
          null,
          httpStatus.FORBIDDEN
        );
      }

      if (note.status !== DispatchNoteStatus.CLOSED) {
        return ServiceResponse.failure(
          `Cannot reopen dispatch note with status '${note.status}'. Only 'closed' notes can be reopened.`,
          null,
          httpStatus.BAD_REQUEST
        );
      }

      const updatedNote = await DispatchNote.findByIdAndUpdate(
        noteId,
        { $set: { status: DispatchNoteStatus.DRAFT } },
        { new: true, runValidators: false }
      )
        .populate('buyer', 'name internalCode')
        .populate('destination', 'name internalCode')
        .populate('campaign', 'campaignName campaignCode');

      return ServiceResponse.success('Dispatch Note reopened successfully (switched back to draft).', updatedNote, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDispatchNoteSummary(noteId: string) {
    try {
      const note = await DispatchNote.findById(noteId)
        .populate('buyer', 'name internalCode')
        .populate('destination', 'name internalCode')
        .populate('campaign', 'campaignName campaignCode')
        .exec();

      if (!note) {
        return ServiceResponse.failure('Dispatch Note not found', null, httpStatus.NOT_FOUND);
      }

      // Fetch standard bin weight
      const config = await SystemConfig.findOne({ key: 'STANDARD_BIN_WEIGHT_KG' });
      const binWeightKg: number = config?.value ?? DEFAULT_BIN_WEIGHT_KG;

      // Populate all bins with full context
      const bins = await HarvestReceiptScan.find({ _id: { $in: note.bins } })
        .populate('variety', 'varietyName varietyCode name')
        .populate('crew', 'crewCode crewName')
        .populate('harvestAssignment', 'specialZone assignedRows startQrNumber endQrNumber workDate zoneType assignmentCode')
        .populate('farm', 'farmName internalCode name')
        .populate('plot', 'plotName plotCode name')
        .populate('machine', 'machineCode name')
        .populate('operator', 'name')
        .exec();

      // ── Running totals ────────────────────────────────────────
      const byVariety: Record<string, { variety: string; palletCount: number; estimatedWeightKg: number }> = {};
      const byFarmPlot: Record<string, { farm: string; plot: string; palletCount: number }> = {};
      const byCrew: Record<string, { crew: string; palletCount: number }> = {};
      const byAssignment: Record<string, { assignment: string; palletCount: number }> = {};

      const machineSet: Record<string, string> = {};
      const operatorSet: Record<string, string> = {};

      for (const bin of bins) {
        const varietyName = (bin.variety as any)?.varietyName ?? (bin.variety as any)?.name ?? 'Unknown';
        const varietyId = String((bin.variety as any)?._id || bin.variety);

        if (!byVariety[varietyId]) {
          byVariety[varietyId] = { variety: varietyName, palletCount: 0, estimatedWeightKg: 0 };
        }
        byVariety[varietyId].palletCount += 1;
        byVariety[varietyId].estimatedWeightKg += binWeightKg;

        const farmName = (bin.farm as any)?.farmName ?? (bin.farm as any)?.name ?? 'Unknown';
        const plotName = (bin.plot as any)?.plotName ?? (bin.plot as any)?.name ?? 'Unknown';
        const farmPlotKey = `${farmName}|${plotName}`;
        if (!byFarmPlot[farmPlotKey]) {
          byFarmPlot[farmPlotKey] = { farm: farmName, plot: plotName, palletCount: 0 };
        }
        byFarmPlot[farmPlotKey].palletCount += 1;

        const crewName = (bin.crew as any)?.crewName ?? (bin.crew as any)?.name ?? 'Unknown';
        const crewKey = String((bin.crew as any)?._id || bin.crew);
        if (!byCrew[crewKey]) {
          byCrew[crewKey] = { crew: crewName, palletCount: 0 };
        }
        byCrew[crewKey].palletCount += 1;

        const assignDoc = bin.harvestAssignment as any;
        const assignmentCode = assignDoc?.specialZone
          ? assignDoc.specialZone
          : assignDoc?.assignedRows
            ? `Rows ${assignDoc.assignedRows}`
            : assignDoc?.startQrNumber && assignDoc?.endQrNumber
              ? `QR ${assignDoc.startQrNumber}-${assignDoc.endQrNumber}`
              : assignDoc?.assignmentCode
                ? assignDoc.assignmentCode
                : assignDoc?._id
                  ? `ASG-${String(assignDoc._id).slice(-6).toUpperCase()}`
                  : 'Unknown';

        const assignKey = String(assignDoc?._id || bin.harvestAssignment);
        if (!byAssignment[assignKey]) {
          byAssignment[assignKey] = { assignment: assignmentCode, palletCount: 0 };
        }
        byAssignment[assignKey].palletCount += 1;

        if (bin.machine) machineSet[String((bin.machine as any)?._id || bin.machine)] = (bin.machine as any)?.machineCode ?? String(bin.machine);
        if (bin.operator) operatorSet[String((bin.operator as any)?._id || bin.operator)] = (bin.operator as any)?.name ?? String(bin.operator);
      }

      const summary = {
        dispatchNote: {
          internalNoteNumber: note.internalNoteNumber,
          status: note.status,
          noteDate: note.noteDate,
          isLocked: note.isAssociatedWithBuyerDeliveryNote,
        },
        campaign: note.campaign,
        buyer: note.buyer,
        destinationCenter: note.destination,
        palletTotalCount: bins.length,
        estimatedTotalWeightKg: bins.length * binWeightKg,
        standardBinWeightKg: binWeightKg,
        byVariety: Object.values(byVariety),
        byFarmPlot: Object.values(byFarmPlot),
        byCrew: Object.values(byCrew),
        byAssignment: Object.values(byAssignment),
        machines: Object.entries(machineSet).map(([id, code]) => ({ id, code })),
        operators: Object.entries(operatorSet).map(([id, name]) => ({ id, name })),
        editAuditTrail: note.editAuditTrail,
      };

      return ServiceResponse.success('Dispatch Note summary retrieved successfully', summary, httpStatus.OK);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async exportDispatchNoteSummary(noteId: string, format: 'pdf' | 'excel' | 'csv'): Promise<{
    buffer: Buffer;
    contentType: string;
    filename: string;
  } | null> {
    const summaryResponse = await this.getDispatchNoteSummary(noteId);
    if (!summaryResponse.success || !summaryResponse.responseObject) return null;
    const s = summaryResponse.responseObject as any;

    const noteNum = s.dispatchNote?.internalNoteNumber ?? noteId;
    const buyerName = (s.buyer as any)?.name ? `${(s.buyer as any).name}${s.buyer.internalCode ? ` (${s.buyer.internalCode})` : ''}` : 'N/A';
    const destName = (s.destinationCenter as any)?.name ? `${(s.destinationCenter as any).name}${s.destinationCenter.internalCode ? ` (${s.destinationCenter.internalCode})` : ''}` : 'N/A';
    const campaignName = (s.campaign as any)?.campaignName ?? 'N/A';
    const dateStr = s.dispatchNote?.noteDate ? new Date(s.dispatchNote.noteDate).toISOString().split('T')[0] : 'N/A';
    const statusStr = (s.dispatchNote?.status || 'draft').toUpperCase();

    // ========================================================
    // CSV EXPORT (Structured & Multi-Section Report)
    // ========================================================
    if (format === 'csv') {
      const lines: string[] = [
        '==================================================',
        'QULTIVA LOGISTICS - DISPATCH NOTE SUMMARY REPORT',
        '==================================================',
        `Internal Note #,${noteNum}`,
        `Dispatch Date,${dateStr}`,
        `Campaign,"${campaignName}"`,
        `Status,${statusStr}`,
        `Buyer Name,"${buyerName}"`,
        `Destination Center,"${destName}"`,
        `Total Pallet Bins,${s.palletTotalCount}`,
        `Estimated Total Weight (kg),${s.estimatedTotalWeightKg}`,
        '',
        '--- 1. FRUIT BREAKDOWN BY VARIETY ---',
        'Variety Name,Pallet Bins,Est. Weight (kg),% of Total',
      ];

      for (const v of s.byVariety || []) {
        const pct = s.palletTotalCount ? `${Math.round((v.palletCount / s.palletTotalCount) * 100)}%` : '0%';
        lines.push(`"${v.variety || 'Unknown'}",${v.palletCount},${v.estimatedWeightKg},${pct}`);
      }

      lines.push('');
      lines.push('--- 2. ORIGIN BREAKDOWN BY FARM & PLOT ---');
      lines.push('Farm Name,Plot Name,Pallet Bins');
      for (const fp of s.byFarmPlot || []) {
        lines.push(`"${fp.farm || 'Unknown'}","${fp.plot || 'Unknown'}",${fp.palletCount}`);
      }

      lines.push('');
      lines.push('--- 3. BREAKDOWN BY HARVESTING CREW ---');
      lines.push('Crew Name,Pallet Bins');
      for (const c of s.byCrew || []) {
        lines.push(`"${c.crew || 'Unknown'}",${c.palletCount}`);
      }

      lines.push('');
      lines.push('--- 4. BREAKDOWN BY HARVEST ASSIGNMENT / ZONE ---');
      lines.push('Assignment / Special Zone,Pallet Bins');
      for (const a of s.byAssignment || []) {
        lines.push(`"${a.assignment || 'Unknown'}",${a.palletCount}`);
      }

      const buffer = Buffer.from(lines.join('\n'), 'utf-8');
      return { buffer, contentType: 'text/csv', filename: `${noteNum}_summary.csv` };
    }

    // ========================================================
    // EXCEL (.xlsx) EXPORT (Professional Styled Workbook)
    // ========================================================
    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Qultiva HCTS Platform';
      workbook.created = new Date();

      const sheet = workbook.addWorksheet('Dispatch Summary');

      // Styles
      const navyFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A365D' } };
      const blueHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2B6CB0' } };
      const grayHeaderFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF2F7' } };
      const zebraFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7FAFC' } };
      const borderThin: Partial<ExcelJS.Borders> = {
        top: { style: 'thin', color: { argb: 'FFCBD5E0' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E0' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E0' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E0' } },
      };

      // Title Banner (Row 1)
      sheet.mergeCells('A1:D1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'QULTIVA LOGISTICS — DISPATCH NOTE SUMMARY';
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      titleCell.fill = navyFill;
      titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getRow(1).height = 35;

      sheet.addRow([]); // Row 2 space

      // Metadata Header Box (Rows 3-6)
      const metaRows = [
        ['Internal Note #:', noteNum, 'Buyer Name:', buyerName],
        ['Dispatch Date:', dateStr, 'Destination Center:', destName],
        ['Campaign:', campaignName, 'Total Bins:', s.palletTotalCount],
        ['Status:', statusStr, 'Est. Total Weight:', `${s.estimatedTotalWeightKg} kg`],
      ];

      metaRows.forEach((r) => {
        const row = sheet.addRow(r);
        row.height = 20;
        row.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1A365D' } };
        row.getCell(2).font = { name: 'Arial', size: 10, bold: true };
        row.getCell(3).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF1A365D' } };
        row.getCell(4).font = { name: 'Arial', size: 10, bold: true };

        [1, 2, 3, 4].forEach((colIdx) => {
          row.getCell(colIdx).border = borderThin;
          row.getCell(colIdx).fill = grayHeaderFill;
        });
      });

      sheet.addRow([]); // Empty spacing row

      // Helper function to add a styled section table
      const addSectionTable = (
        sectionTitle: string,
        headers: string[],
        rows: (string | number)[][]
      ) => {
        // Section Header
        const secRow = sheet.addRow([sectionTitle]);
        secRow.getCell(1).font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF1A365D' } };
        secRow.height = 24;

        // Table Header
        const headerRow = sheet.addRow(headers);
        headerRow.height = 22;
        headers.forEach((_, idx) => {
          const cell = headerRow.getCell(idx + 1);
          cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = blueHeaderFill;
          cell.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'left' : 'center' };
          cell.border = borderThin;
        });

        // Table Data Rows
        rows.forEach((rData, rIdx) => {
          const dRow = sheet.addRow(rData);
          dRow.height = 19;
          rData.forEach((_, cIdx) => {
            const cell = dRow.getCell(cIdx + 1);
            cell.font = { name: 'Arial', size: 10 };
            cell.alignment = { vertical: 'middle', horizontal: cIdx === 0 ? 'left' : 'center' };
            cell.border = borderThin;
            if (rIdx % 2 === 1) cell.fill = zebraFill;
          });
        });

        sheet.addRow([]); // spacing row
      };

      // 1. Variety Table
      const varietyData = (s.byVariety || []).map((v: any) => [
        v.variety || 'Unknown',
        v.palletCount,
        `${v.estimatedWeightKg} kg`,
        s.palletTotalCount ? `${Math.round((v.palletCount / s.palletTotalCount) * 100)}%` : '0%',
      ]);
      addSectionTable('1. Fruit Breakdown by Variety', ['Variety Name', 'Pallet Bins', 'Est. Weight (kg)', '% of Total'], varietyData);

      // 2. Farm & Plot Table
      const farmPlotData = (s.byFarmPlot || []).map((fp: any) => [
        fp.farm || 'Unknown',
        fp.plot || 'Unknown',
        fp.palletCount,
      ]);
      addSectionTable('2. Origin Breakdown by Farm & Plot', ['Farm Name', 'Plot Name', 'Pallet Bins'], farmPlotData);

      // 3. Crew Table
      const crewData = (s.byCrew || []).map((c: any) => [
        c.crew || 'Unknown',
        c.palletCount,
      ]);
      addSectionTable('3. Breakdown by Harvesting Crew', ['Crew Name', 'Pallet Bins'], crewData);

      // 4. Harvest Assignment Table
      const assignData = (s.byAssignment || []).map((a: any) => [
        a.assignment || 'Unknown',
        a.palletCount,
      ]);
      addSectionTable('4. Breakdown by Harvest Assignment / Zone', ['Assignment / Special Zone', 'Pallet Bins'], assignData);

      // Column Widths
      sheet.getColumn(1).width = 32;
      sheet.getColumn(2).width = 28;
      sheet.getColumn(3).width = 25;
      sheet.getColumn(4).width = 20;

      const buffer = Buffer.from((await workbook.xlsx.writeBuffer()) as ArrayBuffer);
      return {
        buffer,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: `${noteNum}_summary.xlsx`,
      };
    }

    // PDF
    return new Promise((resolve) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => {
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: 'application/pdf',
          filename: `${noteNum}_summary.pdf`,
        });
      });

      const primaryColor = '#1A365D';
      const lightBg = '#F7FAFC';
      const borderClr = '#CBD5E0';
      const textDark = '#2D3748';

      // --- Header Banner ---
      doc.rect(36, 36, 523, 50).fill(primaryColor);
      doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF').text('QULTIVA LOGISTICS', 50, 48);
      doc.font('Helvetica').fontSize(10).fillColor('#E2E8F0').text('Internal Dispatch Note Summary', 50, 68);

      const headerNoteNum = s.dispatchNote?.internalNoteNumber || noteNum;
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF').text(headerNoteNum, 380, 56, { width: 165, align: 'right' });

      let y = 96;

      // --- Metadata Grid Box ---
      doc.rect(36, y, 523, 85).fillAndStroke(lightBg, borderClr);

      doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
      doc.text('DISPATCH DETAILS', 48, y + 10);
      doc.text('DESTINATION & BUYER', 310, y + 10);

      doc.font('Helvetica').fontSize(9).fillColor(textDark);
      const dateStr = s.dispatchNote?.noteDate
        ? new Date(s.dispatchNote.noteDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        : 'N/A';

      doc.text(`Internal Note #:   ${headerNoteNum}`, 48, y + 26);
      doc.text(`Dispatch Date:      ${dateStr}`, 48, y + 40);
      doc.text(`Campaign:           ${(s.campaign as any)?.campaignName || 'N/A'}`, 48, y + 54);
      doc.text(`Status:                  ${(s.dispatchNote?.status || 'draft').toUpperCase()}`, 48, y + 68);

      const buyerName = (s.buyer as any)?.name || 'N/A';
      const destName = (s.destinationCenter as any)?.name || 'N/A';
      doc.text(`Buyer Name:         ${buyerName}`, 310, y + 26);
      doc.text(`Destination:         ${destName}`, 310, y + 40);
      doc.text(`Total Bins:           ${s.palletTotalCount}`, 310, y + 54);
      doc.text(`Est. Total Wt:       ${s.estimatedTotalWeightKg} kg`, 310, y + 68);

      y += 96;

      // --- KPI Summary Cards ---
      doc.rect(36, y, 250, 42).fillAndStroke('#EBF8FF', '#3182CE');
      doc.font('Helvetica').fontSize(8).fillColor('#2B6CB0').text('TOTAL PALLET BINS', 48, y + 7);
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#2B6CB0').text(`${s.palletTotalCount} Pallet(s)`, 48, y + 19);

      doc.rect(309, y, 250, 42).fillAndStroke('#F0FFF4', '#38A169');
      doc.font('Helvetica').fontSize(8).fillColor('#276749').text('ESTIMATED TOTAL WEIGHT', 321, y + 7);
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#276749').text(`${s.estimatedTotalWeightKg} kg`, 321, y + 19);

      y += 52;

      // Helper function for rendering styled tables
      const renderTable = (
        title: string,
        headers: string[],
        widths: number[],
        rows: string[][]
      ) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text(title, 36, y);
        y += 14;

        // Table Header
        doc.rect(36, y, 523, 18).fillAndStroke('#EDF2F7', borderClr);
        let x = 36;
        doc.font('Helvetica-Bold').fontSize(8).fillColor(textDark);
        headers.forEach((h, idx) => {
          doc.text(h, x + 6, y + 4, { width: widths[idx] - 12, align: idx === 0 ? 'left' : 'center' });
          x += widths[idx];
        });
        y += 18;

        // Table Rows
        if (rows.length === 0) {
          doc.rect(36, y, 523, 16).fillAndStroke('#FFFFFF', borderClr);
          doc.font('Helvetica').fontSize(8).fillColor('#718096').text('No records available', 42, y + 3);
          y += 16;
        } else {
          rows.forEach((row, rIdx) => {
            const rowBg = rIdx % 2 === 0 ? '#FFFFFF' : '#F7FAFC';
            doc.rect(36, y, 523, 16).fillAndStroke(rowBg, borderClr);
            let rx = 36;
            doc.font('Helvetica').fontSize(8).fillColor(textDark);
            row.forEach((cell, cIdx) => {
              doc.text(cell, rx + 6, y + 3, { width: widths[cIdx] - 12, align: cIdx === 0 ? 'left' : 'center' });
              rx += widths[cIdx];
            });
            y += 16;
          });
        }

        y += 12;
      };

      // --- Section 1: By Variety Table ---
      const varietyRows = (s.byVariety || []).map((v: any) => [
        v.variety || 'Unknown',
        String(v.palletCount),
        `${v.estimatedWeightKg} kg`,
        s.palletTotalCount ? `${Math.round((v.palletCount / s.palletTotalCount) * 100)}%` : '0%',
      ]);
      renderTable('1. Fruit Breakdown by Variety', ['Variety Name', 'Pallet Bins', 'Est. Weight (kg)', '% of Total'], [200, 100, 120, 103], varietyRows);

      // --- Section 2: By Farm & Plot Table ---
      const farmPlotRows = (s.byFarmPlot || []).map((fp: any) => [
        fp.farm || 'Unknown',
        fp.plot || 'Unknown',
        String(fp.palletCount),
      ]);
      renderTable('2. Origin Breakdown by Farm & Plot', ['Farm Name', 'Plot Name', 'Pallet Bins'], [230, 193, 100], farmPlotRows);

      // --- Section 3: By Crew & Assignment Tables ---
      const crewRows = (s.byCrew || []).map((c: any) => [
        c.crew || 'Unknown',
        String(c.palletCount),
      ]);
      renderTable('3. Breakdown by Harvesting Crew', ['Crew Name', 'Pallet Bins'], [370, 153], crewRows);

      const assignRows = (s.byAssignment || []).map((a: any) => [
        a.assignment || 'Unknown',
        String(a.palletCount),
      ]);
      renderTable('4. Breakdown by Harvest Assignment / Zone', ['Assignment / Special Zone', 'Pallet Bins'], [370, 153], assignRows);

      // --- Footer ---
      doc.font('Helvetica').fontSize(8).fillColor('#A0AEC0').text(
        `Generated by Qultiva HCTS Platform on ${new Date().toLocaleString()}  |  Confidential Internal Document`,
        36,
        785,
        { align: 'center', width: 523 }
      );

      doc.end();
    });
  }

  // ==========================================
  // TRANSFER ORDERS
  // ==========================================

  async validateTransferOrderDispatches(dispatchNoteIds: string[]): Promise<{ buyer: string; destination: string }> {
    const dispatchNotes = await DispatchNote.find({ _id: { $in: dispatchNoteIds } });
    if (dispatchNotes.length === 0) {
      throw new Error('No Dispatch Notes selected for transfer');
    }
    if (dispatchNotes.length !== dispatchNoteIds.length) {
      throw new Error('One or more selected Dispatch Notes do not exist');
    }

    const firstBuyer = String(dispatchNotes[0].buyer);
    const firstDest = String(dispatchNotes[0].destination);

    for (const note of dispatchNotes) {
      if (String(note.buyer) !== firstBuyer) {
        throw new Error('Validation blocked: Selected Dispatch Notes contain different Buyers. A Transfer Order must have exactly one buyer.');
      }
      if (String(note.destination) !== firstDest) {
        throw new Error('Validation blocked: Selected Dispatch Notes contain different Destination Centers. A Transfer Order must have exactly one destination.');
      }
    }

    return { buyer: firstBuyer, destination: firstDest };
  }

  async createTransferOrder(payload: CreateTransferOrderBody) {
    try {
      const provider = await TransportProvider.findById(payload.transportProvider);
      if (!provider || provider.status !== TransportProviderStatus.ACTIVE) {
        return ServiceResponse.failure('Selected Transport Provider not found or is inactive', null, httpStatus.BAD_REQUEST);
      }

      const { buyer, destination } = await this.validateTransferOrderDispatches(payload.dispatchNotes);

      let finalTransferCode = (payload.transferCode || payload.transferOrderNumber || '').trim();
      if (!finalTransferCode) {
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          const randomSuffix = Math.floor(100000 + Math.random() * 900000);
          const candidateCode = `TRF-${randomSuffix}`;
          const existing = await TransferOrder.findOne({
            $or: [{ transferCode: candidateCode }, { transferOrderNumber: candidateCode }],
          });
          if (!existing) {
            finalTransferCode = candidateCode;
            isUnique = true;
          }
          attempts++;
        }
        if (!finalTransferCode) {
          finalTransferCode = `TRF-${Date.now().toString().slice(-6)}`;
        }
      } else {
        const dupCode = await TransferOrder.findOne({
          $or: [{ transferCode: finalTransferCode }, { transferOrderNumber: finalTransferCode }],
        });
        if (dupCode) {
          return ServiceResponse.failure('Transfer Code or Order Number already exists', null, httpStatus.BAD_REQUEST);
        }
      }

      const dispatchNotes = await DispatchNote.find({ _id: { $in: payload.dispatchNotes } });
      const calculatedPallets = dispatchNotes.reduce((sum, note) => sum + (Array.isArray(note.bins) && note.bins.length > 0 ? note.bins.length : 0), 0);

      const finalTotalPallets = payload.totalPallets && payload.totalPallets > 0
        ? payload.totalPallets
        : (calculatedPallets > 0 ? calculatedPallets : Math.max(1, payload.dispatchNotes.length));

      let defaultPalletWeight = 800;
      try {
        const sysConfig = await SystemConfig.findOne({
          key: {
            $in: [
              'ESTIMATED_AVG_PALLET_WEIGHT_KG',
              'estimated_avg_pallet_weight_kg',
              'STANDARD_PALLET_WEIGHT_KG',
              'standard_pallet_weight_kg',
              'ESTIMATED_PALLET_WEIGHT',
              'STANDARD_BIN_WEIGHT_KG',
              'standard_bin_weight_kg',
            ],
          },
        });
        if (sysConfig && sysConfig.value !== undefined && Number(sysConfig.value) > 0) {
          defaultPalletWeight = Number(sysConfig.value);
        }
      } catch (e) {
        // Fallback default if SystemConfig is unreachable
      }

      const estimatedAvgWeightPerPallet = payload.estimatedAvgWeightPerPallet && payload.estimatedAvgWeightPerPallet > 0
        ? payload.estimatedAvgWeightPerPallet
        : defaultPalletWeight;

      const forecastedWeight = finalTotalPallets * estimatedAvgWeightPerPallet;

      const transfer = await TransferOrder.create({
        transferOrderNumber: finalTransferCode,
        transferCode: finalTransferCode,
        loadingDate: payload.loadingDate ? new Date(payload.loadingDate) : new Date(),
        departureDateTime: payload.departureDateTime ? new Date(payload.departureDateTime) : new Date(),
        truckLicensePlate: payload.truckLicensePlate || 'TRK-001',
        driverName: payload.driverName || null,
        originCollectionPoint: payload.originCollectionPoint || null,
        buyer,
        destination,
        transportProvider: payload.transportProvider,
        dispatchNotes: payload.dispatchNotes,
        status: TransferOrderStatus.OPEN,
        totalPallets: finalTotalPallets,
        estimatedAvgWeightPerPallet,
        forecastedWeight,
        weightStatus: TransferOrderWeightStatus.PENDING_DEFINITIVE,
      });

      return ServiceResponse.success('Transfer Order created successfully', transfer, httpStatus.CREATED);
    } catch (err: any) {
      return ServiceResponse.failure(err.message, null, httpStatus.BAD_REQUEST);
    }
  }

  async getTransferOrders(filters: { page?: number; limit?: number }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, filters.limit || 10);
    const skip = (page - 1) * limit;

    const [transfers, total] = await Promise.all([
      TransferOrder.find()
        .populate('buyer', 'name internalCode')
        .populate('destination', 'name internalCode')
        .populate('transportProvider', 'legalName')
        .populate({
          path: 'dispatchNotes',
          select: 'internalNoteNumber dispatchCode status',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      TransferOrder.countDocuments(),
    ]);

    return ServiceResponse.success('Transfer Orders retrieved successfully', {
      transfers,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }, httpStatus.OK);
  }

  async getTransferOrderById(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ServiceResponse.failure('Invalid Transfer Order ID', null, httpStatus.BAD_REQUEST);
    }

    const transfer = await TransferOrder.findById(id)
      .populate('buyer', 'name internalCode contactDetails')
      .populate('destination', 'name internalCode contactDetails')
      .populate('transportProvider', 'legalName contactDetails status')
      .populate({
        path: 'dispatchNotes',
        populate: { path: 'bins', select: 'qrCode scannedAt variety' },
      });

    if (!transfer) {
      return ServiceResponse.failure('Transfer Order not found', null, httpStatus.NOT_FOUND);
    }

    return ServiceResponse.success('Transfer Order details retrieved successfully', transfer, httpStatus.OK);
  }

  async updateTransferOrderStatus(id: string, newStatus: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ServiceResponse.failure('Invalid Transfer Order ID', null, httpStatus.BAD_REQUEST);
    }

    const validStatuses = Object.values(TransferOrderStatus);
    if (!validStatuses.includes(newStatus as any)) {
      return ServiceResponse.failure(`Invalid status: ${newStatus}`, null, httpStatus.BAD_REQUEST);
    }

    const transfer = await TransferOrder.findById(id);
    if (!transfer) {
      return ServiceResponse.failure('Transfer Order not found', null, httpStatus.NOT_FOUND);
    }

    transfer.status = newStatus as TransferOrderStatus;
    await transfer.save();

    if (newStatus === TransferOrderStatus.DISPATCHED) {
      await DispatchNote.updateMany(
        { _id: { $in: transfer.dispatchNotes } },
        { $set: { status: DispatchNoteStatus.DISPATCHED } }
      );
    } else if (newStatus === TransferOrderStatus.RECONCILED) {
      await DispatchNote.updateMany(
        { _id: { $in: transfer.dispatchNotes } },
        { $set: { status: DispatchNoteStatus.RECONCILED } }
      );
    } else if (newStatus === TransferOrderStatus.CLOSED) {
      await DispatchNote.updateMany(
        { _id: { $in: transfer.dispatchNotes } },
        { $set: { status: DispatchNoteStatus.CLOSED } }
      );
    }

    return ServiceResponse.success(`Transfer Order status updated to ${newStatus}`, transfer, httpStatus.OK);
  }

  async recordDefinitiveWeight(id: string, definitiveWeight: number) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ServiceResponse.failure('Invalid Transfer Order ID', null, httpStatus.BAD_REQUEST);
    }

    if (!definitiveWeight || definitiveWeight <= 0) {
      return ServiceResponse.failure('Definitive weight must be a positive number', null, httpStatus.BAD_REQUEST);
    }

    const transfer = await TransferOrder.findById(id);
    if (!transfer) {
      return ServiceResponse.failure('Transfer Order not found', null, httpStatus.NOT_FOUND);
    }

    let totalPallets = transfer.totalPallets;
    if (!totalPallets || totalPallets <= 0) {
      const notes = await DispatchNote.find({ _id: { $in: transfer.dispatchNotes } });
      const calcPallets = notes.reduce((sum, n) => sum + (Array.isArray(n.bins) ? n.bins.length : 0), 0);
      totalPallets = calcPallets > 0 ? calcPallets : Math.max(1, transfer.dispatchNotes.length);
      transfer.totalPallets = totalPallets;
    }

    let defaultPalletWeight = 800;
    try {
      const sysConfig = await SystemConfig.findOne({
        key: {
          $in: [
            'ESTIMATED_AVG_PALLET_WEIGHT_KG',
            'estimated_avg_pallet_weight_kg',
            'STANDARD_PALLET_WEIGHT_KG',
            'standard_pallet_weight_kg',
            'ESTIMATED_PALLET_WEIGHT',
            'STANDARD_BIN_WEIGHT_KG',
            'standard_bin_weight_kg',
          ],
        },
      });
      if (sysConfig && sysConfig.value !== undefined && Number(sysConfig.value) > 0) {
        defaultPalletWeight = Number(sysConfig.value);
      }
    } catch (e) {
      // Fallback default
    }

    const estAvgWeight = transfer.estimatedAvgWeightPerPallet && transfer.estimatedAvgWeightPerPallet > 0
      ? transfer.estimatedAvgWeightPerPallet
      : defaultPalletWeight;

    transfer.forecastedWeight = totalPallets * estAvgWeight;

    const definitiveAvgWeightPerPallet = Math.round((definitiveWeight / totalPallets) * 100) / 100;

    transfer.definitiveWeight = definitiveWeight;
    transfer.definitiveAvgWeightPerPallet = definitiveAvgWeightPerPallet;
    transfer.weightStatus = TransferOrderWeightStatus.DEFINITIVE;

    await transfer.save();

    const populated = await TransferOrder.findById(id)
      .populate('buyer', 'name internalCode')
      .populate('destination', 'name internalCode')
      .populate('transportProvider', 'legalName');

    return ServiceResponse.success('Definitive weight recorded successfully and supersedes forecasted weight', populated, httpStatus.OK);
  }

  async exportTransferOrderPdf(id: string): Promise<{ buffer: Buffer; filename: string; contentType: string } | null> {
    const transfer = await TransferOrder.findById(id)
      .populate('buyer', 'name internalCode')
      .populate('destination', 'name internalCode')
      .populate('transportProvider', 'legalName name')
      .populate({
        path: 'dispatchNotes',
        populate: { path: 'bins' },
      });

    if (!transfer) {
      return null;
    }

    const doc = new PDFDocument({ size: 'A4', margin: 36 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const primaryColor = '#0F4C3A';
    const textDark = '#1A202C';
    const textMuted = '#718096';
    const borderClr = '#E2E8F0';
    const marginX = 36;
    const contentWidth = 523;

    let y = 36;

    // --- Header ---
    doc.font('Helvetica-Bold').fontSize(18).fillColor(primaryColor).text('Qultiva Farms', marginX, y);
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Qultiva Farms S.L.', marginX, y + 22);

    const docNumber = transfer.transferCode || transfer.transferOrderNumber || `TO-${transfer._id.toString().slice(-6).toUpperCase()}`;
    doc.font('Helvetica-Bold').fontSize(8).fillColor(textMuted).text('ALBARÁN N°', marginX, y, { align: 'right', width: contentWidth });
    doc.font('Helvetica-Bold').fontSize(14).fillColor(primaryColor).text(docNumber, marginX, y + 14, { align: 'right', width: contentWidth });

    y += 48;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(primaryColor).lineWidth(1.5).stroke();
    y += 16;

    // --- FECHA / SALIDA ---
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text('FECHA / SALIDA', marginX, y);
    y += 16;

    const loadingDateStr = transfer.loadingDate ? new Date(transfer.loadingDate).toLocaleDateString('es-ES') : new Date().toLocaleDateString('es-ES');
    const departureTimeStr = transfer.departureDateTime ? new Date(transfer.departureDateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Fecha de carga', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(loadingDateStr, marginX, y, { align: 'right', width: contentWidth });
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Hora de salida', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(departureTimeStr, marginX, y, { align: 'right', width: contentWidth });

    y += 24;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(borderClr).lineWidth(0.5).stroke();
    y += 16;

    // --- TRANSPORTE ---
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text('TRANSPORTE', marginX, y);
    y += 16;

    const providerName = (transfer.transportProvider as any)?.legalName || (transfer.transportProvider as any)?.name || 'N/A';
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Matrícula', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(transfer.truckLicensePlate || 'N/A', marginX, y, { align: 'right', width: contentWidth });
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Transportista', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(providerName, marginX, y, { align: 'right', width: contentWidth });
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Conductor', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(transfer.driverName || 'N/A', marginX, y, { align: 'right', width: contentWidth });

    y += 24;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(borderClr).lineWidth(0.5).stroke();
    y += 16;

    // --- DESTINATARIO ---
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text('DESTINATARIO', marginX, y);
    y += 16;

    const buyerName = (transfer.buyer as any)?.name || 'N/A';
    const destName = (transfer.destination as any)?.name || 'N/A';
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Comprador', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(buyerName, marginX, y, { align: 'right', width: contentWidth });
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor(textMuted).text('Centro', marginX, y);
    doc.font('Helvetica-Bold').fontSize(9).fillColor(textDark).text(destName, marginX, y, { align: 'right', width: contentWidth });

    y += 24;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(borderClr).lineWidth(0.5).stroke();
    y += 16;

    // --- NOTAS DE ENTREGA INCLUIDAS ---
    doc.font('Helvetica-Bold').fontSize(10).fillColor(primaryColor).text('NOTAS DE ENTREGA INCLUIDAS', marginX, y);
    y += 16;

    // Table Header
    doc.font('Helvetica-Bold').fontSize(8).fillColor(textMuted);
    doc.text('Nota', marginX, y);
    doc.text('Palets', marginX + 220, y, { width: 100, align: 'center' });
    doc.text('Peso est.', marginX + 370, y, { width: 153, align: 'right' });
    y += 14;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(borderClr).lineWidth(0.5).stroke();
    y += 8;

    // Table Rows
    const notes = (transfer.dispatchNotes as any[]) || [];
    let totalPalletsCount = 0;
    let totalEstWeightKg = 0;

    notes.forEach((note) => {
      const noteCode = note.noteNumber || note.dispatchNoteNumber || `DN-${note._id.toString().slice(-6).toUpperCase()}`;
      const palletBinsCount = Array.isArray(note.bins) && note.bins.length > 0 ? note.bins.length : 1;
      const noteEstWeight = note.totalEstimatedWeightKg || (palletBinsCount * (transfer.estimatedAvgWeightPerPallet || 300));

      totalPalletsCount += palletBinsCount;
      totalEstWeightKg += noteEstWeight;

      doc.font('Helvetica').fontSize(9).fillColor(textDark);
      doc.text(noteCode, marginX, y);
      doc.text(String(palletBinsCount), marginX + 220, y, { width: 100, align: 'center' });
      doc.text(`${noteEstWeight.toLocaleString()} kg`, marginX + 370, y, { width: 153, align: 'right' });
      y += 18;
    });

    const displayTotalPallets = transfer.totalPallets || totalPalletsCount;
    const displayTotalWeight = transfer.forecastedWeight || totalEstWeightKg;

    y += 4;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(borderClr).lineWidth(0.5).stroke();
    y += 16;

    // --- TOTAL ---
    doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('TOTAL', marginX, y);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text(`${displayTotalPallets} palets - ${displayTotalWeight.toLocaleString()} kg`, marginX, y, { align: 'right', width: contentWidth });

    y += 36;
    doc.moveTo(marginX, y).lineTo(marginX + contentWidth, y).strokeColor(borderClr).lineWidth(0.5).stroke();
    y += 40;

    // --- SIGNATURES ---
    const sigLineY = y + 40;
    doc.moveTo(marginX + 20, sigLineY).lineTo(marginX + 200, sigLineY).strokeColor(textMuted).lineWidth(0.8).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(textMuted).text('Firma del conductor', marginX + 20, sigLineY + 6, { width: 180, align: 'center' });

    doc.moveTo(marginX + 300, sigLineY).lineTo(marginX + 480, sigLineY).strokeColor(textMuted).lineWidth(0.8).stroke();
    doc.font('Helvetica').fontSize(8).fillColor(textMuted).text('Firma del responsable', marginX + 300, sigLineY + 6, { width: 180, align: 'center' });

    doc.end();

    await new Promise((resolve) => doc.on('end', resolve));

    const buffer = Buffer.concat(chunks);
    const filename = `Albaran_Entrega_${docNumber}.pdf`;

    return {
      buffer,
      filename,
      contentType: 'application/pdf',
    };
  }
}

export default new LogisticsService();
export { LogisticsService };
