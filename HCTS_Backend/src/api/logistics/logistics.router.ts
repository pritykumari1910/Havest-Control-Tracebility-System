import express from 'express';
import { authMiddleware } from '../../middlewares/auth.ts';
import { auditLogMiddleware } from '../../middlewares/auditLog.ts';
import validateRequest from '../../middlewares/validateRequest.ts';
import catchAsync from '../../utils/catchAsync.ts';
import logisticsController from './logistics.controller.ts';
import './logistics.swagger.ts';
import {
  createBuyerValidator,
  updateBuyerValidator,
  createDestinationValidator,
  updateDestinationValidator,
  createTransportValidator,
  updateTransportValidator,
  createDispatchNoteValidator,
  updateDispatchNoteValidator,
  getDispatchNotesValidator,
  noteIdParamValidator,
  associateBinsValidator,
  removeBinValidator,
  exportSummaryValidator,
  createTransferOrderValidator,
} from './logistics.validator.ts';

const logisticsRouter = express.Router();

logisticsRouter.use(authMiddleware);

// ==========================================
// BUYERS ROUTES
// ==========================================
logisticsRouter.get('/buyers', catchAsync(logisticsController.getBuyers));

logisticsRouter.post(
  '/buyers',
  auditLogMiddleware({ event: 'BUYER_CREATED', entityType: 'buyer' }),
  createBuyerValidator,
  validateRequest,
  catchAsync(logisticsController.createBuyer)
);

logisticsRouter.put(
  '/buyers/:buyerId',
  auditLogMiddleware({
    event: 'BUYER_UPDATED',
    entityType: 'buyer',
    getEntityId: (req) => String(req.params.buyerId),
  }),
  updateBuyerValidator,
  validateRequest,
  catchAsync(logisticsController.updateBuyer)
);

// ==========================================
// DESTINATIONS ROUTES
// ==========================================
logisticsRouter.get('/destinations', catchAsync(logisticsController.getDestinationCenters));

logisticsRouter.post(
  '/destinations',
  auditLogMiddleware({ event: 'DESTINATION_CENTER_CREATED', entityType: 'destination_center' }),
  createDestinationValidator,
  validateRequest,
  catchAsync(logisticsController.createDestinationCenter)
);

logisticsRouter.put(
  '/destinations/:destId',
  auditLogMiddleware({
    event: 'DESTINATION_CENTER_UPDATED',
    entityType: 'destination_center',
    getEntityId: (req) => String(req.params.destId),
  }),
  updateDestinationValidator,
  validateRequest,
  catchAsync(logisticsController.updateDestinationCenter)
);

// ==========================================
// TRANSPORT PROVIDERS ROUTES
// ==========================================
logisticsRouter.get('/transport-providers', catchAsync(logisticsController.getTransportProviders));

logisticsRouter.post(
  '/transport-providers',
  auditLogMiddleware({ event: 'TRANSPORT_PROVIDER_CREATED', entityType: 'transport_provider' }),
  createTransportValidator,
  validateRequest,
  catchAsync(logisticsController.createTransportProvider)
);

logisticsRouter.put(
  '/transport-providers/:providerId',
  auditLogMiddleware({
    event: 'TRANSPORT_PROVIDER_UPDATED',
    entityType: 'transport_provider',
    getEntityId: (req) => String(req.params.providerId),
  }),
  updateTransportValidator,
  validateRequest,
  catchAsync(logisticsController.updateTransportProvider)
);

// ==========================================
// DISPATCH NOTES ROUTES
// ==========================================

// List all dispatch notes (with filters)
logisticsRouter.get(
  '/dispatch-notes',
  getDispatchNotesValidator,
  validateRequest,
  catchAsync(logisticsController.getDispatchNotes)
);

// Create dispatch note
logisticsRouter.post(
  '/dispatch-notes',
  auditLogMiddleware({ event: 'DISPATCH_NOTE_CREATED', entityType: 'dispatch_note' }),
  createDispatchNoteValidator,
  validateRequest,
  catchAsync(logisticsController.createDispatchNote)
);

// Get single dispatch note by ID
logisticsRouter.get(
  '/dispatch-notes/:noteId',
  noteIdParamValidator,
  validateRequest,
  catchAsync(logisticsController.getDispatchNoteById)
);

