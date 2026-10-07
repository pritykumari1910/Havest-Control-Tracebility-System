import QrSeries from '../../models/qrSeries.model.ts';
import QrInventory from '../../models/qrInventory.model.ts';

class QrSeriesRepository {
  async findOne(query: Record<string, any>) {
    return QrSeries.findOne(query).exec();
  }

  async findOneSort(query: Record<string, any>, sortField: any) {
    return QrSeries.findOne(query).sort(sortField).exec();
  }

  async findById(seriesId: string) {
    return QrSeries.findById(seriesId).exec();
  }

  async findByIdWithUser(seriesId: string) {
    return QrSeries.findById(seriesId).populate('generatingUser', 'firstName lastName email').exec();
  }

  async count(query: Record<string, any>): Promise<number> {
    return QrSeries.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return QrSeries.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).exec();
  }

  async create(payload: any) {
    return QrSeries.create(payload);
  }
}

export default new QrSeriesRepository();
