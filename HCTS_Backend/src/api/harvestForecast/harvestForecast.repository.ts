import HarvestForecast from '../../models/harvestForecast.model.ts';

class HarvestForecastRepository {
  async findOne(query: Record<string, any>) {
    return HarvestForecast.findOne(query).exec();
  }

  async findById(forecastId: string) {
    return HarvestForecast.findById(forecastId).exec();
  }

  async create(payload: any) {
    return HarvestForecast.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return HarvestForecast.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return HarvestForecast.find(query)
      .sort({ recordDate: -1 })
      .skip(skip)
      .limit(limit)
      .populate('campaign', 'campaignName campaignCode')
      .populate('farm', 'farmName farmCode')
      .populate('plot', 'plotName plotCode avocadoVariety')
      .populate('valve', 'valveName valveCode')
      .populate('park', 'parkName parkCode')
      .populate('variety', 'varietyName varietyCode')
      .exec();
  }
}

export default new HarvestForecastRepository();
