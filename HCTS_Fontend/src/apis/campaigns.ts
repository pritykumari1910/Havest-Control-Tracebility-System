import { axiosInstance } from "@/utils/axios/axiosInstance";

// Dispatched on `window` after a campaign is created/updated so the header's
// active-campaign chip re-fetches (the app's lightweight useQuery has no cache
// invalidation, so we bridge cross-component refreshes with a DOM event).
export const ACTIVE_CAMPAIGN_REFRESH_EVENT = "active-campaign:refresh";

export const notifyActiveCampaignChanged = () => {
  window.dispatchEvent(new Event(ACTIVE_CAMPAIGN_REFRESH_EVENT));
};

export const getAllCampaigns = async (
    params: { page?: number; limit?: number; campaignName?: string; status?: string } = {}
) => {
    try {
        const response = await axiosInstance.get('/campaigns', { params });
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while fetching campaigns');
    }
}

export const createCampaign = async (campaignData: any) => {
    try {
        const response = await axiosInstance.post('/campaigns', campaignData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while creating the campaign');
    }
}

export const updateCampaign = async (campaignId: string, campaignData: any) => {
    try {
        const response = await axiosInstance.patch(`/campaigns/${campaignId}`, campaignData);
        return response.data;
    } catch (error: any) {
        console.log(error)
        throw new Error(error.response?.data?.message || 'An error occurred while updating the campaign');
    }
}