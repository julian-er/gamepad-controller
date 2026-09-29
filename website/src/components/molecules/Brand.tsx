import { Icon } from '../atoms/Icon';
import { Fragment } from 'react';
import { packageName } from '../../package-info';

export function Brand() {
    return <a className="brand" href="#/"><span className="brand-icon"><Icon /></span><span>{packageName.split('-').map((part, index) => <Fragment key={index}>{index > 0 && <span className="brand-divider">-</span>}{part}</Fragment>)}<span className="brand-dot">.</span></span></a>;
}