// Edit / Update dispatch note details (buyer, destination, campaign, noteDate)
logisticsRouter.put(
  '/dispatch-notes/:noteId',
  auditLogMiddleware({ event: 'DISPATCH_NOTE_UPDATED', entityType: 'dispatch_note', getEntityId: (req) => String(req.params.noteId) }),
  updateDispatchNoteValidator,
  validateRequest,
  catchAsync(logisticsController.updateDispatchNote)
);

logisticsRouter.patch(
  '/dispatch-notes/:noteId',
  auditLogMiddleware({ event: 'DISPATCH_NOTE_UPDATED', entityType: 'dispatch_note', getEntityId: (req) => String(req.params.noteId) }),
  updateDispatchNoteValidator,
  validateRequest,
  catchAsync(logisticsController.updateDispatchNote)
);

// Associate bins to a dispatch note
logisticsRouter.post(
  '/dispatch-notes/:noteId/bins',
  auditLogMiddleware({
    event: 'DISPATCH_NOTE_BINS_ASSOCIATED',
    entityType: 'dispatch_note',
    getEntityId: (req) => String(req.params.noteId),
  }),
  associateBinsValidator,
  validateRequest,
  catchAsync(logisticsController.associateBins)
);

// Remove a bin from a dispatch note (pre-buyer, with reason)
logisticsRouter.delete(
  '/dispatch-notes/:noteId/bins/:binId',
  auditLogMiddleware({
    event: 'DISPATCH_NOTE_BIN_REMOVED',
    entityType: 'dispatch_note',
    getEntityId: (req) => String(req.params.noteId),
  }),
  removeBinValidator,
  validateRequest,
  catchAsync(logisticsController.removeBinFromNote)
);

// Close a dispatch note
logisticsRouter.post(
  '/dispatch-notes/:noteId/close',
  auditLogMiddleware({
    event: 'DISPATCH_NOTE_CLOSED',
    entityType: 'dispatch_note',
    getEntityId: (req) => String(req.params.noteId),
  }),
  noteIdParamValidator,
  validateRequest,
  catchAsync(logisticsController.closeDispatchNote)
);

// Reopen a closed dispatch note (pre-buyer only)
logisticsRouter.post(
  '/dispatch-notes/:noteId/reopen',
  auditLogMiddleware({
    event: 'DISPATCH_NOTE_REOPENED',
    entityType: 'dispatch_note',
    getEntityId: (req) => String(req.params.noteId),
  }),
  noteIdParamValidator,
  validateRequest,
  catchAsync(logisticsController.reopenDispatchNote)
);

// Get dispatch note summary (JSON)
logisticsRouter.get(
  '/dispatch-notes/:noteId/summary',
  noteIdParamValidator,
  validateRequest,
  catchAsync(logisticsController.getDispatchNoteSummary)
);

// Export dispatch note summary (PDF / Excel / CSV)
logisticsRouter.get(
  '/dispatch-notes/:noteId/export',
  exportSummaryValidator,
  validateRequest,
  catchAsync(logisticsController.exportDispatchNoteSummary)
);

// Dispatch notes overall report & analytics
logisticsRouter.get(
  '/dispatch-notes-reports',
  catchAsync(logisticsController.getDispatchNotesReport)
);

// ==========================================
// TRANSFER ORDERS ROUTES
// ==========================================
logisticsRouter.get('/transfer-orders', catchAsync(logisticsController.getTransferOrders));

logisticsRouter.post(
  '/transfer-orders',
  auditLogMiddleware({ event: 'TRANSFER_ORDER_CREATED', entityType: 'transfer_order' }),
  createTransferOrderValidator,
  validateRequest,
  catchAsync(logisticsController.createTransferOrder)
);

logisticsRouter.get('/transfer-orders/:id', catchAsync(logisticsController.getTransferOrderById));

logisticsRouter.patch(
  '/transfer-orders/:id/status',
  auditLogMiddleware({ event: 'TRANSFER_ORDER_STATUS_UPDATED', entityType: 'transfer_order', getEntityId: (req) => String(req.params.id) }),
  catchAsync(logisticsController.updateTransferOrderStatus)
);

logisticsRouter.patch(
  '/transfer-orders/:id/weight',
  auditLogMiddleware({ event: 'TRANSFER_ORDER_WEIGHT_RECORDED', entityType: 'transfer_order', getEntityId: (req) => String(req.params.id) }),
  catchAsync(logisticsController.recordDefinitiveWeight)
);

logisticsRouter.get('/transfer-orders/:id/export', catchAsync(logisticsController.exportTransferOrder));

export default logisticsRouter;
