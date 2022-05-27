import React from 'react';
import { connect } from 'react-redux';
import intl from 'react-intl-universal';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import ServiceOverview from './ServiceOverview';
import { IDispatch, IRootState } from '@/store';
import Modal from '@/components/Modal';
import ServiceCardEdit from '@/components/Service/ServiceCardEdit';
import { METRIC_SERVICE_TYPES } from '@/utils/metric';
import MetricsFilterPanel from '@/components/MetricsFilterPanel';

import './index.less';

const mapDispatch: any = (dispatch: IDispatch) => ({
  asyncGetStatus: dispatch.service.asyncGetStatus,
  updatePanelConfig: values =>
    dispatch.service.update({
      panelConfig: values,
    }),
});

const mapState: any = (state: IRootState) => ({
  panelConfig: state.service.panelConfig,
  aliasConfig: state.app.aliasConfig,
  instanceList: state.service.instanceList as any,
  serviceMetric: state.serviceMetric,
});

interface IProps
  extends RouteComponentProps, ReturnType<typeof mapDispatch>,
  ReturnType<typeof mapState> { 
    onView: (serviceType: string) => void;
}

interface IState {
  editPanelType: string;
  editPanelIndex: number;
}
class ServiceDashboard extends React.Component<IProps, IState> {
  pollingTimer: any;

  modalHandler;

  constructor(props: IProps) {
    super(props);
    this.state = {
      editPanelType: '',
      editPanelIndex: 0,
    };
  }

  handleConfigPanel = (serviceType: string, index: number) => {
    this.setState(
      {
        editPanelType: serviceType,
        editPanelIndex: index,
      },
      this.modalHandler.show,
    );
  };

  handleModalClose = () => {
    if (this.modalHandler) {
      this.modalHandler.hide();
    }
  };

  handleView = (serviceType: string) => {
    this.props.history.push(`/service/${serviceType}-metrics`);
  };

  render() {
    const { editPanelType, editPanelIndex } = this.state;
    const { panelConfig, serviceMetric, updatePanelConfig, asyncGetStatus, onView, instanceList } =
      this.props;

    // TODO: Use hooks to resolve situations where render is jamming
    return (
      <>
        <div className="service-table">
          <div className='common-header' >
            <MetricsFilterPanel instanceList={instanceList} />
          </div>
          {METRIC_SERVICE_TYPES.map(type => (
            <ServiceOverview
              key={type}
              serviceType={type}
              icon={`#iconnav-${type}`}
              configs={panelConfig[type]}
              getStatus={asyncGetStatus}
              onConfigPanel={this.handleConfigPanel}
              onView={onView ?? this.handleView}
            />
          ))}
          <Modal
            className="modal-show-selected"
            width="750px"
            handlerRef={handler => (this.modalHandler = handler)}
            title={intl.get('service.queryCondition')}
            footer={null}
          >
            <ServiceCardEdit
              serviceMetric={serviceMetric}
              editType={editPanelType}
              editIndex={editPanelIndex}
              panelConfig={panelConfig}
              onClose={this.handleModalClose}
              onPanelConfigUpdate={updatePanelConfig}
            />
          </Modal>
        </div>
      </>
    );
  }
}

export default connect(mapState, mapDispatch)(withRouter(ServiceDashboard));
