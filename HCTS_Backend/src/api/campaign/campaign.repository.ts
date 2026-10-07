import Campaign, { CampaignStatus } from '../../models/campaign.model.ts';
import type { CreateCampaignBody } from './campaign.types.ts';

class CampaignRepository {
  async findByCode(campaignCode: string) {
    return Campaign.findOne({ campaignCode }).exec();
  }

  async findByName(campaignName: string) {
    return Campaign.findOne({ campaignName }).exec();
  }

  async findActive() {
    return Campaign.findOne({ status: CampaignStatus.ACTIVE }).exec();
  }

  async findById(campaignId: string) {
    return Campaign.findById(campaignId).exec();
  }

  async create(payload: CreateCampaignBody & { campaignCode: string }) {
    return Campaign.create(payload);
  }

  async count(query: Record<string, any>): Promise<number> {
    return Campaign.countDocuments(query).exec();
  }

  async findWithPagination(query: Record<string, any>, skip: number, limit: number) {
    return Campaign.find(query).sort({ startDate: -1 }).skip(skip).limit(limit).exec();
  }
}

export default new CampaignRepository();
