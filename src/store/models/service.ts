import { createModel } from '@rematch/core';
import _ from 'lodash';
import serviceApi from '@/config/service';
import { IServicePanelConfig } from '@/utils/interface';
import { DEFAULT_SERVICE_PANEL_CONFIG } from '@/utils/service';
import { getProperStep } from '@/utils/dashboard';
import { unique } from '@/utils';

interface IState {
  panelConfig: {
    graph: IServicePanelConfig[];
    storage: IServicePanelConfig[];
    meta: IServicePanelConfig[];
  };
  instanceList: string[];
}

export function ModelWrapper(serviceApi) {
  return createModel({
    state: {
      panelConfig: localStorage.getItem('panelConfig')
        ? JSON.parse(localStorage.getItem('panelConfig')!)
        : DEFAULT_SERVICE_PANEL_CONFIG,
      instanceList: []
    },
    reducers: {
      update: (state: IState, payload: any) => ({
        ...state,
        ...payload,
      }),
    },
    effects: () => ({
      async asyncGetMetricsSumData(payload: {
        query: string;
        start: number;
        end: number;
        space?: string;
        clusterID?: string;
      }) {
        const { start, end, space, query: _query, clusterID } = payload;
        const step = getProperStep(start, end);
        const _start = start / 1000;
        const _end = end / 1000;
        let query = `sum(${_query}{cluster="${clusterID}"})`;
        query = `${_query}{cluster="${clusterID}", space="${space || ''}"}`;
        const { code, data } = (await serviceApi.execPromQLByRange({
          query,
          start: _start,
          end: _end,
          step,
        })) as any;
  
        if (code === 0 && data.result.length !== 0) {
          const sumData = {
            metric: {
              instanceName: 'total',
              instance: 'total',
            },
          } as any;
          sumData.values = data.result[0].values;
          return sumData;
        }
        return [];
      },
  
      async asyncGetMetricsData(payload: {
        query: string;
        space?: string;
        start: number;
        end: number;
        clusterID?: string;
        noSuffix?: boolean;
      }, rootState) {
        const {
          start,
          space,
          end,
          query: _query,
          clusterID,
          noSuffix = false,
        } = payload;
        const step = getProperStep(start, end);
        const _start = start / 1000;
        const _end = end / 1000;
        let query = _query;
        if (clusterID && !noSuffix) {
          query = `${_query}{cluster="${clusterID}", space="${space || ''}"}`;
        }
        const { code, data } = (await serviceApi.execPromQLByRange({
          query,
          start: _start,
          end: _end,
          step,
        })) as any;
        let stat = [] as any;
        if (code === 0 && data.result.length !== 0) {
          stat = data.result;
        }
        const list = stat.map(item => item.metric.instanceName);
        // rootState.service.instanceList.concat()
        this.update({
          instanceList: unique(list),
        })
        return stat;
      },
  
      async asyncGetStatus(payload: {
        interval: number;
        end: number;
        query: string;
        clusterID?: string;
      }) {
        const { interval, end, query, clusterID } = payload;
        const start = end - interval;
        const step = getProperStep(start, end);
        const _start = start / 1000;
        const _end = end / 1000;
        const { code, data } = (await serviceApi.execPromQLByRange({
          query: clusterID ? `${query}{cluster="${clusterID}"}` : query,
          start: _start,
          end: _end,
          step,
        })) as any;
        let normal = 0;
        let abnormal = 0;
        if (code === 0) {
          data.result.forEach(item => {
            const value = item.values.pop();
            if (value[1] === '1') {
              normal++;
            } else {
              abnormal++;
            }
          });
        }
        return {
          normal,
          abnormal,
        };
      },
    }),
  });
}

export const service = ModelWrapper(serviceApi);