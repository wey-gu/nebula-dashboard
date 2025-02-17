import dayjs from 'dayjs';
import _ from 'lodash';
import { ILineChartMetric, IStatRangeItem } from '@/utils/interface';
import { VALUE_TYPE } from '@/utils/promQL';

export const DETAIL_DEFAULT_RANGE = 60 * 60 * 24 * 1000;
export const CARD_RANGE = 60 * 60 * 24 * 1000;
export const CARD_POLLING_INTERVAL = 10000 * 1000;
export const MAX_STEP_ALLOW = 11000;
export const TIME_INTERVAL_OPTIONS = [5, 60, 600, 3600];

export const THRESHOLDS = {
  low: 60,
  medium: 90,
};

export const CARD_LOW_COLORS = 'rgba(61,209,136,1)';
export const CARD_MEDIUM_COLORS = 'rgba(245,182,13,1)';
export const CARD_HIGH_COLORS = 'rgba(230,113,113,1)';

export const getProperStep = (start: number, end: number) => {
  const hours = Math.round((end - start) / (3600 * 1000));
  if (hours <= 1) {
    return 7;
  }
  if (hours <= 6) {
    // 6 hour
    return 86;
  }
  if (hours <= 12) {
    // 12hour
    return 172;
  }
  if (hours <= 24) {
    // 1 day
    return 345;
  }
  if (hours <= 72) {
    // 3 days
    return 691;
  }
  if (hours <= 168) {
    // 1 week
    return 2419;
  }
  if (hours <= 336) {
    // 2 week
    return 4838;
  }
  return Math.round((end - start) / MAX_STEP_ALLOW);
};

export const renderUnit = type => {
  switch (type) {
    case VALUE_TYPE.byteSecond:
    case VALUE_TYPE.byteSecondNet:
      return ['Bytes/s', 'KB/s', 'MB/s', 'GB/s', 'TB/s'];
    case VALUE_TYPE.byte:
      return ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    case VALUE_TYPE.numberSecond:
      return ['/s'];
    case VALUE_TYPE.percentage:
      return ['%'];
    default:
      return [];
  }
};
export const VERSION_REGEX = /\d+\.{1}\d+\.{1}\d+/;
// 0.0.1 means unknow version
export function getVersion(v: string) {
  const match = v?.match(VERSION_REGEX);
  return match ? match[0] : v;
}

export const getBaseLineByUnit = (config: {
  baseLine: number;
  unit: string;
  valueType: string;
}) => {
  const { baseLine, unit, valueType } = config;
  let conversion = 1024;
  if (valueType === VALUE_TYPE.byteSecondNet) {
    conversion = 1000;
  }
  switch (unit) {
    case 'KB':
    case 'KB/s':
      return conversion * baseLine;
    case 'MB':
    case 'MB/s':
      return conversion * conversion * baseLine;
    case 'GB':
    case 'GB/s':
      return conversion * conversion * conversion * baseLine;
    case 'TB':
    case 'TB/s':
      return conversion * conversion * conversion * conversion * baseLine;
    default:
      return baseLine;
  }
};

export const getWhichColor = value => {
  if (value < THRESHOLDS.low) {
    return CARD_LOW_COLORS;
  }
  if (value < THRESHOLDS.medium) {
    return CARD_MEDIUM_COLORS;
  }
  return CARD_HIGH_COLORS;
};

export const getProperByteDesc = (bytes: any, conversion: number) => {
  const kb = conversion;
  const mb = conversion * conversion;
  const gb = mb * conversion;
  const tb = gb * conversion;
  const nt = bytes / tb;
  const ng = bytes / gb;
  const nm = bytes / mb;
  const nk = bytes / kb;
  let value = 0;
  let unit = '';

  if (nt >= 1) {
    value = Number(nt.toFixed(2));
    unit = 'TB';
  } else if (ng >= 1) {
    value = Number(ng.toFixed(2));
    unit = 'GB';
  } else if (nm >= 1) {
    value = Number(nm.toFixed(2));
    unit = 'MB';
  } else if (nk >= 1) {
    value = Number(nk.toFixed(2));
    unit = 'KB';
  } else {
    value = bytes;
    unit = 'Bytes';
  }

  return {
    value,
    unit,
    desc: value + unit,
  };
};

