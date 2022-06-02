import React, { useMemo } from 'react';
import { Button, Form, Select, TreeSelect } from 'antd';
import intl from 'react-intl-universal';

import { INTERVAL_FREQUENCY_LIST, INTERVAL_FREQUENCY_TYPE } from '@/utils/service';
import TimeSelect from '../TimeSelect';

import styles from './index.module.less';
import { TIME_OPTION_TYPE } from '@/utils/dashboard';

export interface MetricsPanelValue {
  startTime: Date;
  entTime: Date;
  instances: string[];
  frequency: INTERVAL_FREQUENCY_TYPE;
}

interface IProps {
  instanceList: string[];
  onChange?: (values) => void;
}

const MetricsFilterPanel = (props: IProps) => {

  const { instanceList, onChange } = props;

  const [form] = Form.useForm();

  const treeData = useMemo(() => (
    [
      {
        title: 'all',
        value: 'all',
        key: 'all',
        children: instanceList.map(instance => ({
          title: instance,
          value: instance,
          key: instance,
          children: [],
        })),
      }
    ]), [instanceList]);

  const handleFormChange = () => {
    onChange?.(form.getFieldsValue());
  }

  const handleTimeSelectChange = (value: TIME_OPTION_TYPE | number[]) => {
    form.setFieldsValue({
      timeRange: value,
    });
    onChange?.(form.getFieldsValue());
  }

  const handleFrequencyChange = (value: number) => {
    form.setFieldsValue({
      frequency: value,
    });
    onChange?.(form.getFieldsValue());
  }

  const handleInstanceChange = (value)=> {
    form.setFieldsValue({
      instances: value,
    });
    onChange?.(form.getFieldsValue());
  }

  return (
    <Form
      className={styles.metricsFilterPanel}
      form={form}
      layout="inline"
      initialValues={{
        frequency: INTERVAL_FREQUENCY_LIST[0].value,
        instanceList: ['all'],
        timeRange: TIME_OPTION_TYPE.DAY1,
      }}
      onChange={handleFormChange}
    >
      <Form.Item name="timeRange">
        <TimeSelect onChange={handleTimeSelectChange}/>
      </Form.Item>
      <Form.Item name="frequency" label={intl.get('common.updateFrequency')}
      >
        <Select
          className={styles.frequencySelect}
          onChange={handleFrequencyChange}
        >
          {
            INTERVAL_FREQUENCY_LIST.map(item => (
              <Select.Option key={item.value} value={item.value}>{item.type}</Select.Option>
            ))
          }
        </Select>
      </Form.Item>
      <Form.Item wrapperCol={{
        // span: 22,
      }} name="instanceList" label={intl.get('common.metricLabel')}>
        <TreeSelect 
          style={{ minWidth: '250px', maxWidth: '500px' }} 
          treeData={treeData} treeCheckable
          showCheckedStrategy={TreeSelect.SHOW_PARENT}
          onChange={handleInstanceChange}
        />
      </Form.Item>
      {/* <Button onClick={handleConfirm} type="primary" className={`${styles.primaryBtn} ${styles.confirmBtn}`}>{intl.get('common.confirm')}</Button> */}
    </Form>
  )
}

export default MetricsFilterPanel;