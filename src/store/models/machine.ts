import { createModel } from '@rematch/core';
import _ from 'lodash';
import serviceApi from '@/config/service';
import { NEED_ADD_SUM_QUERYS, getProperStep, TIME_OPTION_TYPE } from '@/utils/dashboard';
import { LINUX } from '@/utils/promQL';
import { IStatRangeItem, IStatSingleItem } from '@/utils/interface';
import { unique } from '@/utils';
import { MetricsPanelValue } from '@/components/MetricsFilterPanel';
import { INTERVAL_FREQUENCY_LIST } from '@/utils/service';

const PROMQL = LINUX;
export interface IState {
  cpuStat: IStatRangeItem[];
  diskStat: IStatRangeItem[];
  memoryStat: IStatRangeItem[];
  loadStat: IStatRangeItem[];
  networkOutStat: IStatRangeItem[];
  networkInStat: IStatRangeItem[];
  networkStat: IStatRangeItem[];
  memorySizeStat: IStatSingleItem[];
  diskSizeStat: IStatSingleItem[];
  instanceList: any[];
  metricsFilterValues: MetricsPanelValue;
}

export function MachineModelWrapper(service) {
  return createModel({
    state: {
      cpuStat: [] as IStatRangeItem[],
      diskStat: [] as IStatRangeItem[],
      memoryStat: [] as IStatRangeItem[],
      networkOutStat: [] as IStatRangeItem[],
      networkInStat: [] as IStatRangeItem[],
      networkStat: [] as IStatRangeItem[],
      loadStat: [] as IStatRangeItem[],
      memorySizeStat: [] as IStatSingleItem[],
      diskSizeStat: [] as IStatSingleItem[],
      instanceList: [],
      metricsFilterValues: {
        frequency: INTERVAL_FREQUENCY_LIST[0].value,
        instanceList: ['all'],
        timeRange: TIME_OPTION_TYPE.DAY1,
      },
    },
    reducers: {
      update: (state: IState, payload: any) => ({
        ...state,
        ...payload,
      }),
    },
    effects: () => ({
      async asyncGetMetricsData(payload: {
        start: number;
        end: number;
        metric: string;
        clusterID?: string;
      }) {
        const { start, end, clusterID, metric } = payload;
        const _start = start / 1000;
        const _end = end / 1000;
        const step = getProperStep(start, end);
        const { code, data } = (await service.execPromQLByRange({
          query: PROMQL(clusterID)[metric],
          start: _start,
          end: _end,
          step,
        })) as any;
        let result:any = [];
        if (code === 0) {
          if (NEED_ADD_SUM_QUERYS.includes(metric)) {
            result = (await this.asyncGetSumDataByRange({
              query: PROMQL(clusterID)[metric],
              start: _start,
              end: _end,
              step,
              data: data.result,
            })) as any;
          } else {
            result = data.result;
          }
        }
        const instanceList = result.map(item => item.metric.instance).filter(instance => instance !== 'total');
          this.update({
            instanceList: unique(instanceList)
          })
        return result;
      },
      async asyncGetCPUStatByRange(payload: {
        start: number;
        end: number;
        metric: string;
        clusterID?: string;
      }) {
        let cpuStat = await this.asyncGetMetricsData(payload);
        this.update({
          cpuStat,
        });
      },
  
      async asyncGetMemoryStatByRange(payload: {
        start: number;
        end: number;
        metric: string;
        clusterID?: string;
      }) {
        let memoryStat = await this.asyncGetMetricsData(payload);
        this.update({
          memoryStat,
        });
      },
  
      async asyncGetMemorySizeStat(clusterID?: string) {
        const { code, data } = (await service.execPromQL({
          query: PROMQL(clusterID).memory_size,
        })) as any;
        let memorySizeStat = [];
        if (code === 0) {
          memorySizeStat = data.result;
        }
        this.update({
          memorySizeStat,
        });
      },
  
      async asyncGetDiskStatByRange(payload: {
        start: number;
        end: number;
        metric: string;
        clusterID: string;
      }) {
        let diskStat = await this.asyncGetMetricsData(payload);
        this.update({
          diskStat,
        });
      },
  
      async asyncGetDiskSizeStat(clusterID?: string) {
        const { code, data } = (await service.execPromQL({
          query: PROMQL(clusterID).disk_size,
        })) as any;
        let diskSizeStat = [];
        if (code === 0) {
          diskSizeStat = data.result;
        }
        this.update({
          diskSizeStat,
        });
      },
  
      async asyncGetLoadByRange(payload: {
        start: number;
        end: number;
        metric: string;
        clusterID: string;
      }) {
        let loadStat = await this.asyncGetMetricsData(payload);
        this.update({
          loadStat,
        });
      },
  
      async asyncGetNetworkStatByRange(payload: {
        start: number;
        end: number;
        metric: string;
        inOrOut?: string;
        clusterID?: string;
      }) {
        const { start, end, metric, clusterID, inOrOut } = payload;
        let networkStat = await this.asyncGetMetricsData({ start, end, metric, clusterID });
        switch (inOrOut) {
          case 'in':
            this.update({
              networkInStat: networkStat,
            });
            break;
          case 'out':
            this.update({
              networkOutStat: networkStat,
            });
            break;
          default:
            this.update({
              networkStat,
            });
        }
      },
  
      async asyncGetSumDataByRange(payload: {
        query: string;
        start: number;
        end: number;
        step: number;
        data: any[];
      }) {
        const { query, start, end, step, data } = payload;
        const { code, data: dataStat } = (await service.execPromQLByRange({
          query: `sum(${query})`,
          start,
          end,
          step,
        })) as any;
        if (code === 0 && dataStat.result.length !== 0) {
          const sumData = {
            metric: {
              instance: 'total',
              job: 'total',
            },
          } as any;
          sumData.values = dataStat.result[0].values;
          return data.concat(sumData);
        }
        return data;
      },

      updateMetricsFiltervalues(values: MetricsPanelValue) {
        this.update({
          metricsFilterValues: values,
        });
      }
    }),
  });
}

export const machine = MachineModelWrapper(serviceApi);