export const getDataByType = (payload: {
  data: IStatRangeItem[];
  type?: string;
  name: string;
  aliasConfig?: any;
}) => {
  const { name, type, data, aliasConfig } = payload;
  const res = [] as ILineChartMetric[];
  data.forEach(instance => {
    instance.values.forEach(([timstamps, value]) => {
      const _name = instance.metric[name];
      if ((type === 'all' && _name !== 'total') || _name === type) {
        res.push({
          type: aliasConfig && aliasConfig[_name] ? aliasConfig[_name] : _name,
          value: Number(value),
          time: timstamps,
        });
      }
    });
  });
  return res;
};

export const getProperTickInterval = period => {
  switch (period) {
    // past one hour
    case 24 * 60 * 60:
      return 2 * 60 * 60;
    case 60 * 60:
      return 5 * 60;
    default:
      return period < 60 * 60 ? 30 : 60 * 60 * 2;
  }
};

export const TIMEOPTIONS = [
  {
    name: '1hour',
    value: 60 * 60 * 1000,
  },
  {
    name: '6hour',
    value: 60 * 60 * 6 * 1000,
  },
  {
    name: '12hour',
    value: 60 * 60 * 12 * 1000,
  },
  {
    name: '1day',
    value: 60 * 60 * 24 * 1000,
  },
  {
    name: '3day',
    value: 60 * 60 * 24 * 3 * 1000,
  },
  {
    name: '7day',
    value: 60 * 60 * 24 * 7 * 1000,
  },
  {
    name: '14day',
    value: 60 * 60 * 24 * 14 * 1000,
  },
];

export const NEED_ADD_SUM_QUERYS = [
  // For Instanc
  'memory_used',
  'memory_actual_used',
  'memory_free',
  'disk_used',
  'disk_free',
  'disk_readbytes',
  'disk_writebytes',
  'disk_readiops',
  'disk_writeiops',
  'network_in_errs',
  'network_out_errs',
  'network_in_packets',
  'network_out_packet',
  // For Nebula Graph Service
  'num_queries',
  'num_slow_queries',
];

export enum MACHINE_TYPE {
  cpu = 'cpu',
  memory = 'memory',
  load = 'load',
  disk = 'disk',
  networkOut = 'networkOut',
  networkIn = 'networkIn',
  network = 'network',
}

export const VERSIONS = ['v2.0.1', 'v2.5.1', 'v2.6.1', 'v3.0.0', 'v3.1.0'];

export const getDefaultTimeRange = (interval?: number) => {
  const end = Date.now();
  const start = interval ? end - interval : end - DETAIL_DEFAULT_RANGE;
  return [dayjs(start), dayjs(end)];
};

export const getMaxNum = data => {
  const max = _.maxBy(data, item => item.value) as any;
  return max ? max.value : 0;
};

export const getMaxNumAndLength = (payload: {
  data: any[];
  valueType: string;
  baseLine?: number;
}) => {
  const { data = [], valueType, baseLine } = payload;
  const maxNum = getMaxNum(data);
  let maxNumLen =
    maxNum === 0 && baseLine
      ? baseLine.toString().length
      : maxNum.toString().length;
  switch (valueType) {
    case VALUE_TYPE.percentage:
      maxNumLen = 5;
      break;
    case VALUE_TYPE.byte:
    case VALUE_TYPE.byteSecond: {
      const { value, unit } = getProperByteDesc(maxNum, 1024);
      if (valueType === VALUE_TYPE.byteSecond) {
        maxNumLen = unit.length + value.toString().length + 2;
      }
      maxNumLen = unit.length + value.toString().length;
      break;
    }
    case VALUE_TYPE.byteSecondNet: {
      const { value, unit } = getProperByteDesc(maxNum, 1000);
      maxNumLen = unit.length + value.toString().length + 2;
      break;
    }
    case VALUE_TYPE.numberSecond:
      maxNumLen += 2;
      break;
    default:
      break;
  }
  return { maxNum, maxNumLen };
};
