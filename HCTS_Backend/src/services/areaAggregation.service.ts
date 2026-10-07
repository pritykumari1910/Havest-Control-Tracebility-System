import mongoose from 'mongoose';
import Farm from '../models/farm.model.ts';
import Plot from '../models/plot.model.ts';
import Valve from '../models/valve.model.ts';
import Park from '../models/park.model.ts';

export async function aggregateAreaForValve(valveId: string | mongoose.Types.ObjectId): Promise<void> {
  const result = await Park.aggregate([
    { $match: { parentValve: new mongoose.Types.ObjectId(valveId) } },
    { $group: { _id: null, totalArea: { $sum: '$area' } } }
  ]);
  const newArea = result.length > 0 ? result[0].totalArea : 0;
  await Valve.findByIdAndUpdate(valveId, { irrigationArea: newArea });
  
  // Now propagate to plot
  const valve = await Valve.findById(valveId);
  if (valve && valve.parentPlot) {
    await aggregateAreaForPlot(valve.parentPlot);
  }
}

export async function aggregateAreaForPlot(plotId: string | mongoose.Types.ObjectId): Promise<void> {
  const result = await Valve.aggregate([
    { $match: { parentPlot: new mongoose.Types.ObjectId(plotId) } },
    { $group: { _id: null, totalArea: { $sum: '$irrigationArea' } } }
  ]);
  const newArea = result.length > 0 ? result[0].totalArea : 0;
  await Plot.findByIdAndUpdate(plotId, { totalArea: newArea });

  // Now propagate to farm
  const plot = await Plot.findById(plotId);
  if (plot && plot.parentFarm) {
    await aggregateAreaForFarm(plot.parentFarm);
  }
}

export async function aggregateAreaForFarm(farmId: string | mongoose.Types.ObjectId): Promise<void> {
  const result = await Plot.aggregate([
    { $match: { parentFarm: new mongoose.Types.ObjectId(farmId) } },
    { $group: { _id: null, totalArea: { $sum: '$totalArea' } } }
  ]);
  const newArea = result.length > 0 ? result[0].totalArea : 0;
  await Farm.findByIdAndUpdate(farmId, { totalHectares: newArea });
}
